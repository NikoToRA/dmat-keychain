# DNS管理者への依頼事項

## 依頼内容: wonder-drill.com に3つのDNSレコード追加

SPF・DKIM1・DKIM2は既に設定済みのため、以下の **3つだけ** 追加してください。

### 追加するレコード

| # | 種類 | ホスト名 | 値 | 目的 |
|---|------|---------|-----|------|
| 1 | **TXT** | `wonder-drill.com` | `ms-domain-verification=8fa599f5-7bb4-4665-a11e-baccbf04b5b5` | ドメイン所有権の証明（2つ目） |
| 2 | **TXT** | `_dmarc.wonder-drill.com` | `v=DMARC1; p=quarantine; rua=mailto:s-hirayama@wonder-drill.com; pct=100` | DMARC（なりすまし防止） |
| 3 | **CNAME** | `shop.wonder-drill.com` | `thankful-sand-00abb1300.4.azurestaticapps.net` | ECサイトURL |

### 注意点

- **#1**: 既に `ms-domain-verification=c43c4843...` がありますが、**上書きではなく追加**（TXTレコードは複数設定可能）
- **#2**: `_dmarc.wonder-drill.com` というサブドメインに新規TXTレコード
- **#3**: そのまま追加

### 既に設定済み（追加不要）

| 種類 | ホスト名 | 確認済み |
|------|---------|---------|
| TXT(SPF) | `wonder-drill.com` | `v=spf1 include:spf.protection.outlook.com -all` |
| CNAME(DKIM1) | `selector1-azurecomm-prod-net._domainkey` | 設定済み |
| CNAME(DKIM2) | `selector2-azurecomm-prod-net._domainkey` | 設定済み |

---

## DNS設定完了後にやること（平山作業）

### Step 1: メール送信の有効化（5分）
1. 「DNS設定完了」の連絡をもらう
2. Azure側でドメイン検証を実行（Domain → SPF → DKIM → DMARC）
3. 送信者アドレス `support@wonder-drill.com` を登録（表示名: Wonder Drill株式会社）
4. テストメール → Gmail着信確認
5. SWA環境変数を切り替え:
   - `ACS_CONNECTION_STRING` → acs-dmat-ec の接続文字列
   - `ACS_SENDER_ADDRESS` → `support@wonder-drill.com`

### Step 2: ECサイトのカスタムドメイン有効化（5分）
1. Azure Portal → Static Web Apps → `dmat-store` → Custom domains → 「+Add」
2. `shop.wonder-drill.com` を入力 → 検証 → SSL自動発行
3. SWA環境変数: `PUBLIC_BASE_URL=https://shop.wonder-drill.com`

### Step 3: 動作確認（10分）
1. `https://shop.wonder-drill.com` 表示確認
2. `support@wonder-drill.com` → Gmail受信確認
3. 全ページ遷移テスト

---

依頼者: 平山
日付: 2026-03-18
