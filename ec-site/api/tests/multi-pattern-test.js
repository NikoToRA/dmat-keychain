/**
 * DMAT EC サイト 複数パターン統合テスト
 * ACS メール + Notion DB を様々な会計パターンで検証
 *
 * 使い方: 環境変数を渡して実行
 */

const { EmailClient } = require('@azure/communication-email');
const { Client } = require('@notionhq/client');

// 環境変数チェック
const required = ['ACS_CONNECTION_STRING', 'ACS_SENDER_ADDRESS', 'NOTION_TOKEN', 'NOTION_DATABASE_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`環境変数 ${key} が未設定です`);
    process.exit(1);
  }
}

const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DATABASE_ID;
const SENDER = process.env.ACS_SENDER_ADDRESS;
const TO_EMAIL = 'super206cc@gmail.com';

// テストパターン定義
const TEST_PATTERNS = [
  {
    orderId: 'TEST-P1',
    title: '隊員用ベーシック×1（最小注文）',
    items: [
      { name: 'DMAT キーホルダー（スタンダードレッド）', qty: 1, unit: 680 }
    ],
    shipping: { method: 'クリックポスト', price: 185 },
    category: 'dmat-member',
    customer: { name: '山田太郎', phone: '090-1234-5678', postal: '064-0805', address: '北海道札幌市中央区南5条西15丁目' },
  },
  {
    orderId: 'TEST-P2',
    title: '隊員用カラビナ付き×3（複数個・同一商品）',
    items: [
      { name: 'DMAT キーホルダー（スタンダードレッド）+ カラビナ', qty: 3, unit: 980 }
    ],
    shipping: { method: 'クリックポスト', price: 185 },
    category: 'dmat-member',
    customer: { name: '佐藤花子', phone: '080-9876-5432', postal: '100-0001', address: '東京都千代田区千代田1-1' },
  },
  {
    orderId: 'TEST-P3',
    title: '病院用ベーシック×5（送料切り替え・レターパック）',
    items: [
      { name: 'DMAT キーホルダー（スタンダードレッド）（病院向け）', qty: 5, unit: 980 }
    ],
    shipping: { method: 'レターパックライト', price: 370 },
    category: 'hospital',
    customer: { name: '田中病院 総務課', phone: '06-1234-5678', postal: '530-0001', address: '大阪府大阪市北区梅田1-1-1' },
  },
  {
    orderId: 'TEST-P4',
    title: '複数商品ミックス（隊員用+病院用）',
    items: [
      { name: 'DMAT キーホルダー（スタンダードレッド）', qty: 2, unit: 680 },
      { name: 'DMAT キーホルダー（ブラック）+ 蓄光バンド（病院向け）', qty: 1, unit: 1380 },
    ],
    shipping: { method: 'クリックポスト', price: 185 },
    category: 'mixed',
    customer: { name: '鈴木一郎', phone: '070-1111-2222', postal: '460-0008', address: '愛知県名古屋市中区栄3-1-1' },
  },
  {
    orderId: 'TEST-P5',
    title: 'フル装備×10（大量注文・病院一括導入）',
    items: [
      { name: 'DMAT キーホルダー（プレミアレッド）+ カラビナ + 蓄光バンド（病院向け）', qty: 10, unit: 1680 }
    ],
    shipping: { method: 'レターパックライト', price: 370 },
    category: 'hospital',
    customer: { name: '○○災害拠点病院 防災管理室', phone: '03-9999-0000', postal: '160-0023', address: '東京都新宿区西新宿2-8-1' },
  },
];

// メールHTML生成
function buildEmailHtml(pattern) {
  const itemsHtml = pattern.items.map(item =>
    `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">&yen;${(item.unit * item.qty).toLocaleString()}</td>
    </tr>`
  ).join('');

  const subtotal = pattern.items.reduce((s, i) => s + i.unit * i.qty, 0);
  const total = subtotal + pattern.shipping.price;

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A1A;">
      <div style="background: #1B2838; padding: 28px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 18px; letter-spacing: 0.06em;">DMAT STORE</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; margin: 0 0 8px;">${pattern.customer.name} 様</p>
        <p style="font-size: 14px; color: #666; margin: 0 0 24px;">Wonder Drill株式会社です。お買い上げありがとうございます。</p>

        <table style="width: 100%; border-collapse: collapse; margin: 0 0 8px; background: #f9f9f9; border-radius: 4px;">
          <tr><td style="padding: 12px; font-size: 13px; color: #999;">注文番号</td><td style="padding: 12px; font-weight: 700;">${pattern.orderId}</td></tr>
        </table>

        <h3 style="font-size: 14px; color: #1B2838; border-bottom: 2px solid #C41E3A; padding-bottom: 8px; margin: 24px 0 12px;">ご注文内容</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px 12px; text-align: left;">商品名</th>
            <th style="padding: 10px 12px; text-align: center; width: 60px;">数量</th>
            <th style="padding: 10px 12px; text-align: right; width: 100px;">小計</th>
          </tr>
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 10px 12px; text-align: right; color: #999; font-size: 13px;">送料（${pattern.shipping.method}）</td>
            <td style="padding: 10px 12px; text-align: right;">&yen;${pattern.shipping.price.toLocaleString()}</td>
          </tr>
          <tr style="font-weight: 700; background: #f9f9f9;">
            <td colspan="2" style="padding: 14px 12px; text-align: right; font-size: 15px;">合計（税込・送料込）</td>
            <td style="padding: 14px 12px; text-align: right; color: #C41E3A; font-size: 18px;">&yen;${total.toLocaleString()}</td>
          </tr>
        </table>

        <h3 style="font-size: 14px; color: #1B2838; border-bottom: 2px solid #C41E3A; padding-bottom: 8px; margin: 24px 0 12px;">配送先</h3>
        <p style="font-size: 14px; margin: 0;">&lang;${pattern.customer.postal}&rang; ${pattern.customer.address}</p>

        <div style="background: #fffbeb; border-left: 4px solid #ecc94b; padding: 12px; margin: 24px 0;">
          <p style="margin: 0; font-size: 13px;">本商品は<strong>受注生産</strong>のため、ご注文確定後<strong>10日以内</strong>に発送いたします。</p>
          <p style="margin: 8px 0 0; font-size: 13px;">領収書はStripeよりメールでお届けします。</p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #999;">
          ご不明点は <a href="mailto:support@wonder-drill.com" style="color: #1B2838;">support@wonder-drill.com</a> までお問い合わせください。<br>
          Wonder Drill株式会社
        </p>
      </div>
    </div>
  `;
}

// Notion登録
async function registerNotion(pattern) {
  const subtotal = pattern.items.reduce((s, i) => s + i.unit * i.qty, 0);
  const totalQty = pattern.items.reduce((s, i) => s + i.qty, 0);
  const productNames = pattern.items.map(i => `${i.name} x${i.qty}`).join(', ');
  const shippingSelect = pattern.shipping.price === 370 ? 'レターパックライト' : 'クリックポスト';

  return notion.pages.create({
    parent: { database_id: DB_ID },
    properties: {
      '注文番号': { title: [{ text: { content: pattern.orderId } }] },
      '顧客名': { rich_text: [{ text: { content: pattern.customer.name } }] },
      'メールアドレス': { email: TO_EMAIL },
      '電話番号': { phone_number: pattern.customer.phone },
      '郵便番号': { rich_text: [{ text: { content: pattern.customer.postal } }] },
      '住所': { rich_text: [{ text: { content: pattern.customer.address } }] },
      '商品名一覧': { rich_text: [{ text: { content: productNames } }] },
      '合計個数': { number: totalQty },
      '送料区分': { select: { name: shippingSelect } },
      '発送ステータス': { select: { name: '未対応' } },
      '注文日時': { date: { start: new Date().toISOString() } },
      'Notion作成元': { select: { name: 'test' } },
    },
  });
}

// メール送信
async function sendEmail(pattern) {
  const subtotal = pattern.items.reduce((s, i) => s + i.unit * i.qty, 0);
  const total = subtotal + pattern.shipping.price;

  const message = {
    senderAddress: SENDER,
    content: {
      subject: `【DMAT STORE】ご注文確認 ${pattern.orderId}（テスト）`,
      html: buildEmailHtml(pattern),
    },
    recipients: {
      to: [{ address: TO_EMAIL, displayName: pattern.customer.name }],
    },
  };

  const poller = await emailClient.beginSend(message);
  return poller.pollUntilDone();
}

// メイン実行
async function main() {
  console.log(`=== DMAT STORE 統合テスト（${TEST_PATTERNS.length}パターン）===\n`);

  for (const pattern of TEST_PATTERNS) {
    const subtotal = pattern.items.reduce((s, i) => s + i.unit * i.qty, 0);
    const total = subtotal + pattern.shipping.price;
    console.log(`--- ${pattern.orderId}: ${pattern.title} ---`);
    console.log(`  合計: ¥${total.toLocaleString()}（送料: ${pattern.shipping.method} ¥${pattern.shipping.price}）`);

    try {
      // Notion登録
      const page = await registerNotion(pattern);
      console.log(`  Notion: OK (${page.id})`);
    } catch (err) {
      console.error(`  Notion: FAILED - ${err.message}`);
    }

    try {
      // メール送信
      const result = await sendEmail(pattern);
      console.log(`  メール: ${result.status} (${result.id})`);
    } catch (err) {
      console.error(`  メール: FAILED - ${err.message}`);
    }

    console.log('');
  }

  console.log('=== 完了 ===');
  console.log(`${TO_EMAIL} の受信トレイを確認してください`);
  console.log(`Notion DB を確認してください`);
}

main().catch(err => {
  console.error('致命的エラー:', err.message);
  process.exit(1);
});
