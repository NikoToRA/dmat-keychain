/**
 * 親子リレーション構造テスト
 * 発送管理（親）+ 注文明細（子）の登録確認
 */
const { Client } = require('@notionhq/client');

const required = ['NOTION_TOKEN', 'NOTION_DATABASE_ID', 'NOTION_ORDER_ITEMS_DB_ID'];
for (const key of required) {
  if (!process.env[key]) { console.error(`${key} 未設定`); process.exit(1); }
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const ORDER_DB = process.env.NOTION_DATABASE_ID;
const ITEMS_DB = process.env.NOTION_ORDER_ITEMS_DB_ID;

async function main() {
  console.log('=== 親子リレーション テスト ===\n');

  // 1. 発送管理（親）を作成
  const order = await notion.pages.create({
    parent: { database_id: ORDER_DB },
    properties: {
      '注文番号': { title: [{ text: { content: 'TEST-REL-001' } }] },
      '顧客名': { rich_text: [{ text: { content: 'リレーションテスト太郎' } }] },
      'メールアドレス': { email: 'super206cc@gmail.com' },
      '電話番号': { phone_number: '090-0000-0000' },
      '郵便番号': { rich_text: [{ text: { content: '064-0805' } }] },
      '住所': { rich_text: [{ text: { content: '北海道札幌市中央区テスト' } }] },
      '商品名一覧': { rich_text: [{ text: { content: '病院用ベーシック x2, 隊員用カラビナ付き x3' } }] },
      '合計個数': { number: 5 },
      '送料区分': { select: { name: 'レターパックライト' } },
      '発送ステータス': { select: { name: '注文受付' } },
      '注文日時': { date: { start: new Date().toISOString() } },
      'Notion作成元': { select: { name: 'test' } },
    },
  });
  console.log(`親（発送管理）: OK - ${order.id}`);

  // 2. 注文明細（子）を作成 - 病院用ベーシック×2
  const item1 = await notion.pages.create({
    parent: { database_id: ITEMS_DB },
    properties: {
      '明細ID': { title: [{ text: { content: 'TEST-REL-001-1' } }] },
      '注文': { relation: [{ id: order.id }] },
      '商品名': { select: { name: 'ベーシック' } },
      'カラー': { select: { name: 'スタンダードレッド' } },
      '用途': { select: { name: '病院用' } },
      '個数': { number: 2 },
      '単価': { number: 980 },
    },
  });
  console.log(`子1（病院用ベーシック×2）: OK - ${item1.id}`);

  // 3. 注文明細（子）を作成 - 隊員用カラビナ付き×3
  const item2 = await notion.pages.create({
    parent: { database_id: ITEMS_DB },
    properties: {
      '明細ID': { title: [{ text: { content: 'TEST-REL-001-2' } }] },
      '注文': { relation: [{ id: order.id }] },
      '商品名': { select: { name: 'カラビナ付き' } },
      'カラー': { select: { name: 'スタンダードレッド' } },
      '用途': { select: { name: 'DMAT隊員用' } },
      '個数': { number: 3 },
      '単価': { number: 980 },
    },
  });
  console.log(`子2（隊員用カラビナ付き×3）: OK - ${item2.id}`);

  // 4. 親からリレーションを確認
  const parentPage = await notion.pages.retrieve({ page_id: order.id });
  console.log(`\n発送ステータス: ${parentPage.properties['発送ステータス']?.select?.name}`);
  console.log(`合計個数: ${parentPage.properties['合計個数']?.number}`);

  console.log('\n=== テスト完了 ===');
  console.log('Notion DBでリレーションを確認してください');
  console.log(`発送管理: https://www.notion.so/${order.id.replace(/-/g, '')}`);
}

main().catch(err => { console.error('エラー:', err.message); process.exit(1); });
