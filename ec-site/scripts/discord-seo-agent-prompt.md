# DMAT STORE SEO 日次レポート — Discordエージェント指示書

## ミッション
毎朝9:00 JSTに以下を実行し、HTMLレポートを生成してGitHubにpush、結果サマリーをDiscordチャンネルに投稿せよ。

---

## サイト情報
- サイト名: DMAT STORE
- URL: https://shop.wonder-drill.com
- 商品: DMATキーホルダー（NFC内蔵、3Dプリント製、受注生産）
- 価格帯: ¥880〜¥1,680
- ドメイン取得日: 2026-03-24
- GitHub: https://github.com/NikoToRA/dmat-keychain
- HTMLレポート出力先: ec-site/scripts/reports/

---

## 実行タスク（毎日この順番で実行）

### Task 1: キーワード順位チェック
以下のキーワードをGoogle検索し、`shop.wonder-drill.com` が検索結果の何位に表示されるか記録。
表示されない場合は「圏外」(999)。

| # | キーワード | 重要度 |
|---|-----------|--------|
| 1 | DMATキーホルダー | 最重要 |
| 2 | DMATグッズ | 高 |
| 3 | DMAT グッズ販売 | 高 |
| 4 | DMAT キーホルダー 販売 | 中 |
| 5 | DMAT 装備 | 中 |
| 6 | EMIS キーホルダー | 低 |
| 7 | NFC キーホルダー DMAT | 低 |

### Task 2: インデックス確認
`site:shop.wonder-drill.com` でGoogle検索し、インデックスされているページ数を記録。

### Task 3: 競合チェック
Task 1の検索結果で上位10位に表示されるサイトを記録。
既知の競合:
- 株式会社Forward（dmatgoods.theshop.jp / forward-inc.jimdofree.com）
- 医療の王様（iryoking.com）
- DMAT隊員専用SHOP（dmat-member.stores.jp）
- シグナル（signalos.co.jp）

### Task 4: サイト稼働確認
https://shop.wonder-drill.com にアクセスし正常表示を確認。

---

## KPI目標

| 指標 | 1ヶ月後(4/24) | 3ヶ月後(6/24) | 6ヶ月後(9/24) |
|------|--------------|--------------|--------------|
| 「DMATキーホルダー」順位 | 30位以内 | 10位以内 | 3位以内 |
| 「DMATグッズ」順位 | 50位以内 | 20位以内 | 10位以内 |
| インデックスページ数 | 10+ | 15+ | 25+ |

---

## 出力1: HTMLレポート

ファイル名: `ec-site/scripts/reports/report-YYYY-MM-DD.html`

以下のHTMLテンプレートを使用してレポートを生成:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DMAT STORE SEOレポート YYYY-MM-DD</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f7fa; color: #1a1a2e; line-height: 1.6; padding: 2rem; }
  .container { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 1.5rem; color: #1B2838; margin-bottom: 0.5rem; }
  .date { color: #888; font-size: 0.9rem; margin-bottom: 2rem; }
  .card { background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .card h2 { font-size: 1.1rem; color: #1B2838; margin-bottom: 1rem; border-bottom: 2px solid #C41E3A; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { background: #f8f9fa; text-align: left; padding: 0.75rem; font-weight: 600; color: #555; }
  td { padding: 0.75rem; border-top: 1px solid #eee; }
  .rank-up { color: #22c55e; font-weight: 700; }
  .rank-down { color: #ef4444; font-weight: 700; }
  .rank-same { color: #888; }
  .rank-out { color: #ccc; font-style: italic; }
  .kpi-achieved { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
  .kpi-not { background: #fef2f2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
  .priority-high { color: #ef4444; font-weight: 700; }
  .priority-medium { color: #f59e0b; font-weight: 700; }
  .priority-low { color: #22c55e; font-weight: 700; }
  .summary { font-size: 1rem; line-height: 1.8; color: #333; }
  .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 1rem; border-radius: 0 8px 8px 0; margin-bottom: 1rem; }
  .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
  .metric { text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px; }
  .metric-value { font-size: 2rem; font-weight: 700; color: #1B2838; }
  .metric-label { font-size: 0.8rem; color: #888; margin-top: 0.25rem; }
  .action-item { padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; }
  .action-item:last-child { border-bottom: none; }
  .footer { text-align: center; color: #aaa; font-size: 0.8rem; margin-top: 2rem; }
</style>
</head>
<body>
<div class="container">
  <h1>DMAT STORE SEO Daily Report</h1>
  <p class="date">YYYY年MM月DD日（D曜日）</p>

  <!-- アラート（問題がある場合のみ表示） -->
  <!-- <div class="alert">⚠️ アラート内容</div> -->

  <!-- サマリー指標 -->
  <div class="metric-grid">
    <div class="metric">
      <div class="metric-value">XX</div>
      <div class="metric-label">インデックスページ数</div>
    </div>
    <div class="metric">
      <div class="metric-value">XX位</div>
      <div class="metric-label">「DMATキーホルダー」順位</div>
    </div>
    <div class="metric">
      <div class="metric-value">XX位</div>
      <div class="metric-label">「DMATグッズ」順位</div>
    </div>
    <div class="metric">
      <div class="metric-value">OK/NG</div>
      <div class="metric-label">サイト稼働</div>
    </div>
  </div>

  <!-- サマリー -->
  <div class="card">
    <h2>📋 サマリー</h2>
    <div class="summary">
      <p>（全体の所見を3〜5行で記述。良い点・悪い点・注目すべき変化を簡潔に。）</p>
    </div>
  </div>

  <!-- キーワード順位 -->
  <div class="card">
    <h2>🔍 キーワード順位</h2>
    <table>
      <thead>
        <tr><th>キーワード</th><th>順位</th><th>前日比</th><th>目標</th><th>状態</th></tr>
      </thead>
      <tbody>
        <!-- 各キーワードの行。class: rank-up/rank-down/rank-same/rank-out -->
        <tr>
          <td>DMATキーホルダー</td>
          <td>XX位</td>
          <td class="rank-up">↑X</td>
          <td>30位以内</td>
          <td><span class="kpi-achieved">達成</span></td>
        </tr>
        <!-- 以下同様に全キーワード -->
      </tbody>
    </table>
  </div>

  <!-- インデックス状況 -->
  <div class="card">
    <h2>📑 インデックス状況</h2>
    <p>インデックス済み: <strong>XX ページ</strong>（前日比 +X）</p>
    <p style="margin-top: 0.5rem; color: #666;">（インデックスされているURLの一覧をリストで記載）</p>
  </div>

  <!-- 競合動向 -->
  <div class="card">
    <h2>⚔️ 競合動向</h2>
    <p>（各キーワードの上位サイトを記載。新しい競合の出現や順位変動があれば強調。変化なしの場合は「変化なし」）</p>
  </div>

  <!-- KPI進捗 -->
  <div class="card">
    <h2>🏆 KPI進捗</h2>
    <table>
      <thead>
        <tr><th>KPI</th><th>目標</th><th>現在</th><th>達成率</th><th>状態</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>「DMATキーホルダー」順位</td>
          <td>30位以内</td>
          <td>XX位</td>
          <td>XX%</td>
          <td><span class="kpi-achieved">達成</span></td>
        </tr>
        <!-- 以下同様 -->
      </tbody>
    </table>
  </div>

  <!-- 改善提案 -->
  <div class="card">
    <h2>💡 改善提案</h2>
    <div class="action-item"><span class="priority-high">[HIGH]</span> （最優先の改善案）</div>
    <div class="action-item"><span class="priority-medium">[MEDIUM]</span> （中優先の改善案）</div>
    <div class="action-item"><span class="priority-low">[LOW]</span> （低優先の改善案）</div>
  </div>

  <!-- 次のアクション -->
  <div class="card">
    <h2>📝 次のアクション</h2>
    <div class="action-item">☐ （具体的なアクション1）</div>
    <div class="action-item">☐ （具体的なアクション2）</div>
    <div class="action-item">☐ （具体的なアクション3）</div>
  </div>

  <div class="footer">
    DMAT STORE SEO Report | Generated by AI Agent | https://shop.wonder-drill.com
  </div>
</div>
</body>
</html>
```

**重要**: テンプレート内のプレースホルダー（XX、YYYY-MM-DD等）を実際のデータで置換すること。

---

## 出力2: Discord投稿（サマリー）

HTMLレポートのサマリーをDiscordに投稿。HTMLレポートのURLも添付。

```
📊 **DMAT STORE SEOレポート（YYYY/MM/DD）**

🔍 キーワード順位:
  DMATキーホルダー: XX位 (↑↓→)
  DMATグッズ: XX位 (↑↓→)
  DMAT グッズ販売: XX位 (↑↓→)

📑 インデックス: XX ページ
🏆 KPI: DMATキーホルダー XX位/目標30位 [達成/未達]

💡 今日の提案:
  🔴 （最優先の1件）

📄 詳細レポート: https://github.com/NikoToRA/dmat-keychain/blob/main/ec-site/scripts/reports/report-YYYY-MM-DD.html
```

---

## 出力3: Git操作

1. HTMLレポートを `ec-site/scripts/reports/report-YYYY-MM-DD.html` に保存
2. `git add` → `git commit -m "chore: SEO日次レポート YYYY-MM-DD"` → `git push`

---

## 改善提案の判断基準

### 順位に応じたアクション提案
- **圏外（未インデックス）**: 「Search ConsoleでURLインデックスリクエスト推奨」
- **50位以下**: 「コンテンツ追加推奨（FAQ/ブログ記事）」
- **11-50位**: 「被リンク獲得・内部リンク強化を推奨」
- **4-10位**: 「タイトル・descriptionのCTR改善を推奨」
- **1-3位**: 「現状維持。UX改善でコンバージョン最大化」

### アラート条件
- 順位が前日から5位以上下落 → ⚠️ Discord投稿に警告追加
- 新しい競合が上位10位に出現 → ⚠️ 競合アラート
- インデックスページ数が減少 → ⚠️ インデックスアラート
- サイトがダウン → 🚨 緊急メンション付き投稿

### 週次追加タスク（毎週月曜のみ）
- ブログ記事ネタ提案（1本分のタイトル・構成案）
- 被リンク獲得先の提案（1件）
- 週間トレンドグラフ（7日分の順位推移をテーブルで）

---

## 履歴管理（前日比較用）

前日のデータと比較するため、JSON形式で記録を保持:

ファイル: `ec-site/scripts/reports/history.json`

```json
[
  {
    "date": "YYYY-MM-DD",
    "rankings": {
      "DMATキーホルダー": 999,
      "DMATグッズ": 999,
      "DMAT グッズ販売": 999,
      "DMAT キーホルダー 販売": 999,
      "DMAT 装備": 999,
      "EMIS キーホルダー": 999,
      "NFC キーホルダー DMAT": 999
    },
    "indexed_pages": 0,
    "site_status": "ok"
  }
]
```

毎回レポート生成時に新しいエントリを追加。999 = 圏外。
前日のエントリと比較して「前日比」を算出する。

---

## cron設定
```
0 9 * * * (JST)
```
