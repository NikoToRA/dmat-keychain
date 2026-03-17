/**
 * DMAT EC サイト 統合テスト
 * Stripe を介さず、ACS メール送信 + Notion DB 登録を直接テストする
 *
 * 使い方:
 *   cd /Users/suguruhirayama/dmatkeychain/ec-site/api
 *   node tests/integration-test.js
 *
 * 環境変数は SWA から取得済みの値をスクリプト内にフォールバックとして持つが、
 * 外部から上書きも可能。
 */

const { EmailClient } = require('@azure/communication-email');
const { Client } = require('@notionhq/client');

// --- 設定（環境変数から取得。ハードコード禁止） ---
const ACS_CONNECTION_STRING = process.env.ACS_CONNECTION_STRING;
const ACS_SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!ACS_CONNECTION_STRING || !NOTION_TOKEN) {
  console.error('必要な環境変数が設定されていません: ACS_CONNECTION_STRING, NOTION_TOKEN');
  process.exit(1);
}

// --- モック注文データ ---
const TEST_ORDER = {
  orderId: 'TEST-001',
  customerEmail: 'super206cc@gmail.com',
  customerName: 'テスト太郎',
  customerPhone: '090-0000-0000',
  productItems: [
    {
      description: 'DMAT キーホルダー（スタンダードレッド）',
      quantity: 2,
      amount_total: 1360,
    },
  ],
  totalAmount: 1545, // 商品 1360 + 送料 185
  shippingCost: 185,
  shipping: {
    address: {
      postal_code: '064-0805',
      state: '北海道',
      city: '札幌市中央区',
      line1: 'テスト町1-2-3',
      line2: 'テストビル101',
    },
  },
};

// --- ACS メール送信テスト ---
async function testSendEmail() {
  console.log('\n========================================');
  console.log('  [1/2] ACS メール送信テスト');
  console.log('========================================');

  const emailClient = new EmailClient(ACS_CONNECTION_STRING);
  const { orderId, customerEmail, customerName, productItems, totalAmount, shippingCost, shipping } = TEST_ORDER;

  const address = `〒${shipping.address.postal_code} ${shipping.address.state}${shipping.address.city}${shipping.address.line1}${shipping.address.line2 || ''}`;

  const itemsHtml = productItems.map(item =>
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">&yen;${item.amount_total.toLocaleString()}</td>
    </tr>`
  ).join('');

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2d3748;">
      <div style="background: #1a365d; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">DMAT キーホルダー ご注文確認</h1>
      </div>

      <div style="padding: 24px;">
        <p>Wonder Drill株式会社です。お買い上げありがとうございます。</p>
        <p>${customerName} 様</p>
        <p>この度はご注文いただき、誠にありがとうございます。<br>以下の内容でご注文を承りました。</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f7fafc; border-radius: 4px;">
          <tr><th style="padding: 12px; text-align: left; color: #4a5568;">注文番号</th><td style="padding: 12px; font-weight: bold;">${orderId}</td></tr>
        </table>

        <h3 style="color: #1a365d; border-bottom: 2px solid #e53e3e; padding-bottom: 8px;">今回の注文内容</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #edf2f7;">
            <th style="padding: 8px; text-align: left;">商品名</th>
            <th style="padding: 8px; text-align: center;">数量</th>
            <th style="padding: 8px; text-align: right;">小計</th>
          </tr>
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #718096;">送料（クリックポスト）</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #718096;">&yen;${shippingCost.toLocaleString()}</td>
          </tr>
          <tr style="font-weight: bold; background: #f7fafc;">
            <td colspan="2" style="padding: 12px; text-align: right;">合計（税込・送料込）</td>
            <td style="padding: 12px; text-align: right; color: #e53e3e; font-size: 18px;">&yen;${totalAmount.toLocaleString()}</td>
          </tr>
        </table>

        <h3 style="color: #1a365d; border-bottom: 2px solid #e53e3e; padding-bottom: 8px;">配送先</h3>
        <p>${address}</p>

        <h3 style="color: #1a365d; border-bottom: 2px solid #e53e3e; padding-bottom: 8px;">配送について</h3>
        <div style="background: #fffbeb; border-left: 4px solid #ecc94b; padding: 12px; margin: 8px 0;">
          <p style="margin: 0;">受注生産のため、<strong>10日以内に発送</strong>いたします。</p>
          <p style="margin: 8px 0 0 0;">発送時に追跡番号をメールでお知らせいたします。</p>
        </div>

        <p style="font-size: 14px; color: #718096;">領収書はStripeよりメールでお届けします。</p>

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
    senderAddress: ACS_SENDER_ADDRESS,
    content: {
      subject: `【DMAT STORE】ご注文確認テスト ${orderId}`,
      html: htmlContent,
    },
    recipients: {
      to: [{ address: customerEmail, displayName: customerName }],
    },
  };

  console.log(`  送信先: ${customerEmail}`);
  console.log(`  送信元: ${ACS_SENDER_ADDRESS}`);
  console.log(`  件名:   ${message.content.subject}`);
  console.log('  送信中...');

  const poller = await emailClient.beginSend(message);
  const result = await poller.pollUntilDone();

  console.log(`  結果: status=${result.status}, id=${result.id}`);
  if (result.status === 'Succeeded') {
    console.log('  [OK] メール送信成功');
  } else {
    throw new Error(`メール送信失敗: status=${result.status}, error=${JSON.stringify(result.error)}`);
  }
  return result;
}

// --- Notion DB 登録テスト ---
async function testRegisterNotion() {
  console.log('\n========================================');
  console.log('  [2/2] Notion DB 登録テスト');
  console.log('========================================');

  const notion = new Client({ auth: NOTION_TOKEN });
  const orderDate = new Date().toISOString();
  const { orderId, customerEmail, customerName, customerPhone, productItems, shipping } = TEST_ORDER;

  const address = `〒${shipping.address.postal_code} ${shipping.address.state}${shipping.address.city}${shipping.address.line1}${shipping.address.line2 || ''}`;
  const productNames = productItems.map(item => `${item.description} x${item.quantity}`).join(', ');
  const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);

  console.log(`  DB ID:    ${NOTION_DATABASE_ID}`);
  console.log(`  注文番号: ${orderId}`);
  console.log(`  顧客名:   ${customerName}`);
  console.log(`  商品:     ${productNames}`);
  console.log('  登録中...');

  const page = await notion.pages.create({
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {
      '注文番号': { title: [{ text: { content: orderId } }] },
      'Stripe Checkout Session ID': { rich_text: [{ text: { content: 'test_session_integration' } }] },
      'Payment Intent ID': { rich_text: [{ text: { content: 'test_pi_integration' } }] },
      '顧客名': { rich_text: [{ text: { content: customerName } }] },
      'メールアドレス': { email: customerEmail },
      '電話番号': { phone_number: customerPhone },
      '郵便番号': { rich_text: [{ text: { content: shipping.address.postal_code } }] },
      '住所': { rich_text: [{ text: { content: address } }] },
      '商品名一覧': { rich_text: [{ text: { content: productNames } }] },
      '商品明細JSON': { rich_text: [{ text: { content: JSON.stringify(productItems) } }] },
      '合計個数': { number: totalQuantity },
      '送料区分': { select: { name: 'クリックポスト' } },
      '発送ステータス': { select: { name: '未対応' } },
      '注文日時': { date: { start: orderDate } },
      'Notion作成元': { select: { name: 'test' } },
    },
  });

  console.log(`  Notion ページ ID: ${page.id}`);
  console.log(`  URL: ${page.url}`);
  console.log('  [OK] Notion DB 登録成功');
  return page;
}

// --- メイン ---
async function main() {
  console.log('=== DMAT EC サイト 統合テスト ===');
  console.log(`実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);

  const results = { email: null, notion: null };
  let hasError = false;

  // (1) ACS メール送信
  try {
    results.email = await testSendEmail();
  } catch (err) {
    console.error(`  [FAIL] メール送信エラー: ${err.message}`);
    hasError = true;
  }

  // (2) Notion DB 登録
  try {
    results.notion = await testRegisterNotion();
  } catch (err) {
    console.error(`  [FAIL] Notion 登録エラー: ${err.message}`);
    hasError = true;
  }

  // サマリー
  console.log('\n========================================');
  console.log('  テスト結果サマリー');
  console.log('========================================');
  console.log(`  ACS メール送信: ${results.email ? 'PASS' : 'FAIL'}`);
  console.log(`  Notion DB 登録: ${results.notion ? 'PASS' : 'FAIL'}`);
  console.log('========================================\n');

  if (hasError) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('予期しないエラー:', err);
  process.exit(1);
});
