# DMAT キーホルダー EC サイト 要件定義書

## 概要
DMAT関連キーホルダーを販売するECサイトを、月額コスト0円・ベンダーロックインなしの構成で構築する。

**ゴール:** Stripe Checkout Session + Azure Static Web Apps で、複数商品のまとめ買い対応・顧客行動解析付きのECサイトを最小構成で立ち上げる

## 0. スコープ外
- 会員登録/マイページ
- 注文履歴確認
- クーポン
- レビュー
- 在庫管理
- 配送追跡自動通知
- 返品申請フォーム
- カゴ落ちメール
- 管理画面での商品編集
- 売上集計・会計処理をNotionで行うこと

## 1. システム構成

### アーキテクチャ
```
Azure Static Web Apps
├── フロント（静的サイト）
│   ├── 商品一覧
│   ├── 商品詳細
│   ├── カート
│   ├── 注文確認画面
│   ├── サンクスページ
│   └── 法務ページ（特商法/返品/プライバシー）
└── API（Azure Functions）
    ├── POST /api/checkout → Stripe Checkout Session生成
    └── POST /api/webhook → Stripe Webhook受信 → ACSメール + Notion登録
```

外部サービス: Stripe, ACS, Notion API, Microsoft Clarity, GA4

### 環境変数
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID_<商品名>, STRIPE_PRICE_ID_SHIPPING_*
- ACS_CONNECTION_STRING, ACS_SENDER_ADDRESS
- NOTION_TOKEN, NOTION_DATABASE_ID
- PUBLIC_BASE_URL

## 2. 機能要件

### 2.1 商品表示
- 商品一覧（カード形式）
- 商品詳細（画像拡大・説明・価格）
- レスポンシブ対応
- DMAT公式に近いトーン＆マナー
- OGP設定

### 2.2 カート機能
- カート追加（商品選択+個数指定）
- 数量変更・削除
- 合計金額表示（税込）
- 送料明示（個数に応じた計算）
- localStorage永続化
- 「まとめて購入する」ボタン

### 2.2.1 送料テーブル
| 個数 | 配送方法 | 送料（税込） | 備考 |
|------|---------|-------------|------|
| 1〜4個 | クリックポスト | ¥185 | 全国一律。追跡あり |
| 5個以上 | レターパックライト | ¥370 | 全国一律。追跡あり。4kg以内 |

### 2.3 注文確認画面
- カート→決済の間に挿入
- 商品名・個数・単価・小計・送料・合計（税込送料込）
- 配送目安「ご注文確定後、10日以内に発送」
- 受注生産の旨明記
- 「注文を確定して決済へ進む」→Stripe

### 2.4 決済（Stripe Checkout Session）
- 商品IDと数量のみ送信、金額はサーバー再計算
- Stripe price IDベース
- 送料は独立line_item
- 配送先住所収集（日本国内限定 allowed_countries: ['JP']）
- メール・電話番号収集

### 2.5 Webhook処理
- checkout.session.completed受信
- 署名検証
- 二重処理防止
- ACSメール送信
- Notion DB登録

### 2.6 購入確認メール（ACS）
- 注文番号・商品名・個数・合計・配送先・配送目安
- 受注生産の旨
- 問い合わせ先: support@wonder-drill.com
- HTMLテンプレート日本語

### 2.7 商品マスタ
- コード内定数/JSON管理
- Stripe price ID紐づけ
- 画像ホスティング

### 2.8 法務ページ
- 特定商取引法に基づく表記
- 返品・交換ポリシー
- プライバシーポリシー（GA4/Clarity明記）

### 2.9 発送管理用Notion DB
- DB名: DMAT キーホルダー発送管理
- プロパティ: 注文番号(title), Stripe Session ID, Payment Intent ID, 顧客名, メール, 電話, 郵便番号, 住所, 商品名一覧, 商品明細JSON, 合計個数, 送料区分(select), 発送ステータス(status), 注文日時, 発送予定日, 発送日, 追跡番号, メモ, Notion作成元(select)

## 3. 非機能要件
- LCP 1.5秒以内
- SSL/TLS自動管理
- Stripe Webhook署名検証
- APIレートリミット
- Application Insights監視

## 4. 顧客行動解析
- Microsoft Clarity（ヒートマップ・セッション録画）
- GA4（PV・流入経路・コンバージョン）

## 5. 購入者体験フロー
1. 商品一覧アクセス → 2. 商品選択→カート追加 → 3. 複数商品追加可 → 4. まとめて購入 → 5. 注文確認 → 6. 決済へ進む → 7. Stripe決済 → 8. 情報入力 → 9. 支払完了 → 10. サンクスページ → 11. 確認メール → 12. Notion DB登録

## 6. 販売者運用フロー
1. Stripe確認 → 2. Notion DB確認 → 3. 製作・梱包 → 4. 発送 → 5. Notionに記録

## 7. 完了条件
- 商品選択→カート投入できる
- 注文確認で送料込み合計表示
- Stripe Checkoutに遷移
- テスト決済後メール届く
- テスト決済後Notion DB登録
- サンクスページ遷移
- 法務ページ表示

## 8. 特定商取引法に基づく表記
| 項目 | 内容 |
|------|------|
| 販売業者 | Wonder Drill株式会社 |
| 代表責任者 | 平山 傑 |
| 所在地 | 〒064-0805 北海道札幌市中央区南５条西１５丁目２−３ リズム医大前 503号室 |
| 連絡先 | support@wonder-drill.com |
| 販売価格 | 各商品ページに表示（税込価格） |
| 送料 | 1〜4個 ¥185（クリックポスト）／5個以上 ¥370（レターパックライト） |
| 支払方法 | クレジットカード決済（Stripe: Visa/Mastercard/JCB/Amex） |
| 支払時期 | 注文確定時に即時決済 |
| 引渡し時期 | 受注生産、注文確定後10日以内に発送 |
| 返品・交換 | 受注生産品のため客都合不可。不良・破損は到着後7日以内連絡で交換対応 |
| 適格請求書発行事業者登録番号 | T4430001092106 |
