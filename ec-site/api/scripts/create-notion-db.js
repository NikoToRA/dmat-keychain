#!/usr/bin/env node
// Notion 発送管理DB作成スクリプト
// Usage: node api/scripts/create-notion-db.js <parent-page-id>
// Required env: NOTION_TOKEN

const { Client } = require('@notionhq/client');

const parentPageId = process.argv[2];
if (!parentPageId) {
  console.error('Usage: node api/scripts/create-notion-db.js <parent-page-id>');
  process.exit(1);
}

const token = process.env.NOTION_TOKEN;
if (!token) {
  console.error('Error: NOTION_TOKEN 環境変数が設定されていません');
  process.exit(1);
}

const notion = new Client({ auth: token });

async function createShippingDB() {
  // Step 1: DB作成（status タイプはオプション指定不可のため、まず空で作成）
  console.log('発送管理DB を作成中...');
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    icon: { type: 'emoji', emoji: '📦' },
    title: [{ type: 'text', text: { content: 'DMAT キーホルダー発送管理' } }],
    properties: {
      '注文番号': { title: {} },
      'Stripe Checkout Session ID': { rich_text: {} },
      'Stripe Payment Intent ID': { rich_text: {} },
      '顧客名': { rich_text: {} },
      'メールアドレス': { email: {} },
      '電話番号': { phone_number: {} },
      '郵便番号': { rich_text: {} },
      '住所': { rich_text: {} },
      '商品名一覧': { rich_text: {} },
      '商品明細JSON': { rich_text: {} },
      '合計個数': { number: { format: 'number' } },
      '送料区分': {
        select: {
          options: [
            { name: 'クリックポスト', color: 'blue' },
            { name: 'レターパックライト', color: 'purple' },
          ],
        },
      },
      '発送ステータス': { status: {} },
      '注文日時': { date: {} },
      '発送予定日': { date: {} },
      '発送日': { date: {} },
      '追跡番号': { rich_text: {} },
      'メモ': { rich_text: {} },
      'Notion作成元': {
        select: {
          options: [
            { name: 'auto', color: 'green' },
            { name: 'manual', color: 'gray' },
          ],
        },
      },
    },
  });

  const dbId = db.id;
  console.log(`DB作成完了: ${dbId}`);

  // Step 2: 発送ステータスの status オプションを確認
  // Notion API では status タイプのオプションを API から設定できない制限あり
  // デフォルトで作成される "Not started" / "In progress" / "Done" が設定される
  // カスタムオプション（未対応/製作中/...）は Notion UI から手動設定が必要
  const created = await notion.databases.retrieve({ database_id: dbId });
  const statusProp = created.properties['発送ステータス'];

  if (statusProp && statusProp.type === 'status') {
    console.log('\n発送ステータス（status タイプ）が作成されました。');
    console.log('デフォルトオプション:');
    for (const opt of statusProp.status.options) {
      console.log(`  - ${opt.name} (${opt.color})`);
    }
    console.log('\n⚠️  Notion UI で以下のオプションに変更してください:');
    console.log('  未対応 / 製作中 / 発送準備中 / 発送済み / 要確認');
  } else {
    // status タイプが作成できなかった場合、select で代用
    console.log('\n⚠️  status タイプが作成できませんでした。select タイプで代用します...');
    await notion.databases.update({
      database_id: dbId,
      properties: {
        '発送ステータス': {
          select: {
            options: [
              { name: '未対応', color: 'default' },
              { name: '製作中', color: 'blue' },
              { name: '発送準備中', color: 'yellow' },
              { name: '発送済み', color: 'green' },
              { name: '要確認', color: 'red' },
            ],
          },
        },
      },
    });
    console.log('select タイプで発送ステータスを作成しました。');
  }

  // 最終確認
  const final = await notion.databases.retrieve({ database_id: dbId });
  console.log(`\n=== 作成完了 ===`);
  console.log(`DB名: DMAT キーホルダー発送管理`);
  console.log(`DB ID: ${dbId}`);
  console.log(`URL: ${final.url}`);
  console.log(`プロパティ数: ${Object.keys(final.properties).length}`);
  console.log('\nプロパティ一覧:');
  for (const [name, prop] of Object.entries(final.properties).sort()) {
    let extra = '';
    if (prop.type === 'select') {
      const opts = prop.select.options.map(o => o.name).join(' / ');
      extra = ` [${opts}]`;
    } else if (prop.type === 'status') {
      const opts = prop.status.options.map(o => o.name).join(' / ');
      extra = ` [${opts}]`;
    }
    console.log(`  ${name}: ${prop.type}${extra}`);
  }

  console.log(`\n.env に追加してください:`);
  console.log(`NOTION_DATABASE_ID=${dbId}`);
}

createShippingDB().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
