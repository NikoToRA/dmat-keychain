// テスト用: webhookと同じ処理をStripe署名なしで実行
// 本番前に削除すること
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { EmailClient } = require('@azure/communication-email');
const { Client } = require('@notionhq/client');

module.exports = async function (context, req) {
  const steps = [];

  try {
    steps.push('1. Start');

    // 最新のcheckout.session.completedを取得
    const sessions = await stripe.checkout.sessions.list({ limit: 1 });
    const session = sessions.data[0];
    if (!session) {
      context.res = { status: 400, body: { error: 'No sessions found' } };
      return;
    }
    steps.push('2. Session: ' + session.id);
    steps.push('2a. Service: ' + (session.metadata?.service || 'none'));

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    steps.push('3. LineItems: ' + lineItems.data.length);

    const shipping = session.shipping_details || { address: session.customer_details?.address };
    steps.push('4. Address: ' + JSON.stringify(shipping?.address || {}));

    const productItems = lineItems.data.filter(item => !item.description.includes('送料'));
    steps.push('5. Products: ' + productItems.length);

    const orderId = 'SWATEST-' + Date.now().toString(36).toUpperCase();
    const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
    const productNames = productItems.map(i => i.description + ' x' + i.quantity).join(', ');
    const shippingMethod = session.metadata?.shipping_method || 'clickpost';

    // Notion顧客管理DB
    steps.push('6. Starting Notion parent...');
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const address = shipping?.address
      ? '〒' + (shipping.address.postal_code||'') + ' ' + (shipping.address.state||'') + (shipping.address.city||'') + (shipping.address.line1||'') + (shipping.address.line2||'')
      : '';

    const orderPage = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        '注文番号': { title: [{ text: { content: orderId } }] },
        '顧客名': { rich_text: [{ text: { content: session.customer_details?.name || '' } }] },
        'メールアドレス': { email: session.customer_details?.email },
        '電話番号': { phone_number: session.customer_details?.phone || '' },
        '郵便番号': { rich_text: [{ text: { content: shipping?.address?.postal_code || '' } }] },
        '住所': { rich_text: [{ text: { content: address } }] },
        '商品名一覧': { rich_text: [{ text: { content: productNames } }] },
        '合計個数': { number: totalQuantity },
        '送料区分': { select: { name: shippingMethod.includes('letterpack') ? 'レターパックライト' : 'クリックポスト' } },
        '発送ステータス': { select: { name: '注文受付' } },
        '注文日時': { date: { start: new Date().toISOString() } },
        'Notion作成元': { select: { name: 'test' } },
      },
    });
    steps.push('7. Notion parent OK: ' + orderPage.id);

    // Notion商品管理DB
    const itemsDbId = process.env.NOTION_ORDER_ITEMS_DB_ID;
    if (itemsDbId) {
      steps.push('8. Starting Notion items...');
      const itemPromises = productItems.map(item => {
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
            '明細ID': { title: [{ text: { content: orderId + '-' + item.quantity + 'x' } }] },
            '注文': { relation: [{ id: orderPage.id }] },
            '商品名': { select: { name: productName } },
            ...(colorName ? { 'カラー': { select: { name: colorName } } } : {}),
            '用途': { select: { name: isHospital ? '病院用' : 'DMAT隊員用' } },
            '個数': { number: item.quantity },
            '単価': { number: Math.round(item.amount_total / item.quantity) },
          },
        });
      });
      await Promise.all(itemPromises);
      steps.push('9. Notion items OK: ' + productItems.length + ' items');
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { success: true, orderId, steps }
    };
  } catch (err) {
    steps.push('ERROR: ' + err.message);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { success: false, error: err.message, code: err.code, steps }
    };
  }
};
