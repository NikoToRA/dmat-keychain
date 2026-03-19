const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { EmailClient } = require('@azure/communication-email');
const { Client } = require('@notionhq/client');

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Module-level Notion client（idempotency check + registerNotion で共用）
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// インメモリキャッシュ（Notion問い合わせを減らす高速パス）
const processedSessions = new Map();
const MAX_CACHE = 1000;

module.exports = async function (context, req) {
  // Stripe webhookイベントからセッションIDを取得
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  if (!body || body.type !== 'checkout.session.completed') {
    context.res = { status: 200, body: 'OK' };
    return;
  }

  const sessionId = body.data?.object?.id;
  if (!sessionId) {
    context.res = { status: 400, body: 'No session ID' };
    return;
  }

  // 二重処理防止
  if (processedSessions.has(sessionId)) {
    context.res = { status: 200, body: 'Already processed' };
    return;
  }

  // Stripe APIで直接セッションを検証（署名検証の代わり）
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    context.log.error('Session retrieve failed:', err.message);
    context.res = { status: 400, body: 'Invalid session' };
    return;
  }

  // 決済済みか確認
  if (session.payment_status !== 'paid') {
    context.res = { status: 200, body: 'Not paid' };
    return;
  }

  // DMAT STORE の注文のみ処理
  if (session.metadata?.service !== 'dmat-store') {
    context.res = { status: 200, body: 'Not DMAT STORE' };
    return;
  }

  try {
    // Stripe から商品明細を取得
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
    const shipping = session.shipping_details || { address: session.customer_details?.address };
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const customerPhone = session.customer_details?.phone;

    const orderId = session.payment_intent;

    const productItems = lineItems.data.filter(item => !item.description.includes('送料'));
    const shippingItem = lineItems.data.find(item => item.description.includes('送料'));

    function cleanDesc(desc) {
      return desc.replace(/\s*\+\s*ボールチェーン/g, '').replace(/ボールチェーン\s*\+\s*/g, '');
    }

    const productNames = productItems.map(
      item => `${cleanDesc(item.description)} x${item.quantity}`
    ).join(', ');
    const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
    const shippingMethod = session.metadata?.shipping_method || 'clickpost';

    const address = shipping?.address
      ? `〒${shipping.address.postal_code || ''} ${shipping.address.state || ''}${shipping.address.city || ''}${shipping.address.line1 || ''}${shipping.address.line2 || ''}`
      : '';

    const emailData = {
      orderId, customerEmail, customerName, productItems,
      totalAmount: session.amount_total, address,
      shippingCost: shippingItem ? shippingItem.amount_total : 0,
      shippingLabel: shippingItem ? shippingItem.description : '',
    };

    const notionData = {
      orderId, sessionId, paymentIntentId: session.payment_intent,
      customerName, customerEmail, customerPhone,
      address, postalCode: shipping?.address?.postal_code || '',
      productNames, productItems, totalQuantity, shippingMethod,
    };

    // ---- 永続的冪等性: Notion DBで注文の存在と状態を確認 ----
    let notionDone = false;
    let emailDone = false;

    try {
      const existing = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        filter: { property: '注文番号', title: { equals: orderId } },
      });
      if (existing.results.length > 0) {
        notionDone = true;
        // メモ欄に「メール送信済み」があるか確認
        const memo = existing.results[0].properties['メモ']?.rich_text?.[0]?.plain_text || '';
        if (memo.includes('EMAIL_SENT')) {
          emailDone = true;
        }
        context.log.info('Order exists in Notion. notionDone=true, emailDone=' + emailDone);
      }
    } catch (queryErr) {
      context.log.warn('Notion dedup query failed:', queryErr.message);
      // クエリ失敗 → 安全側に倒す（処理続行。最悪重複するが欠落しない）
    }

    // ---- Step 1: Notion登録（未済の場合のみ） ----
    let notionPageId = null;
    if (!notionDone) {
      await registerNotion(context, notionData);
      context.log.info('Notion OK:', orderId);
      // 登録したページIDを取得（メモ更新用）
      const pages = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        filter: { property: '注文番号', title: { equals: orderId } },
      });
      notionPageId = pages.results[0]?.id;
    } else {
      notionPageId = (await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID,
        filter: { property: '注文番号', title: { equals: orderId } },
      })).results[0]?.id;
    }

    // ---- Step 2: メール送信（未済の場合のみ） ----
    if (!emailDone) {
      await sendEmail(context, emailData);
      context.log.info('Email OK:', orderId);
      // メモ欄にEMAIL_SENTフラグを書き込み（リトライ時にメール再送を防ぐ）
      if (notionPageId) {
        await notion.pages.update({
          page_id: notionPageId,
          properties: {
            'メモ': { rich_text: [{ text: { content: 'EMAIL_SENT:' + new Date().toISOString() } }] },
          },
        }).catch(err => context.log.warn('Memo update failed:', err.message));
      }
    } else {
      context.log.info('Email already sent, skipping:', orderId);
    }

    // 全成功 → 200
    if (processedSessions.size >= MAX_CACHE) {
      processedSessions.delete(processedSessions.keys().next().value);
    }
    processedSessions.set(sessionId, Date.now());
    context.res = { status: 200, body: 'OK' };
  } catch (err) {
    context.log.error('Webhook error:', err.message);
    context.res = { status: 500, body: 'Processing failed' };
  }
};

// ACS メール送信
async function sendEmail(context, data) {
  const { orderId, customerEmail, customerName, productItems, totalAmount, address, shippingCost, shippingLabel } = data;

  const itemsHtml = productItems.map(item =>
    `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.description.replace(/\s*\+\s*ボールチェーン/g,'').replace(/ボールチェーン\s*\+\s*/g,''))}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">&yen;${item.amount_total.toLocaleString()}</td></tr>`
  ).join('');

  const shippingHtml = shippingCost > 0 ? `<tr><td colspan="2" style="padding:10px 12px;text-align:right;color:#999;font-size:13px;">${shippingLabel || '送料'}</td><td style="padding:10px 12px;text-align:right;">&yen;${shippingCost.toLocaleString()}</td></tr>` : '';

  const html = `<div style="font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A;background:#fff;">
    <div style="background:#1B2838;padding:28px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;letter-spacing:0.06em;">DMAT STORE</h1></div>
    <div style="padding:32px 24px;">
      <p style="font-size:15px;margin:0 0 8px;">${escapeHtml(customerName)} 様</p>
      <p style="font-size:14px;color:#6B6B6B;margin:0 0 28px;">Wonder Drill株式会社です。お買い上げありがとうございます。</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 8px;background:#F5F5F5;border-radius:4px;"><tr><td style="padding:12px;font-size:13px;color:#999;">注文番号</td><td style="padding:12px;font-weight:700;">${orderId}</td></tr></table>
      <h3 style="font-size:14px;color:#1B2838;border-bottom:2px solid #C41E3A;padding-bottom:8px;margin:28px 0 12px;">ご注文内容</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="background:#F5F5F5;"><th style="padding:10px 12px;text-align:left;">商品名</th><th style="padding:10px 12px;text-align:center;width:60px;">数量</th><th style="padding:10px 12px;text-align:right;width:100px;">小計</th></tr>
        ${itemsHtml}${shippingHtml}
        <tr style="font-weight:700;background:#F9F9F9;"><td colspan="2" style="padding:14px 12px;text-align:right;font-size:15px;">合計（税込・送料込）</td><td style="padding:14px 12px;text-align:right;color:#C41E3A;font-size:18px;">&yen;${totalAmount.toLocaleString()}</td></tr>
      </table>
      <h3 style="font-size:14px;color:#1B2838;border-bottom:2px solid #C41E3A;padding-bottom:8px;margin:28px 0 12px;">配送先</h3>
      <p style="font-size:14px;margin:0;">${escapeHtml(address)}</p>
      <div style="background:#FFFBEB;border-left:4px solid #ECC94B;padding:14px;margin:28px 0;"><p style="margin:0;font-size:13px;">受注生産のため、ご注文確定後<strong>10日以内</strong>に発送いたします。</p></div>
      <div style="background:#F0F7FF;border-left:4px solid #3182CE;padding:14px;margin:0 0 28px;"><p style="margin:0;font-size:13px;"><strong>領収書について</strong></p><p style="margin:8px 0 0;font-size:13px;">領収書は決済サービス（Stripe）より別途メールでお届けします。</p></div>
      <hr style="border:none;border-top:1px solid #E8E8E8;margin:0 0 20px;">
      <p style="font-size:12px;color:#999;margin:0;">ご不明点は <a href="mailto:support@wonder-drill.com" style="color:#1B2838;">support@wonder-drill.com</a> まで<br>Wonder Drill株式会社</p>
    </div></div>`;

  const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);
  const poller = await emailClient.beginSend({
    senderAddress: process.env.ACS_SENDER_ADDRESS,
    content: { subject: `【DMAT STORE】ご注文確認 ${orderId}`, html },
    recipients: { to: [{ address: customerEmail, displayName: customerName }] },
  });
  // Poll with timeout (8 seconds max to stay within SWA limits)
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Email send timeout')), 8000)
  );
  await Promise.race([poller.pollUntilDone(), timeout]);
}

// Notion 登録（顧客管理 + 商品管理）
async function registerNotion(context, data) {

  // 顧客管理DB
  const orderPage = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      '注文番号': { title: [{ text: { content: data.orderId } }] },
      'Stripe Session ID': { rich_text: [{ text: { content: data.sessionId || '' } }] },
      'Payment Intent ID': { rich_text: [{ text: { content: data.paymentIntentId || '' } }] },
      '顧客名': { rich_text: [{ text: { content: data.customerName || '' } }] },
      'メールアドレス': { email: data.customerEmail },
      '電話番号': { phone_number: data.customerPhone || '' },
      '郵便番号': { rich_text: [{ text: { content: data.postalCode } }] },
      '住所': { rich_text: [{ text: { content: data.address } }] },
      '商品名一覧': { rich_text: [{ text: { content: data.productNames } }] },
      '合計個数': { number: data.totalQuantity },
      '送料区分': { select: { name: data.shippingMethod.includes('letterpack') ? 'レターパックライト' : 'クリックポスト' } },
      '発送ステータス': { select: { name: '注文受付' } },
      '注文日時': { date: { start: new Date().toISOString() } },
      'Notion作成元': { select: { name: 'auto' } },
    },
  });

  // 商品管理DB（並列）
  const itemsDbId = process.env.NOTION_ORDER_ITEMS_DB_ID;
  if (itemsDbId && data.productItems) {
    await Promise.all(data.productItems.map((item, idx) => {
      const desc = item.description || '';
      const colorMatch = desc.match(/（(.+?)）/);
      const colorName = colorMatch ? colorMatch[1] : '';
      const isHospital = desc.includes('病院向け');
      const hasCarabiner = desc.includes('カラビナ');
      const hasGlow = desc.includes('蓄光');
      let productName = 'ベーシック';
      if (hasCarabiner && hasGlow) productName = 'カラビナ+蓄光バンド付き';
      else if (hasCarabiner) productName = 'カラビナ付き';
      else if (hasGlow) productName = '蓄光バンド付き';

      return notion.pages.create({
        parent: { database_id: itemsDbId },
        properties: {
          '明細ID': { title: [{ text: { content: `${data.orderId}-${idx + 1}` } }] },
          '注文': { relation: [{ id: orderPage.id }] },
          '商品名': { select: { name: productName } },
          ...(colorName ? { 'カラー': { select: { name: colorName } } } : {}),
          '用途': { select: { name: isHospital ? '病院用' : 'DMAT隊員用' } },
          '個数': { number: item.quantity },
          '単価': { number: Math.round(item.amount_total / item.quantity) },
        },
      });
    }));
  }
}
