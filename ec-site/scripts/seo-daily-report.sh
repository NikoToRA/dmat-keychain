#!/bin/bash
# DMAT STORE SEO日次レポート データ取得スクリプト
# 使い方: bash scripts/seo-daily-report.sh [日数(デフォルト7)]
#
# 出力: scripts/reports/report-YYYY-MM-DD.json
# 必要: gcloud auth application-default login (analytics.readonly + webmasters.readonly スコープ)

set -euo pipefail

DAYS=${1:-7}
SITE_URL="https://shop.wonder-drill.com"
GA4_PROPERTY_ID="${GA4_PROPERTY_ID:-}"
END_DATE=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d "yesterday" +%Y-%m-%d)
START_DATE=$(date -v-${DAYS}d +%Y-%m-%d 2>/dev/null || date -d "${DAYS} days ago" +%Y-%m-%d)

REPORT_DIR="$(dirname "$0")/reports"
mkdir -p "$REPORT_DIR"
REPORT_FILE="$REPORT_DIR/report-$(date +%Y-%m-%d).json"

TOKEN=$(gcloud auth application-default print-access-token 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "ERROR: gcloud ADC token not available. Run: gcloud auth application-default login"
  exit 1
fi

echo "=== DMAT STORE SEO Daily Report ==="
echo "期間: $START_DATE ~ $END_DATE ($DAYS 日間)"
echo ""

# --- 1. Search Console データ取得 ---
echo ">>> Search Console データ取得中..."
SC_DATA=$(curl -s -X POST \
  "https://searchconsole.googleapis.com/webmasters/v3/sites/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SITE_URL', safe=''))")/searchAnalytics/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"dimensions\": [\"query\"],
    \"rowLimit\": 25
  }" 2>/dev/null)

SC_TOTAL=$(curl -s -X POST \
  "https://searchconsole.googleapis.com/webmasters/v3/sites/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SITE_URL', safe=''))")/searchAnalytics/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\"
  }" 2>/dev/null)

SC_PAGES=$(curl -s -X POST \
  "https://searchconsole.googleapis.com/webmasters/v3/sites/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SITE_URL', safe=''))")/searchAnalytics/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"startDate\": \"$START_DATE\",
    \"endDate\": \"$END_DATE\",
    \"dimensions\": [\"page\"],
    \"rowLimit\": 10
  }" 2>/dev/null)

# --- 2. Search Console インデックス状況 ---
echo ">>> インデックス状況確認中..."
SC_INDEX=$(curl -s \
  "https://searchconsole.googleapis.com/webmasters/v3/sites/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SITE_URL', safe=''))")/sitemaps/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SITE_URL/sitemap.xml', safe=''))")" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

# --- 3. GA4 データ取得 ---
GA4_DATA="{}"
if [ -n "$GA4_PROPERTY_ID" ]; then
  echo ">>> GA4 データ取得中 (property: $GA4_PROPERTY_ID)..."
  GA4_DATA=$(curl -s -X POST \
    "https://analyticsdata.googleapis.com/v1beta/properties/$GA4_PROPERTY_ID:runReport" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"dateRanges\": [{\"startDate\": \"$START_DATE\", \"endDate\": \"$END_DATE\"}],
      \"dimensions\": [
        {\"name\": \"pagePath\"},
        {\"name\": \"sessionSource\"}
      ],
      \"metrics\": [
        {\"name\": \"sessions\"},
        {\"name\": \"activeUsers\"},
        {\"name\": \"screenPageViews\"},
        {\"name\": \"bounceRate\"},
        {\"name\": \"averageSessionDuration\"}
      ],
      \"limit\": 20
    }" 2>/dev/null)
else
  echo ">>> GA4 PROPERTY ID未設定。スキップ。"
fi

# --- レポートJSON生成 ---
python3 -c "
import json, sys
report = {
    'report_date': '$(date +%Y-%m-%d)',
    'period': {'start': '$START_DATE', 'end': '$END_DATE', 'days': $DAYS},
    'site_url': '$SITE_URL',
    'search_console': {
        'total': json.loads('''$SC_TOTAL''') if '''$SC_TOTAL'''.strip() else {},
        'by_query': json.loads('''$SC_DATA''') if '''$SC_DATA'''.strip() else {},
        'by_page': json.loads('''$SC_PAGES''') if '''$SC_PAGES'''.strip() else {},
        'sitemap_index': json.loads('''$SC_INDEX''') if '''$SC_INDEX'''.strip() else {}
    },
    'ga4': json.loads('''$GA4_DATA''') if '''$GA4_DATA'''.strip() else {}
}
with open('$REPORT_FILE', 'w') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(f'レポート保存: $REPORT_FILE')
" 2>/dev/null

echo ""
echo "=== サマリー ==="
python3 -c "
import json
with open('$REPORT_FILE') as f:
    r = json.load(f)

sc = r.get('search_console', {}).get('total', {}).get('rows', [{}])
if sc:
    row = sc[0] if isinstance(sc, list) else sc
    clicks = row.get('clicks', 0)
    impressions = row.get('impressions', 0)
    ctr = row.get('ctr', 0)
    position = row.get('position', 0)
    print(f'Search Console ({r[\"period\"][\"start\"]} ~ {r[\"period\"][\"end\"]}):')
    print(f'  表示回数: {impressions}')
    print(f'  クリック数: {clicks}')
    print(f'  CTR: {ctr*100:.1f}%')
    print(f'  平均掲載順位: {position:.1f}')
else:
    total = r.get('search_console', {}).get('total', {})
    if 'rows' in total:
        print('Search Console: データあり（詳細はレポートファイル参照）')
    else:
        print('Search Console: まだデータがありません（インデックス待ち）')

queries = r.get('search_console', {}).get('by_query', {}).get('rows', [])
if queries:
    print(f'\\n  検索クエリ Top 5:')
    for q in queries[:5]:
        keys = q.get('keys', [''])
        print(f'    \"{keys[0]}\" - 表示:{q.get(\"impressions\",0)} クリック:{q.get(\"clicks\",0)} 順位:{q.get(\"position\",0):.1f}')

print()
ga4 = r.get('ga4', {})
if 'rows' in ga4:
    print('GA4: データあり（詳細はレポートファイル参照）')
else:
    print('GA4: まだデータがありません or PROPERTY ID未設定')
" 2>/dev/null || echo "サマリー表示エラー（レポートJSONは保存済み）"

echo ""
echo "完了: $REPORT_FILE"
