# DMAT STORE 次のステップ

**作成日:** 2026-03-17
**現在の状態:** サイト構築済み・ACS構築済み・Stripe未接続

---

## 完了済み

- [x] Astro移行（10ページ）
- [x] デザイン改善（ディーター・ラムズ10原則）
- [x] 「公式」削除
- [x] 病院向け+300円の価格体系
- [x] カスタムビルダー（用途→カラー→アクセサリ）
- [x] ACSリソース構築 + SWA環境変数設定
- [x] Notion発送管理DB連携コード
- [x] E2Eテスト 26件 + ユニットテスト 33件 合格
- [x] Codex 2段階レビュー PASS（HIGH/MEDIUM全件修正済み）

---

## Step 1: 画像差し替え（ユーザー作業）

| 画像 | パス | サイズ目安 |
|------|------|-----------|
| ヒーロー画像 | `src/images/hero.webp` | 1920×824px (21:9) |
| スタンダードレッド商品写真 | `src/images/keychain-standard.webp` | 800×800px (1:1) |
| プレミアレッド商品写真 | `src/images/keychain-premium.webp` | 800×800px (1:1) |
| ボールチェーン | `src/images/ball-chain.webp` | 400×400px |
| カラビナ | `src/images/carabiner.webp` | 400×400px |
| 蓄光バンド | `src/images/glow-band.webp` | 400×400px |
| OGP画像 | `src/images/og-image.webp` | 1200×630px |
| DMAT隊員向け動画サムネ | 動画準備後に差し替え | 16:9 |
| 病院向け動画サムネ | 動画準備後に差し替え | 16:9 |

> WebP形式推奨。JPG/PNGでもOK（パスを合わせればOK）

---

## Step 2: Stripe テスト環境構築

### 2-1. Stripeアカウント準備
- [ ] [Stripe Dashboard](https://dashboard.stripe.com) にログイン
- [ ] テストモードであることを確認（画面上部に「テスト」表示）
- [ ] テスト用APIキー取得:
  - `STRIPE_SECRET_KEY` → 「開発者」→「APIキー」→ シークレットキー（`sk_test_...`）
  - `STRIPE_PUBLISHABLE_KEY`（フロント側では不要、Checkout Session方式のため）

### 2-2. Webhook設定
- [ ] 「開発者」→「Webhooks」→「エンドポイントを追加」
- [ ] URL: `https://shop.wonder-drill.com/api/webhook`
- [ ] イベント: `checkout.session.completed` のみ選択
- [ ] 署名シークレット取得: `STRIPE_WEBHOOK_SECRET`（`whsec_...`）

### 2-3. SWA環境変数設定
```bash
az staticwebapp appsettings set --name dmat-store --resource-group rg-dmat-ec \
  --setting-names \
  "STRIPE_SECRET_KEY=sk_test_xxxxx" \
  "STRIPE_WEBHOOK_SECRET=whsec_xxxxx"
```

### 2-4. Stripe自動レシート設定
- [ ] Stripe Dashboard →「設定」→「メール」→「成功した支払いのレシート」をON
- [ ] これで顧客にStripeから自動で領収書メールが届く

---

## Step 3: テスト決済 E2E

### 3-1. テスト決済フロー
1. サイトで商品をカートに入れる
2. 確認ページ →「注文を確定して決済へ進む」
3. Stripe テスト決済画面でテストカード入力:
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 任意の将来日付
   - CVC: 任意の3桁
   - 名前・住所: テスト情報
4. 決済完了 → /thanks ページにリダイレクト

### 3-2. 確認項目
- [ ] /thanks ページが表示される
- [ ] ACSメールが `super206cc@gmail.com` に届く
- [ ] Notion発送管理DBに注文が登録される
- [ ] Stripe Dashboardに決済が記録される
- [ ] 領収書メールがStripeから届く（自動レシートONの場合）

### 3-3. 異常系テスト
- [ ] カード拒否: `4000 0000 0000 0002` → エラー表示
- [ ] キャンセル: 決済画面で「戻る」→ /cancel ページ表示

---

## Step 4: 領収書URL対応（ACSメール内）

Webhook内でStripe Payment IntentからレシートURLを取得し、
注文確認メールにリンクを追加する。

```
変更ファイル: api/webhook/index.js
- payment_intent から receipt_url を取得
- メールHTML内に「領収書はこちら」リンクを追加
```

---

## Step 5: 本番切り替え前チェックリスト

- [ ] Stripe本番APIキーに切り替え
- [ ] Webhook URLを本番用に更新
- [ ] ACS送信者アドレスをカスタムドメイン（support@wonder-drill.com）に切り替え
  - DNS管理者にTXT/CNAMEレコード追加依頼（docs/admin-requests.md参照）
- [ ] カスタムドメイン設定（shop.wonder-drill.com等、任意）
- [ ] GA4/Clarity の測定IDを設定
- [ ] OGP画像の設定確認
- [ ] 全ページ最終目視確認
- [ ] テスト注文データをNotion DBから削除

---

## Step 6: 公開後

- [ ] 実注文の動作確認（自分で1件購入）
- [ ] 発送フロー確認（Notion → 発送ステータス更新 → 追跡番号メール）
- [ ] Google Search Console にサイトマップ登録
- [ ] SNS告知

---

## 優先順位

```
Step 1（画像）   ← ユーザー作業中 ⏳
Step 2（Stripe） ← 次にやること 🔜
Step 3（テスト決済）← Step 2完了後すぐ
Step 4（領収書URL）← Step 3と同時可
Step 5（本番化） ← 全テスト通過後
Step 6（公開）   ← 最後
```
