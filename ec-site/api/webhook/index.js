const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { EmailClient } = require('@azure/communication-email');
const { Client } = require('@notionhq/client');

const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// 二重処理防止用（インメモリ。本番はRedis等推奨）
// 最大1000件保持し、古いものから削除
const processedSessions = new Map();
const MAX_PROCESSED_CACHE = 1000;

function markProcessed(sessionId) {
  if (processedSessions.size >= MAX_PROCESSED_CACHE) {
    const oldest = processedSessions.keys().next().value;
    processedSessions.delete(oldest);
  }
  processedSessions.set(sessionId, Date.now());
}

module.exports = async function (context, req) {
  const sig = req.headers['stripe-signature'];

  // 署名検証
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    context.log.error('Webhook signature verification failed:', err.message);
    context.res = { status: 400, body: 'Webhook signature verification failed' };
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    context.res = { status: 200, body: 'OK' };
    return;
  }

  const session = event.data.object;

  // 二重処理防止
  if (processedSessions.has(session.id)) {
    context.log.warn('Duplicate session:', session.id);
    context.res = { status: 200, body: 'Already processed' };
    return;
  }

  try {
    // Stripe から詳細取得
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    // 住所: shipping_details > customer_details.address の優先順で取得
    const shipping = session.shipping_details || { address: session.customer_details?.address };
    const customerEmail = session.customer_details.email;
    const customerName = session.customer_details.name;
    const customerPhone = session.customer_details.phone;

    // 注文番号生成
    const orderId = `DMAT-${Date.now().toString(36).toUpperCase()}`;

    // 商品明細（送料行を除外）
    const productItems = lineItems.data.filter(
      item => !item.description.includes('送料')
    );
    const productNames = productItems.map(
      item => `${item.description.replace(/\s*\+\s*ボールチェーン/g, '').replace(/ボールチェーン\s*\+\s*/g, '')} x${item.quantity}`
    ).join(', ');
    const totalQuantity = productItems.reduce(
      (sum, item) => sum + item.quantity, 0
    );

    // 送料行を取得
    const shippingItem = lineItems.data.find(item => item.description.includes('送料'));
    const shippingCost = shippingItem ? shippingItem.amount_total : 0;
    const shippingLabel = shippingItem ? shippingItem.description : '';

    // 送料区分判定
    const shippingMethod = session.metadata?.shipping_method || (totalQuantity >= 5 ? 'letterpack' : 'clickpost');

    // ACS メール送信
    await sendConfirmationEmail(context, {
      orderId,
      customerEmail,
      customerName,
      productItems,
      totalAmount: session.amount_total,
      shipping,
      shippingCost,
      shippingLabel,
    });

    // Notion DB 登録（親: 発送管理 + 子: 注文明細）
    await registerToNotion(context, {
      orderId,
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      customerName,
      customerEmail,
      customerPhone,
      shipping,
      productNames,
      productItems,
      productItemsJson: JSON.stringify(lineItems.data),
      totalQuantity,
      shippingMethod,
    });

    markProcessed(session.id);
    context.log.info('Order processed:', orderId);
    context.res = { status: 200, body: 'OK' };
  } catch (err) {
    context.log.error('Webhook processing error:', err.message);
    // 処理失敗時は 500 を返し、Stripe にリトライさせる
    context.res = { status: 500, body: 'Processing failed' };
  }
};

async function sendConfirmationEmail(context, data) {
  const { orderId, customerEmail, customerName, productItems, totalAmount, shipping, shippingCost, shippingLabel } = data;

  // 商品名からボールチェーン（標準付属品）を除去
  function cleanDescription(desc) {
    return desc.replace(/\s*\+\s*ボールチェーン/g, '').replace(/ボールチェーン\s*\+\s*/g, '');
  }

  const itemsHtml = productItems.map(item =>
    `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${cleanDescription(item.description)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">&yen;${item.amount_total.toLocaleString()}</td>
    </tr>`
  ).join('');

  // 送料行
  const shippingHtml = shippingCost > 0 ? `<tr>
    <td colspan="2" style="padding: 10px 12px; text-align: right; color: #999; font-size: 13px;">${shippingLabel || '送料'}</td>
    <td style="padding: 10px 12px; text-align: right;">&yen;${shippingCost.toLocaleString()}</td>
  </tr>` : '';

  const address = shipping?.address
    ? `〒${shipping.address.postal_code} ${shipping.address.state}${shipping.address.city}${shipping.address.line1}${shipping.address.line2 || ''}`
    : '未入力';

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Sans', sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A1A; background: #ffffff;">
      <div style="background: #1B2838; padding: 28px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.06em;">DMAT STORE</h1>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; margin: 0 0 8px;">${customerName} 様</p>
        <p style="font-size: 14px; color: #6B6B6B; margin: 0 0 28px;">Wonder Drill株式会社です。お買い上げありがとうございます。<br>以下の内容でご注文を承りました。</p>

        <table style="width: 100%; border-collapse: collapse; margin: 0 0 8px; background: #F5F5F5; border-radius: 4px;">
          <tr><td style="padding: 12px; font-size: 13px; color: #999;">注文番号</td><td style="padding: 12px; font-weight: 700;">${orderId}</td></tr>
        </table>

        <h3 style="font-size: 14px; color: #1B2838; border-bottom: 2px solid #C41E3A; padding-bottom: 8px; margin: 28px 0 12px;">ご注文内容</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #F5F5F5;">
            <th style="padding: 10px 12px; text-align: left; font-weight: 500;">商品名</th>
            <th style="padding: 10px 12px; text-align: center; width: 60px; font-weight: 500;">数量</th>
            <th style="padding: 10px 12px; text-align: right; width: 100px; font-weight: 500;">小計</th>
          </tr>
          ${itemsHtml}
          ${shippingHtml}
          <tr style="font-weight: 700; background: #F9F9F9;">
            <td colspan="2" style="padding: 14px 12px; text-align: right; font-size: 15px;">合計（税込・送料込）</td>
            <td style="padding: 14px 12px; text-align: right; color: #C41E3A; font-size: 18px;">&yen;${totalAmount.toLocaleString()}</td>
          </tr>
        </table>

        <h3 style="font-size: 14px; color: #1B2838; border-bottom: 2px solid #C41E3A; padding-bottom: 8px; margin: 28px 0 12px;">配送先</h3>
        <p style="font-size: 14px; margin: 0;">${address}</p>

        <div style="background: #FFFBEB; border-left: 4px solid #ECC94B; padding: 14px; margin: 28px 0;">
          <p style="margin: 0; font-size: 13px;">本商品は<strong>受注生産</strong>のため、ご注文確定後<strong>10日以内</strong>に発送いたします。</p>
          <p style="margin: 8px 0 0; font-size: 13px;">発送時に追跡番号をメールでお知らせいたします。</p>
        </div>

        <div style="background: #F0F7FF; border-left: 4px solid #3182CE; padding: 14px; margin: 0 0 28px;">
          <p style="margin: 0; font-size: 13px;"><strong>領収書について</strong></p>
          <p style="margin: 8px 0 0; font-size: 13px;">領収書は決済サービス（Stripe）より別途メールでお届けします。届かない場合はお問い合わせください。</p>
        </div>

        <hr style="border: none; border-top: 1px solid #E8E8E8; margin: 0 0 20px;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          ご不明点は <a href="mailto:support@wonder-drill.com" style="color: #1B2838;">support@wonder-drill.com</a> までお問い合わせください。<br>
          Wonder Drill株式会社
        </p>
      </div>
    </div>
  `;

  const message = {
    senderAddress: process.env.ACS_SENDER_ADDRESS,
    content: {
      subject: `【DMAT STORE】ご注文確認 ${orderId}`,
      html: htmlContent,
    },
    recipients: {
      to: [{ address: customerEmail, displayName: customerName }],
    },
  };

  const poller = await emailClient.beginSend(message);
  await poller.pollUntilDone();
  context.log.info('Confirmation email sent to:', customerEmail);
}

async function registerToNotion(context, data) {
  const orderDate = new Date().toISOString();

  const address = data.shipping?.address
    ? `〒${data.shipping.address.postal_code} ${data.shipping.address.state}${data.shipping.address.city}${data.shipping.address.line1}${data.shipping.address.line2 || ''}`
    : '';

  // 1. 発送管理DB（親）に注文を登録
  const orderPage = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      '注文番号': { title: [{ text: { content: data.orderId } }] },
      'Stripe Checkout Session ID': { rich_text: [{ text: { content: data.sessionId } }] },
      'Payment Intent ID': { rich_text: [{ text: { content: data.paymentIntentId || '' } }] },
      '顧客名': { rich_text: [{ text: { content: data.customerName || '' } }] },
      'メールアドレス': { email: data.customerEmail },
      '電話番号': { phone_number: data.customerPhone || '' },
      '郵便番号': { rich_text: [{ text: { content: data.shipping?.address?.postal_code || '' } }] },
      '住所': { rich_text: [{ text: { content: address } }] },
      '商品名一覧': { rich_text: [{ text: { content: data.productNames } }] },
      '合計個数': { number: data.totalQuantity },
      '送料区分': { select: { name: data.shippingMethod === 'letterpack' ? 'レターパックライト' : 'クリックポスト' } },
      '発送ステータス': { select: { name: '注文受付' } },
      '注文日時': { date: { start: orderDate } },
      'Notion作成元': { select: { name: 'auto' } },
    },
  });

  context.log.info('Notion order registered:', data.orderId, orderPage.id);

  // 2. 注文明細DB（子）に商品ごとに登録
  const itemsDbId = process.env.NOTION_ORDER_ITEMS_DB_ID;
  if (itemsDbId && data.productItems) {
    for (const item of data.productItems) {
      const desc = item.description || '';
      // 商品名・カラー・用途をdescriptionからパース
      const colorMatch = desc.match(/（(.+?)）/);
      const colorName = colorMatch ? colorMatch[1] : '';
      const isHospital = desc.includes('病院向け');
      const hasCarabiner = desc.includes('カラビナ');
      const hasGlow = desc.includes('蓄光');
      let productName = 'ベーシック';
      if (hasCarabiner && hasGlow) productName = 'カラビナ+蓄光バンド付き';
      else if (hasCarabiner) productName = 'カラビナ付き';
      else if (hasGlow) productName = '蓄光バンド付き';

      await notion.pages.create({
        parent: { database_id: itemsDbId },
        properties: {
          '明細ID': { title: [{ text: { content: `${data.orderId}-${item.quantity}x` } }] },
          '注文': { relation: [{ id: orderPage.id }] },
          '商品名': { select: { name: productName } },
          'カラー': colorName ? { select: { name: colorName } } : undefined,
          '用途': { select: { name: isHospital ? '病院用' : 'DMAT隊員用' } },
          '個数': { number: item.quantity },
          '単価': { number: Math.round(item.amount_total / item.quantity) },
        },
      });
    }
    context.log.info('Notion order items registered:', data.productItems.length, 'items');
  }
}
