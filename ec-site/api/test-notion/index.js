const { Client } = require('@notionhq/client');

module.exports = async function (context, req) {
  // GETの場合はNotion書き込みテスト
  if (req.method === 'GET') {
    const token = process.env.NOTION_TOKEN;
    const dbId = process.env.NOTION_DATABASE_ID;
    
    if (!token || !dbId) {
      context.res = { status: 500, body: { error: 'Missing env vars', NOTION_TOKEN: !!token, NOTION_DATABASE_ID: !!dbId } };
      return;
    }

    try {
      const notion = new Client({ auth: token });
      const orderPage = await notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          '注文番号': { title: [{ text: { content: 'SWA-TEST-' + Date.now() } }] },
          '顧客名': { rich_text: [{ text: { content: 'SWA動作テスト' } }] },
          'メールアドレス': { email: 'test@example.com' },
          '合計個数': { number: 1 },
          '発送ステータス': { select: { name: '注文受付' } },
          '注文日時': { date: { start: new Date().toISOString() } },
          'Notion作成元': { select: { name: 'test' } },
        },
      });
      context.res = { status: 200, body: { success: true, pageId: orderPage.id } };
    } catch (err) {
      context.res = { status: 500, body: { success: false, error: err.message } };
    }
    return;
  }

  // POSTの場合はwebhookデバッグ
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      rawBodyType: typeof req.rawBody,
      rawBodyExists: !!req.rawBody,
      rawBodyLength: req.rawBody ? req.rawBody.length : 0,
      bodyType: typeof req.body,
      bodyIsString: typeof req.body === 'string',
      bodyKeys: typeof req.body === 'object' ? Object.keys(req.body || {}).slice(0, 5) : [],
      headers: {
        'stripe-signature': req.headers['stripe-signature'] || 'NOT PRESENT',
        'content-type': req.headers['content-type'] || 'NOT PRESENT',
      },
      envVars: {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
        NOTION_TOKEN: !!process.env.NOTION_TOKEN,
        NOTION_DATABASE_ID: !!process.env.NOTION_DATABASE_ID,
        NOTION_ORDER_ITEMS_DB_ID: !!process.env.NOTION_ORDER_ITEMS_DB_ID,
        ACS_CONNECTION_STRING: !!process.env.ACS_CONNECTION_STRING,
        ACS_SENDER_ADDRESS: process.env.ACS_SENDER_ADDRESS || 'NOT SET',
      }
    }
  };
};
