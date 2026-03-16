# 管理者への依頼事項まとめ

## 1. カスタムドメインメール設定（wonder-drill.com）

現在、注文確認メールは Azure 管理ドメイン（`DoNotReply@...azurecomm.net`）から送信されています。
`support@wonder-drill.com` から送信するには、以下の DNS レコードを追加してください。

### 必要な DNS レコード

ACS Email のカスタムドメイン設定画面（Azure Portal）で表示される値を使用してください。
一般的に必要なレコード:

| 種類 | ホスト名 | 値 |
|------|---------|-----|
| TXT | `wonder-drill.com` | ACS で表示される検証値 |
| CNAME | `selector1-azurecomm-prod-net._domainkey.wonder-drill.com` | ACS で表示される DKIM 値 |
| CNAME | `selector2-azurecomm-prod-net._domainkey.wonder-drill.com` | ACS で表示される DKIM2 値 |

> 具体的な値は Azure Portal → Communication Services → `acs-dmat-ec` → Email → Domains → カスタムドメイン追加 で確認できます。

### 手順

1. Azure Portal で `email-dmat-ec` → Domains → 「+Add a custom domain」
2. `wonder-drill.com` を入力
3. 表示された DNS レコードを DNS 管理画面で追加
4. Azure Portal で「Verify」をクリック
5. 検証完了後、送信者アドレス `support@wonder-drill.com` を追加
6. SWA 環境変数 `ACS_SENDER_ADDRESS` を `support@wonder-drill.com` に変更

---

## 2. カスタムドメインサイト設定（任意）

現在のサイト URL: `https://thankful-sand-00abb1300.4.azurestaticapps.net`

カスタムドメイン（例: `shop.wonder-drill.com`）を使用する場合:

| 種類 | ホスト名 | 値 |
|------|---------|-----|
| CNAME | `shop.wonder-drill.com` | `thankful-sand-00abb1300.4.azurestaticapps.net` |
| TXT | `shop.wonder-drill.com` | Azure Portal で表示される検証値 |

### 手順

1. DNS に上記レコードを追加
2. Azure Portal → Static Web Apps → `dmat-store` → Custom domains → 「+Add」
3. ドメイン検証 → SSL 証明書自動発行
4. SWA 環境変数 `PUBLIC_BASE_URL` を新ドメインに変更

---

## 3. Stripe 本番化

現在テストモードです。本番運用には以下が必要です:

### 手順

1. [Stripe Dashboard](https://dashboard.stripe.com) でアカウントの本番申請を完了
2. 本番用 API キー (`sk_live_xxx`) を取得
3. 本番用 Webhook エンドポイントを登録:
   - URL: `https://thankful-sand-00abb1300.4.azurestaticapps.net/api/webhook`
   - イベント: `checkout.session.completed`
4. Webhook シークレット (`whsec_xxx`) を取得
5. SWA 環境変数を更新:
   - `STRIPE_SECRET_KEY` → 本番キー
   - `STRIPE_WEBHOOK_SECRET` → 本番 Webhook シークレット

### Stripe 環境変数（未設定の場合）

```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 現在の Azure リソース構成

| リソース | 名前 | リソースグループ |
|---------|------|----------------|
| Static Web Apps | `dmat-store` | `rg-dmat-ec` |
| Communication Services | `acs-dmat-ec` | `rg-dmat-ec` |
| Email Service | `email-dmat-ec` | `rg-dmat-ec` |
| Email Domain (Azure管理) | `AzureManagedDomain` | `rg-dmat-ec` |

送信者アドレス: `DoNotReply@e5f27087-d371-4295-be46-7a91e0ca6815.azurecomm.net`

テスト用メールアドレス: `super206cc@gmail.com`
