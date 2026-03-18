const { Client } = require('@notionhq/client');

module.exports = async function (context, req) {
  context.log.info('test-notion called');
  
  // 環境変数チェック
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DATABASE_ID;
  const itemsDbId = process.env.NOTION_ORDER_ITEMS_DB_ID;
  
  if (!token || !dbId) {
    context.res = { 
      status: 500, 
      body: { 
        error: 'Missing env vars',
        NOTION_TOKEN: token ? 'set (' + token.substring(0, 10) + '...)' : 'MISSING',
        NOTION_DATABASE_ID: dbId || 'MISSING',
        NOTION_ORDER_ITEMS_DB_ID: itemsDbId || 'MISSING',
      }
    };
    return;
  }

  try {
    const notion = new Client({ auth: token });
    
    // 顧客管理DBにテスト書き込み
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
    
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { 
        success: true, 
        pageId: orderPage.id,
        message: 'Notion write from SWA succeeded'
      }
    };
  } catch (err) {
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { 
        success: false, 
        error: err.message,
        code: err.code,
        body: JSON.stringify(err.body || {}).substring(0, 500)
      }
    };
  }
};
