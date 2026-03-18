# DNS管理者への依頼事項

## 依頼内容: wonder-drill.com に6つのDNSレコード追加

以下の **6つのDNSレコード** を追加してください。
メール送信（5つ）+ ECサイトのカスタムドメイン（1つ）です。

### 追加するレコード

| # | 種類 | ホスト名 | 値 | 目的 |
|---|------|---------|-----|------|
| 1 | **TXT** | `wonder-drill.com` | `ms-domain-verification=8fa599f5-7bb4-4665-a11e-baccbf04b5b5` | ドメイン所有権の証明 |
| 2 | **TXT** | `wonder-drill.com` | `v=spf1 include:spf.protection.outlook.com -all` | SPF（送信元認証） |
| 3 | **TXT** | `_dmarc.wonder-drill.com` | `v=DMARC1; p=quarantine; rua=mailto:s-hirayama@wonder-drill.com; pct=100` | DMARC（なりすまし防止） |
| 4 | **CNAME** | `selector1-azurecomm-prod-net._domainkey.wonder-drill.com` | `selector1-azurecomm-prod-net._domainkey.azurecomm.net` | DKIM署名（1） |
| 5 | **CNAME** | `selector2-azurecomm-prod-net._domainkey.wonder-drill.com` | `selector2-azurecomm-prod-net._domainkey.azurecomm.net` | DKIM署名（2） |
| 6 | **CNAME** | `shop.wonder-drill.com` | `thankful-sand-00abb1300.4.azurestaticapps.net` | ECサイトURL |

### 注意点

- **TXTレコード（#1, #2）**: 既存のTXTレコードがある場合、**上書きではなく追加**
- **SPFレコード（#2）**: 既にSPFレコードがある場合は既存の値に `include:spf.protection.outlook.com` を追記
  - 例: `v=spf1 include:既存の値 include:spf.protection.outlook.com -all`
- **DMARCレコード（#3）**: `_dmarc.wonder-drill.com` というサブドメインにTXTレコードを追加
- **CNAMEレコード（#4, #5, #6）**: そのまま追加

---

## DNS設定完了後にやること（平山作業）

### Step 1: メール送信の有効化（5分）

1. 平山に「DNS設定完了」と連絡をください
2. こちらでAzure側のドメイン検証を実行します（Domain → SPF → DKIM → DMARC の順）
3. 送信者アドレス `support@wonder-drill.com` を登録
4. テストメール送信 → Gmail / wonder-drill.com 両方で着信確認
5. 確認後、SWA環境変数の送信者アドレスを切り替え:
   ```
   ACS_SENDER_ADDRESS=support@wonder-drill.com
   ```

### Step 2: ECサイトのカスタムドメイン有効化（5分）

1. Azure Portal → Static Web Apps → `dmat-store` → Custom domains → 「+Add」
2. `shop.wonder-drill.com` を入力 → 検証開始
3. SSL証明書が自動発行される（数分かかる場合あり）
4. SWA環境変数のURLを切り替え:
   ```
   PUBLIC_BASE_URL=https://shop.wonder-drill.com
   ```
5. Stripeの Webhook URL / Success URL / Cancel URL も新ドメインに更新

### Step 3: 動作確認（10分）

1. `https://shop.wonder-drill.com` でサイトが表示されることを確認
2. `support@wonder-drill.com` からテストメール → Gmail で受信確認
3. 全ページ遷移テスト
4. 完了

---

依頼者: 平山
日付: 2026-03-18
