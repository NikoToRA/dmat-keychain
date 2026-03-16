// UI共通処理 - DMAT STORE

// Tailwind カスタムカラー設定
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'dmat-navy': '#1a2332',
          'dmat-navy-light': '#2a3a4e',
          'dmat-red': '#CC0000',
          'dmat-red-dark': '#AA0000',
          'dmat-red-light': '#FF1A1A',
        },
        fontFamily: {
          sans: ['"Noto Sans JP"', 'sans-serif'],
        },
      },
    },
  };
}

// 価格フォーマット
function formatPrice(price) {
  return '\u00A5' + price.toLocaleString();
}

// 共通ヘッダー挿入
function insertHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const isLegal = window.location.pathname.includes('/legal/');
  const prefix = isLegal ? '../' : '';

  header.innerHTML = `
    <nav class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <a href="${prefix}index.html" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-dmat-red rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">D</span>
        </div>
        <div>
          <span class="text-xl font-bold text-dmat-navy tracking-wide">DMAT STORE</span>
          <span class="hidden sm:inline text-xs text-gray-400 ml-2">公式通販</span>
        </div>
      </a>
      <div class="flex items-center gap-4 sm:gap-6">
        <a href="${prefix}index.html" class="hidden sm:inline text-gray-600 hover:text-dmat-navy text-sm font-medium transition-colors">商品一覧</a>
        <a href="${prefix}cart.html" class="relative text-gray-600 hover:text-dmat-navy transition-colors p-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
          </svg>
          <span id="cart-badge" class="absolute -top-1 -right-1 bg-dmat-red text-white text-xs w-5 h-5 rounded-full items-center justify-center hidden font-bold" style="font-size:11px">0</span>
        </a>
      </div>
    </nav>
  `;
}

// 共通フッター挿入
function insertFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  const isLegal = window.location.pathname.includes('/legal/');
  const prefix = isLegal ? '../' : '';
  const legalPrefix = isLegal ? '' : 'legal/';

  footer.innerHTML = `
    <div class="max-w-6xl mx-auto px-4 py-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 bg-dmat-red rounded flex items-center justify-center">
              <span class="text-white font-bold text-xs">D</span>
            </div>
            <span class="font-bold text-white text-lg">DMAT STORE</span>
          </div>
          <p class="text-gray-400 text-sm leading-relaxed">DMAT隊員・病院向け<br>公式グッズ通販サイト</p>
        </div>
        <div>
          <h3 class="font-bold text-white mb-3 text-sm">ご案内</h3>
          <ul class="space-y-2 text-sm">
            <li><a href="${prefix}${legalPrefix}tokushoho.html" class="text-gray-400 hover:text-white transition-colors">特定商取引法に基づく表記</a></li>
            <li><a href="${prefix}${legalPrefix}returns.html" class="text-gray-400 hover:text-white transition-colors">返品・交換ポリシー</a></li>
            <li><a href="${prefix}${legalPrefix}privacy.html" class="text-gray-400 hover:text-white transition-colors">プライバシーポリシー</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-bold text-white mb-3 text-sm">お問い合わせ</h3>
          <p class="text-gray-400 text-sm">
            <a href="mailto:support@wonder-drill.com" class="hover:text-white transition-colors">support@wonder-drill.com</a>
          </p>
          <p class="text-gray-500 text-xs mt-3">Wonder Drill株式会社</p>
        </div>
      </div>
      <div class="border-t border-gray-700 pt-4 text-center text-gray-500 text-xs">
        &copy; ${new Date().getFullYear()} Wonder Drill株式会社 All rights reserved.
      </div>
    </div>
  `;
}

// おすすめセットカードHTML生成
function createSetCard(set) {
  const price = calculateSetPrice(set);
  const colorVariant = COLOR_VARIANTS.find(c => c.id === set.color);
  const image = colorVariant ? colorVariant.image : BASE_PRODUCT.image;
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <a href="product.html?set=${set.id}" class="block">
        <div class="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
          <img src="${image}" alt="${set.name}"
               class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
               onerror="this.parentElement.innerHTML='<div class=\\'flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100\\'><span class=\\'text-5xl mb-2\\'>&#128273;</span><span class=\\'text-xs text-gray-400\\'>DMAT キーホルダー</span></div>'" />
          ${set.badge ? `<span class="absolute top-3 left-3 bg-dmat-red text-white text-xs font-bold px-3 py-1 rounded-full shadow">${set.badge}</span>` : ''}
        </div>
      </a>
      <div class="p-5">
        <a href="product.html?set=${set.id}" class="block">
          <h3 class="font-bold text-dmat-navy text-base mb-1">${set.name}</h3>
          <p class="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">${set.description}</p>
          <p class="text-xl font-bold text-dmat-red">${formatPrice(price)}<span class="text-xs text-gray-400 font-normal ml-1">（税込）</span></p>
        </a>
        <div class="flex gap-2 mt-4">
          <button onclick="handleQuickAddSet('${set.id}')"
                  class="flex-1 bg-dmat-red text-white py-2.5 px-4 rounded-lg hover:bg-dmat-red-dark transition-colors text-sm font-medium">
            カートに入れる
          </button>
          <a href="product.html?set=${set.id}"
             class="flex-1 bg-white text-dmat-navy py-2.5 px-4 rounded-lg border-2 border-dmat-navy hover:bg-dmat-navy hover:text-white transition-colors text-sm font-medium text-center">
            詳細を見る
          </a>
        </div>
      </div>
    </div>
  `;
}

// セットをカートに追加
function handleQuickAddSet(setId) {
  const set = RECOMMENDED_SETS.find(s => s.id === setId);
  if (!set) return;
  addToCart(set.color, set.accessories, 1);
  showToast('カートに追加しました');
}

// トースト通知
function showToast(message) {
  const existing = document.querySelector('.dmat-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'dmat-toast fixed bottom-6 right-6 bg-dmat-navy text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 transition-all duration-300';
  toast.style.transform = 'translateY(20px)';
  toast.style.opacity = '0';
  toast.innerHTML = `
    <svg class="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    <span class="text-sm font-medium">${message}</span>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ビルダーUI初期化（product.htmlで使用）
function initBuilder() {
  const colorRadios = document.querySelectorAll('input[name="color"]');
  const accCheckboxes = document.querySelectorAll('input[name="accessory"]');
  const priceDisplay = document.getElementById('builder-price');
  const descDisplay = document.getElementById('builder-desc');
  const productImage = document.getElementById('builder-image');

  function updateBuilder() {
    const colorId = document.querySelector('input[name="color"]:checked')?.value || 'standard-red';
    const accessoryIds = Array.from(document.querySelectorAll('input[name="accessory"]:checked')).map(el => el.value);
    const price = calculateItemPrice(colorId, accessoryIds);
    const desc = getItemDescription(colorId, accessoryIds);

    if (priceDisplay) priceDisplay.textContent = formatPrice(price);
    if (descDisplay) descDisplay.textContent = desc;

    if (productImage) {
      const color = COLOR_VARIANTS.find(c => c.id === colorId);
      if (color) {
        productImage.src = color.image;
        productImage.alt = color.name;
      }
    }

    // 選択状態のスタイル更新
    colorRadios.forEach(radio => {
      const label = radio.closest('label');
      if (label) {
        if (radio.checked) {
          label.classList.add('ring-2', 'ring-dmat-red', 'bg-red-50', 'border-dmat-red');
          label.classList.remove('border-gray-200');
        } else {
          label.classList.remove('ring-2', 'ring-dmat-red', 'bg-red-50', 'border-dmat-red');
          label.classList.add('border-gray-200');
        }
      }
    });

    accCheckboxes.forEach(cb => {
      const label = cb.closest('label');
      if (label) {
        if (cb.checked) {
          label.classList.add('ring-2', 'ring-dmat-navy', 'bg-blue-50', 'border-dmat-navy');
          label.classList.remove('border-gray-200');
        } else {
          label.classList.remove('ring-2', 'ring-dmat-navy', 'bg-blue-50', 'border-dmat-navy');
          label.classList.add('border-gray-200');
        }
      }
    });
  }

  colorRadios.forEach(r => r.addEventListener('change', updateBuilder));
  accCheckboxes.forEach(c => c.addEventListener('change', updateBuilder));
  updateBuilder();
}

// 数量操作
function changeQuantity(delta) {
  const input = document.getElementById('quantity');
  if (!input) return;
  const current = parseInt(input.value) || 1;
  input.value = Math.max(1, Math.min(99, current + delta));
}

// ヘッダー・フッター挿入
document.addEventListener('DOMContentLoaded', () => {
  insertHeader();
  insertFooter();
});
