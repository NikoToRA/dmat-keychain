// Microsoft Clarity + Google Analytics 4
// 測定IDは環境に応じて変更してください
(function () {
  'use strict';

  // ========================
  // Microsoft Clarity
  // ========================
  var CLARITY_PROJECT_ID = window.DMAT_CLARITY_ID || '';
  if (CLARITY_PROJECT_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
  }

  // ========================
  // Google Analytics 4
  // ========================
  var GA4_MEASUREMENT_ID = window.DMAT_GA4_ID || '';
  if (GA4_MEASUREMENT_ID) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID);
  }

  // ========================
  // カスタムイベント送信ヘルパー
  // ========================
  window.trackEvent = function (eventName, params) {
    // GA4
    if (window.gtag) {
      window.gtag('event', eventName, params || {});
    }
    // Clarity カスタムタグ
    if (window.clarity) {
      window.clarity('set', eventName, JSON.stringify(params || {}));
    }
  };

  // ========================
  // EC コンバージョンイベント
  // ========================

  // カートに追加
  var originalAddToCart = window.addToCart;
  if (typeof originalAddToCart === 'function') {
    window.addToCart = function (colorId, accessoryIds, quantity) {
      originalAddToCart(colorId, accessoryIds, quantity);
      var price = typeof calculateItemPrice === 'function'
        ? calculateItemPrice(colorId, accessoryIds)
        : 0;
      window.trackEvent('add_to_cart', {
        currency: 'JPY',
        value: price * (quantity || 1),
        items: [{ item_id: 'dmat-keychain', item_variant: colorId, quantity: quantity || 1 }],
      });
    };
  }

  // 決済開始
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('#checkout-button');
    if (btn) {
      var total = typeof getCartTotal === 'function' ? getCartTotal() : null;
      window.trackEvent('begin_checkout', {
        currency: 'JPY',
        value: total ? total.subtotal : 0,
        items_count: total ? total.totalQuantity : 0,
      });
    }
  });

  // 決済完了（thanks.html で自動検出）
  if (window.location.pathname.includes('thanks.html')) {
    var urlParams = new URLSearchParams(window.location.search);
    var sessionId = urlParams.get('session_id');
    if (sessionId) {
      window.trackEvent('purchase', {
        transaction_id: sessionId,
        currency: 'JPY',
      });
    }
  }
})();
