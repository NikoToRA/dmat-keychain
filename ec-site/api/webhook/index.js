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
    const shipping = session.shipping_details;
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
      item => `${item.description} x${item.quantity}`
    ).join(', ');
    const totalQuantity = productItems.reduce(
      (sum, item) => sum + item.quantity, 0
    );

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
  const { orderId, customerEmail, customerName, productItems, totalAmount, shipping } = data;

  const itemsHtml = productItems.map(item =>
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">&yen;${item.amount_total.toLocaleString()}</td>
    </tr>`
  ).join('');

  const address = shipping?.address
    ? `〒${shipping.address.postal_code} ${shipping.address.state}${shipping.address.city}${shipping.address.line1}${shipping.address.line2 || ''}`
    : '未入力';

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2d3748;">
      <div style="background: #1a365d; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">DMAT キーホルダー ご注文確認</h1>
      </div>

      <div style="padding: 24px;">
        <p>${customerName} 様</p>
        <p>この度はご注文いただき、誠にありがとうございます。<br>以下の内容でご注文を承りました。</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f7fafc; border-radius: 4px;">
          <tr><th style="padding: 12px; text-align: left; color: #4a5568;">注文番号</th><td style="padding: 12px; font-weight: bold;">${orderId}</td></tr>
        </table>

        <h3 style="color: #1a365d; border-bottom: 2px solid #e53e3e; padding-bottom: 8px;">ご注文内容</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #edf2f7;">
            <th style="padding: 8px; text-align: left;">商品名</th>
            <th style="padding: 8px; text-align: center;">数量</th>
            <th style="padding: 8px; text-align: right;">小計</th>
          </tr>
          ${itemsHtml}
          <tr style="font-weight: bold; background: #f7fafc;">
            <td colspan="2" style="padding: 12px; text-align: right;">合計（税込・送料込）</td>
            <td style="padding: 12px; text-align: right; color: #e53e3e; font-size: 18px;">&yen;${totalAmount.toLocaleString()}</td>
          </tr>
        </table>

        <h3 style="color: #1a365d; border-bottom: 2px solid #e53e3e; padding-bottom: 8px;">配送先</h3>
        <p>${address}</p>

        <h3 style="color: #1a365d; border-bottom: 2px solid #e53e3e; padding-bottom: 8px;">配送について</h3>
        <div style="background: #fffbeb; border-left: 4px solid #ecc94b; padding: 12px; margin: 8px 0;">
          <p style="margin: 0;">本商品は<strong>受注生産</strong>のため、製作後に発送いたします。</p>
          <p style="margin: 8px 0 0 0;">ご注文確定後、<strong>10営業日以内</strong>に発送予定です。</p>
        </div>
        <p style="font-size: 14px; color: #718096;">発送時に追跡番号をメールでお知らせいたします。</p>

        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #718096; font-size: 13px;">
          ご不明点がございましたら、下記までお問い合わせください。<br>
          <a href="mailto:support@wonder-drill.com" style="color: #3182ce;">support@wonder-drill.com</a><br>
          Wonder Drill株式会社
        </p>
      </div>
    </div>
  `;

  const message = {
    senderAddress: process.env.ACS_SENDER_ADDRESS,
    content: {
      subject: `【DMAT キーホルダー】ご注文確認 ${orderId}`,
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
      '商品明細JSON': { rich_text: [{ text: { content: (data.productItemsJson || '').substring(0, 2000) } }] },
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
