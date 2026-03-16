# DMAT キーホルダー EC サイト

## 概要
DMAT関連キーホルダーECサイト。Azure Static Web Apps + Azure Functions + Stripe。

## 技術スタック
- フロント: 静的HTML/CSS/JS + Tailwind CDN
- API: Azure Functions (Node.js)
- 決済: Stripe Checkout Session
- メール: Azure Communication Services
- 発送管理: Notion API（直接curl、Playwright禁止）
- 解析: Microsoft Clarity + GA4

## Azure操作ルール（厳守）
- サブスク: 155ea38a-2bf8-49e4-8526-2b47e35d16bf のみ
- テナント: hirayamadr.onmicrosoft.com
- 他のサブスクは参照含め絶対禁止

## コマンド
- `npm install` (api/ ディレクトリ内)
- `npx swa start src --api-location api` (ローカル開発)

## 要件定義
REQUIREMENT.md を必ず参照。Notion要件定義が正本。
