# DNS管理者への依頼事項

## メール送信用DNSレコード追加（wonder-drill.com）

現在 `support@wonder-drill.com` からメールを送信できません。
以下の **4つのDNSレコード** を追加してください。

### 追加するレコード

| # | 種類 | ホスト名 | 値 |
|---|------|---------|-----|
| 1 | **TXT** | `wonder-drill.com` | `ms-domain-verification=8fa599f5-7bb4-4665-a11e-baccbf04b5b5` |
| 2 | **TXT** | `wonder-drill.com` | `v=spf1 include:spf.protection.outlook.com -all` |
| 3 | **CNAME** | `selector1-azurecomm-prod-net._domainkey` | `selector1-azurecomm-prod-net._domainkey.azurecomm.net` |
| 4 | **CNAME** | `selector2-azurecomm-prod-net._domainkey` | `selector2-azurecomm-prod-net._domainkey.azurecomm.net` |

> 既存のTXTレコードがある場合は、値を追加（上書きではなく）してください。
> SPFレコードが既にある場合は `include:spf.protection.outlook.com` を既存に追記してください。

### 目的
Azure Communication Services から `support@wonder-drill.com` で注文確認メールを送信するため。
現在は `azurecomm.net` ドメインで送信しており、Gmailで受信拒否されています。

---

## （任意）ECサイト用カスタムドメイン

`shop.wonder-drill.com` 等でECサイトにアクセスしたい場合:

| 種類 | ホスト名 | 値 |
|------|---------|-----|
| CNAME | `shop.wonder-drill.com` | `thankful-sand-00abb1300.4.azurestaticapps.net` |

---

依頼者: 平山
日付: 2026-03-18
