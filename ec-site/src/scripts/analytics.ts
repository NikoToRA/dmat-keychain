// Microsoft Clarity + Google Analytics 4 モジュール版
// 測定IDは window.DMAT_CLARITY_ID / window.DMAT_GA4_ID から取得

declare global {
  interface Window {
    DMAT_CLARITY_ID?: string;
    DMAT_GA4_ID?: string;
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    clarity: (...args: unknown[]) => void;
    trackEvent: (eventName: string, params?: Record<string, unknown>) => void;
  }
}

// Microsoft Clarity 初期化
function initClarity(projectId: string): void {
  if (!projectId) return;

  const w = window as Record<string, unknown>;
  w['clarity'] =
    w['clarity'] ||
    function (...args: unknown[]) {
      ((w['clarity'] as { q?: unknown[] }).q = (w['clarity'] as { q?: unknown[] }).q || []).push(args);
    };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  const first = document.getElementsByTagName('script')[0];
  first.parentNode?.insertBefore(script, first);
}

// Google Analytics 4 初期化
function initGA4(measurementId: string): void {
  if (!measurementId) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]): void {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId);
}

// カスタムイベント送信
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (window.gtag) {
    window.gtag('event', eventName, params || {});
  }
  if (window.clarity) {
    window.clarity('set', eventName, JSON.stringify(params || {}));
  }
}

// add_to_cart トラッキング
export function trackAddToCart(
  colorId: string,
  quantity: number,
  value: number
): void {
  trackEvent('add_to_cart', {
    currency: 'JPY',
    value: value * quantity,
    items: [{ item_id: 'dmat-keychain', item_variant: colorId, quantity }],
  });
}

// begin_checkout トラッキング
export function trackBeginCheckout(subtotal: number, itemsCount: number): void {
  trackEvent('begin_checkout', {
    currency: 'JPY',
    value: subtotal,
    items_count: itemsCount,
  });
}

// purchase トラッキング（thanksページ用）
export function trackPurchase(transactionId: string): void {
  trackEvent('purchase', {
    transaction_id: transactionId,
    currency: 'JPY',
  });
}

// 初期化（ページ読み込み時に呼び出す）
export function initAnalytics(): void {
  const clarityId = window.DMAT_CLARITY_ID || '';
  const ga4Id = window.DMAT_GA4_ID || '';

  initClarity(clarityId);
  initGA4(ga4Id);

  // trackEvent をグローバルに公開
  window.trackEvent = trackEvent;

  // checkout ボタンのクリックを監視
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('#checkout-button');
    if (btn) {
      const getCartTotal = (window as Record<string, unknown>).getCartTotal as
        | (() => { subtotal: number; totalQuantity: number })
        | undefined;
      if (typeof getCartTotal === 'function') {
        const total = getCartTotal();
        trackBeginCheckout(total.subtotal, total.totalQuantity);
      }
    }
  });

  // thanks ページでの purchase トラッキング
  if (window.location.pathname.includes('thanks')) {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId) {
      trackPurchase(sessionId);
    }
  }
}
