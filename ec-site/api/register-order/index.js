const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { EmailClient } = require('@azure/communication-email');
const { Client } = require('@notionhq/client');

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async function (context, req) {
  try {
    const { sessionId, items } = req.body;

    if (!sessionId || !items || !Array.isArray(items)) {
      context.res = { status: 400, body: { error: 'sessionId と items が必要です' } };
      return;
    }

    // Stripe セッションを検証（実際に決済されたか確認）
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      context.res = { status: 400, body: { error: '未決済のセッションです' } };
      return;
    }

    // DMAT STORE の注文か確認
    if (session.metadata?.service !== 'dmat-store') {
      context.res = { status: 400, body: { error: '無効なセッションです' } };
      return;
    }

    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const customerPhone = session.customer_details?.phone;
    const address = session.customer_details?.address;
    const orderId = `DMAT-${Date.now().toString(36).toUpperCase()}`;

    const fullAddress = address
      ? `〒${address.postal_code || ''} ${address.state || ''}${address.city || ''}${address.line1 || ''}${address.line2 || ''}`
      : '';

    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const shippingMethod = totalQuantity <= 4 ? 'clickpost' : 'letterpack';

    // 1. Notion 顧客管理DB
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const productNames = items.map(i => `${i.description || i.name || ''} x${i.quantity}`).join(', ');

    const orderPage = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        '注文番号': { title: [{ text: { content: orderId } }] },
        '顧客名': { rich_text: [{ text: { content: customerName || '' } }] },
        'メールアドレス': { email: customerEmail },
        '電話番号': { phone_number: customerPhone || '' },
        '郵便番号': { rich_text: [{ text: { content: address?.postal_code || '' } }] },
        '住所': { rich_text: [{ text: { content: fullAddress } }] },
        '商品名一覧': { rich_text: [{ text: { content: productNames } }] },
        '合計個数': { number: totalQuantity },
        '送料区分': { select: { name: shippingMethod.includes('letterpack') ? 'レターパックライト' : 'クリックポスト' } },
        '発送ステータス': { select: { name: '注文受付' } },
        '注文日時': { date: { start: new Date().toISOString() } },
        'Notion作成元': { select: { name: 'auto' } },
      },
    });

    // 2. Notion 商品管理DB（並列）
    const itemsDbId = process.env.NOTION_ORDER_ITEMS_DB_ID;
    if (itemsDbId) {
      await Promise.all(items.map(item => {
        const category = item.category || 'dmat-member';
        return notion.pages.create({
          parent: { database_id: itemsDbId },
          properties: {
            '明細ID': { title: [{ text: { content: `${orderId}-${item.quantity}x` } }] },
            '注文': { relation: [{ id: orderPage.id }] },
            '商品名': { select: { name: item.productName || 'ベーシック' } },
            ...(item.colorName ? { 'カラー': { select: { name: item.colorName } } } : {}),
            '用途': { select: { name: category === 'hospital' ? '病院用' : 'DMAT隊員用' } },
            '個数': { number: item.quantity },
            '単価': { number: item.unitPrice || 0 },
          },
        });
      }));
    }

    // 3. ACS メール送信
    const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);
    const subtotal = items.reduce((sum, i) => sum + (i.unitPrice || 0) * (i.quantity || 0), 0);
    const shippingPrice = session.amount_total - subtotal;

    const itemsHtml = items.map(i =>
      `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${escapeHtml(i.description || i.name || '')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">&yen;${(i.unitPrice * i.quantity).toLocaleString()}</td>
      </tr>`
    ).join('');

    const shippingHtml = shippingPrice > 0 ? `<tr>
      <td colspan="2" style="padding:10px 12px;text-align:right;color:#999;font-size:13px;">送料</td>
      <td style="padding:10px 12px;text-align:right;">&yen;${shippingPrice.toLocaleString()}</td>
    </tr>` : '';

    const htmlContent = `
    <div style="font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A;background:#fff;">
      <div style="background:#1B2838;padding:28px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;letter-spacing:0.06em;">DMAT STORE</h1>
      </div>
      <div style="padding:32px 24px;">
        <p style="font-size:15px;margin:0 0 8px;">${escapeHtml(customerName)} 様</p>
        <p style="font-size:14px;color:#6B6B6B;margin:0 0 28px;">Wonder Drill株式会社です。お買い上げありがとうございます。</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 8px;background:#F5F5F5;border-radius:4px;">
          <tr><td style="padding:12px;font-size:13px;color:#999;">注文番号</td><td style="padding:12px;font-weight:700;">${orderId}</td></tr>
        </table>
        <h3 style="font-size:14px;color:#1B2838;border-bottom:2px solid #C41E3A;padding-bottom:8px;margin:28px 0 12px;">ご注文内容</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#F5F5F5;"><th style="padding:10px 12px;text-align:left;">商品名</th><th style="padding:10px 12px;text-align:center;width:60px;">数量</th><th style="padding:10px 12px;text-align:right;width:100px;">小計</th></tr>
          ${itemsHtml}
          ${shippingHtml}
          <tr style="font-weight:700;background:#F9F9F9;">
            <td colspan="2" style="padding:14px 12px;text-align:right;font-size:15px;">合計（税込・送料込）</td>
            <td style="padding:14px 12px;text-align:right;color:#C41E3A;font-size:18px;">&yen;${session.amount_total.toLocaleString()}</td>
          </tr>
        </table>
        <h3 style="font-size:14px;color:#1B2838;border-bottom:2px solid #C41E3A;padding-bottom:8px;margin:28px 0 12px;">配送先</h3>
        <p style="font-size:14px;margin:0;">${escapeHtml(fullAddress)}</p>
        <div style="background:#FFFBEB;border-left:4px solid #ECC94B;padding:14px;margin:28px 0;">
          <p style="margin:0;font-size:13px;">受注生産のため、ご注文確定後<strong>10日以内</strong>に発送いたします。</p>
        </div>
        <div style="background:#F0F7FF;border-left:4px solid #3182CE;padding:14px;margin:0 0 28px;">
          <p style="margin:0;font-size:13px;"><strong>領収書について</strong></p>
          <p style="margin:8px 0 0;font-size:13px;">領収書は決済サービス（Stripe）より別途メールでお届けします。</p>
        </div>
        <hr style="border:none;border-top:1px solid #E8E8E8;margin:0 0 20px;">
        <p style="font-size:12px;color:#999;margin:0;">ご不明点は <a href="mailto:support@wonder-drill.com" style="color:#1B2838;">support@wonder-drill.com</a> まで<br>Wonder Drill株式会社</p>
      </div>
    </div>`;

    await emailClient.beginSend({
      senderAddress: process.env.ACS_SENDER_ADDRESS,
      content: { subject: `【DMAT STORE】ご注文確認 ${orderId}`, html: htmlContent },
      recipients: { to: [{ address: customerEmail, displayName: customerName }] },
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { success: true, orderId },
    };
  } catch (err) {
    context.log.error('register-order error:', err.message);
    context.res = {
      status: 500,
      body: { error: '注文登録に失敗しました', detail: err.message },
    };
  }
};
