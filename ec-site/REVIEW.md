# コードレビュー結果

レビュー日: 2026-03-17
レビュー担当: QA Agent (Phase 8)

## テスト結果
- pricing: **PASS** (11/11)
- shipping: **PASS** (5/5)
- checkout: **PASS** (5/5)
- 合計: 21テスト全PASS

## セキュリティ
- [x] Webhook署名検証が実装されている (`api/webhook/index.js:27` - `stripe.webhooks.constructEvent`) — **PASS**
- [x] サーバー側価格再計算 (`api/checkout/index.js:23` - `calculateItemPrice`) — **PASS**
- [x] X-Content-Type-Options / X-Frame-Options ヘッダー設定済み (`staticwebapp.config.json:25-27`) — **PASS**
- [x] クレジットカード情報はStripe管理、サーバー不保存 — **PASS**
- [x] 二重処理防止 (`api/webhook/index.js:46` - `processedSessions`) — **PASS**
- [x] 日本国内限定配送 (`api/checkout/index.js:63` - `allowed_countries: ['JP']`) — **PASS**

### XSS分析
- `innerHTML` 使用箇所: `ui.js`, `cart.html`, `confirm.html`, `product.html`, `category.html`, `index.html`
- 全箇所で挿入されるデータはプリデファインドの商品マスタ定数（`COLOR_VARIANTS`, `ACCESSORIES`, `RECOMMENDED_SETS`）から生成されており、ユーザー入力を直接埋め込む箇所なし
- `showToast(message)` の引数はサーバーエラーメッセージ or 固定文字列のみ
- `category.html` のURLパラメータ `cat` は `textContent` で挿入しており安全
- **PASS** — XSS脆弱性なし

## 要件定義照合 (REQUIREMENT.md)

### 2.1 商品表示
- [x] 商品一覧（カード形式） — `index.html`, `category.html` — **PASS**
- [x] 商品詳細（画像・説明・価格） — `product.html` — **PASS**
- [x] レスポンシブ対応（Tailwind CSS grid responsive） — **PASS**
- [x] OGP設定 — **PASS**（下記MEDIUM参照）

### 2.2 カート機能
- [x] カート追加・数量変更・削除 — `cart.js` — **PASS**
- [x] 合計金額表示（税込） — `cart.html` — **PASS**
- [x] 送料明示 — `cart.html`, `confirm.html` — **PASS**
- [x] localStorage永続化 — `cart.js:10` `localStorage.getItem/setItem` — **PASS**
- [x] 「まとめて購入する」ボタン — `cart.html:109` — **PASS**

### 2.2.1 送料テーブル
- [x] 1-4個 = ¥185（クリックポスト） — テスト検証済み — **PASS**
- [x] 5個以上 = ¥370（レターパックライト） — テスト検証済み — **PASS**

### 2.3 注文確認画面
- [x] 商品名・個数・単価・小計・送料・合計（税込送料込） — `confirm.html` — **PASS**
- [x] 配送目安「10日以内に発送」 — `confirm.html:123` — **PASS**
- [x] 受注生産明記 — `confirm.html:115` — **PASS**
- [x] 「注文を確定して決済へ進む」ボタン — `confirm.html:128` — **PASS**

### 2.4 決済
- [x] 商品IDと数量のみ送信、金額サーバー再計算 — `checkout.js:10-14`, `api/checkout/index.js:23` — **PASS**
- [x] 送料は独立line_item — `api/checkout/index.js:47-58` — **PASS**
- [x] 配送先住所収集（JP限定） — `api/checkout/index.js:63` — **PASS**
- [x] メール・電話番号収集 — `api/checkout/index.js:66` — **PASS**

### 2.5 Webhook処理
- [x] checkout.session.completed受信 — `api/webhook/index.js:38` — **PASS**
- [x] 署名検証 — `api/webhook/index.js:27` — **PASS**
- [x] 二重処理防止 — `api/webhook/index.js:46` — **PASS**
- [x] ACSメール送信 — `api/webhook/index.js:78` — **PASS**
- [x] Notion DB登録 — `api/webhook/index.js:88` — **PASS**

### 2.6 購入確認メール
- [x] 注文番号・商品名・個数・合計・配送先・配送目安 — `api/webhook/index.js:127-173` — **PASS**
- [x] 受注生産の旨 — **PASS**
- [x] 問い合わせ先 support@wonder-drill.com — **PASS**
- [x] HTMLテンプレート日本語 — **PASS**

### 2.8 法務ページ
- [x] 特定商取引法に基づく表記 — `legal/tokushoho.html` — **PASS**
- [x] 返品・交換ポリシー — `legal/returns.html` — **PASS**
- [x] プライバシーポリシー（GA4/Clarity明記） — `legal/privacy.html` — **PASS**

### 2.9 Notion DB
- [x] 全プロパティ登録 — `api/webhook/index.js:198-216` — **PASS**

### 特商法照合 (REQUIREMENT.md Section 8 vs tokushoho.html)
- [x] 販売業者: Wonder Drill株式会社 — **PASS**
- [x] 代表責任者: 平山 傑 — **PASS**
- [x] 所在地: 〒064-0805 ... — **PASS**（「５条」→「5条」表記揺れあるが同一住所）
- [x] 連絡先: support@wonder-drill.com — **PASS**
- [x] 送料テーブル — **PASS**
- [x] 支払方法: Stripe — **PASS**
- [x] 引渡し時期: 受注生産、10日以内 — **PASS**
- [x] 返品・交換 — **PASS**
- [x] 適格請求書登録番号: T4430001092106 — **PASS**

### Header/Footer 全ページ確認
- [x] `<header id="site-header">` + `<footer id="site-footer">` + `ui.js`(insertHeader/insertFooter) が全ページに存在 — **PASS**

## 発見された問題

### CRITICAL
なし

### HIGH
なし

### MEDIUM
1. **Analytics未導入ページあり** — `cart.html`, `confirm.html`, `product.html`, `legal/tokushoho.html`, `legal/returns.html`, `legal/privacy.html` に `analytics-config.js` / `analytics.js` が含まれていない。GA4/Clarity のPVデータが取れない。
   - 対象ファイル: 上記6ファイル
   - 要件: Section 4「Microsoft Clarity + GA4」

2. **OGP og:url 未設定** — 全ページで `og:url` metaタグが設定されていない。SNSシェア時にURLが正規化されない可能性あり。

3. **CSP (Content-Security-Policy) ヘッダー未設定** — `staticwebapp.config.json` の `globalHeaders` に CSP がない。Tailwind CDN やStripe等を考慮したCSPの設定が望ましい。

### LOW
1. **Webhook二重処理防止がインメモリ** — `api/webhook/index.js:10` の `processedSessions` はインメモリMapのため、Azure Functionsのスケーリングで複数インスタンスになった場合に重複処理が発生しうる。本番ではRedis等の外部ストアが望ましい（コメントにも記載あり）。

2. **所在地の漢数字/アラビア数字表記揺れ** — REQUIREMENT.mdは「南５条西１５丁目２−３」（全角）、tokushoho.htmlは「南5条西15丁目2-3」（半角）。法的に問題ないが統一が望ましい。

3. **APIレートリミット未実装** — REQUIREMENT.md Section 3「APIレートリミット」が要件にあるが、Azure Static Web Apps組み込みの制限に依存しており、明示的な実装なし。

4. **Tailwind CDN使用** — 本番では CDN ではなくビルド済みCSSが推奨（LCPへの影響）。

## 修正済み
（CRITICAL/HIGHの問題なし。修正不要）
