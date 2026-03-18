# DNS管理者への依頼事項

## メール送信用DNSレコード追加（wonder-drill.com）

`support@wonder-drill.com` から注文確認メールを送信するため、
以下の **5つのDNSレコード** を追加してください。

### 追加するレコード

| # | 種類 | ホスト名 | 値 | 目的 |
|---|------|---------|-----|------|
| 1 | **TXT** | `wonder-drill.com` | `ms-domain-verification=8fa599f5-7bb4-4665-a11e-baccbf04b5b5` | ドメイン所有権の証明 |
| 2 | **TXT** | `wonder-drill.com` | `v=spf1 include:spf.protection.outlook.com -all` | SPF（送信元認証） |
| 3 | **TXT** | `_dmarc.wonder-drill.com` | `v=DMARC1; p=quarantine; rua=mailto:s-hirayama@wonder-drill.com; pct=100` | DMARC（なりすまし防止） |
| 4 | **CNAME** | `selector1-azurecomm-prod-net._domainkey.wonder-drill.com` | `selector1-azurecomm-prod-net._domainkey.azurecomm.net` | DKIM署名（1） |
| 5 | **CNAME** | `selector2-azurecomm-prod-net._domainkey.wonder-drill.com` | `selector2-azurecomm-prod-net._domainkey.azurecomm.net` | DKIM署名（2） |

### 注意点

- **TXTレコード（#1, #2）**: wonder-drill.comに既存のTXTレコードがある場合、**上書きではなく追加**してください
- **SPFレコード（#2）**: 既にSPFレコードがある場合は、既存の値に `include:spf.protection.outlook.com` を追記してください
  - 例: `v=spf1 include:既存の値 include:spf.protection.outlook.com -all`
- **DMARCレコード（#3）**: `_dmarc.wonder-drill.com` というサブドメインにTXTレコードを追加。rua（レポート送信先）は変更可
- **CNAMEレコード（#4, #5）**: そのまま追加

### 設定完了後の確認手順（こちらで行います）

1. ACSでドメイン検証を実行（Domain → SPF → DKIM → DKIM2 → DMARC の順）
2. 送信者アドレス `support@wonder-drill.com` を登録
3. テストメール送信 → Gmail / wonder-drill.com 両方で着信確認

---

## （任意）ECサイト用カスタムドメイン

`shop.wonder-drill.com` 等でECサイトにアクセスしたい場合:

| 種類 | ホスト名 | 値 |
|------|---------|-----|
| CNAME | `shop.wonder-drill.com` | `thankful-sand-00abb1300.4.azurestaticapps.net` |

---

依頼者: 平山
日付: 2026-03-18
