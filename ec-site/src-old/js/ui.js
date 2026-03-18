// UI共通処理 - DMAT STORE (Refined Design)

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
    <nav class="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
      <a href="${prefix}index.html" class="flex items-center gap-3 group">
        <div class="w-9 h-9 bg-dmat-red rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
          <span class="text-white font-bold text-xs tracking-wide">D</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-lg font-bold text-dmat-navy tracking-[0.08em]">DMAT STORE</span>
          <span class="hidden sm:inline text-[10px] text-gray-300 tracking-widest uppercase font-medium">Official</span>
        </div>
      </a>
      <div class="flex items-center gap-6">
        <a href="${prefix}index.html" class="hidden sm:inline text-gray-400 hover:text-dmat-navy text-xs font-medium transition-colors tracking-wide uppercase">Products</a>
        <a href="${prefix}cart.html" class="relative text-gray-400 hover:text-dmat-navy transition-colors p-1.5 rounded-lg hover:bg-gray-50">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
          </svg>
          <span id="cart-badge" class="absolute -top-0.5 -right-0.5 bg-dmat-red text-white text-[10px] w-4.5 h-4.5 rounded-full items-center justify-center hidden font-bold leading-none" style="width:18px;height:18px;display:none;font-size:10px;">0</span>
        </a>
      </div>
    </nav>
  `;

  // Header scroll shadow
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 10) {
          header.classList.add('header-scrolled');
        } else {
          header.classList.remove('header-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

// 共通フッター挿入
function insertFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  const isLegal = window.location.pathname.includes('/legal/');
  const prefix = isLegal ? '../' : '';
  const legalPrefix = isLegal ? '' : 'legal/';

  footer.innerHTML = `
    <div class="max-w-6xl mx-auto px-6 py-14">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
        <div>
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-8 h-8 bg-dmat-red rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xs">D</span>
            </div>
            <span class="font-bold text-white text-base tracking-[0.06em]">DMAT STORE</span>
          </div>
          <p class="text-gray-500 text-xs leading-relaxed font-light">DMAT隊員・病院向け<br>公式グッズ通販サイト</p>
        </div>
        <div>
          <h3 class="font-medium text-gray-300 mb-4 text-xs tracking-widest uppercase">Information</h3>
          <ul class="space-y-2.5 text-sm">
            <li><a href="${prefix}${legalPrefix}tokushoho.html" class="text-gray-500 hover:text-white transition-colors text-xs">特定商取引法に基づく表記</a></li>
            <li><a href="${prefix}${legalPrefix}returns.html" class="text-gray-500 hover:text-white transition-colors text-xs">返品・交換ポリシー</a></li>
            <li><a href="${prefix}${legalPrefix}privacy.html" class="text-gray-500 hover:text-white transition-colors text-xs">プライバシーポリシー</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium text-gray-300 mb-4 text-xs tracking-widest uppercase">Contact</h3>
          <p class="text-xs">
            <a href="mailto:support@wonder-drill.com" class="text-gray-500 hover:text-white transition-colors">support@wonder-drill.com</a>
          </p>
          <p class="text-gray-600 text-[10px] mt-3 tracking-wide">Wonder Drill株式会社</p>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-6 text-center text-gray-600 text-[10px] tracking-wide">
        &copy; ${new Date().getFullYear()} Wonder Drill株式会社 All rights reserved.
      </div>
    </div>
  `;
}

// おすすめセットカードHTML生成（洗練デザイン）
function createSetCard(set) {
  const price = calculateSetPrice(set);
  const colorVariant = COLOR_VARIANTS.find(c => c.id === set.color);
  const image = colorVariant ? colorVariant.image : BASE_PRODUCT.image;

  const placeholderSvg = `<div class="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100"><svg class="w-16 h-16 text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg><span class="text-[10px] text-gray-300 tracking-wide">DMAT Keychain</span></div>`;

  return `
    <div class="product-card animate-on-scroll">
      <a href="product.html?set=${set.id}" class="block">
        <div class="card-image relative">
          <img src="${image}" alt="${set.name}"
               class="w-full h-full object-cover"
               onerror="this.parentElement.innerHTML='${placeholderSvg.replace(/'/g, "\\'")}';" />
          ${set.badge ? `<span class="badge-pill absolute top-4 left-4 bg-dmat-red text-white shadow-sm">${set.badge}</span>` : ''}
        </div>
      </a>
      <div class="p-5 pb-6">
        <a href="product.html?set=${set.id}" class="block group">
          <h3 class="font-semibold text-dmat-navy text-sm mb-1.5 group-hover:text-dmat-red transition-colors">${set.name}</h3>
          <p class="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed font-light">${set.description}</p>
        </a>
        <div class="flex items-end justify-between">
          <p class="text-lg font-bold text-dmat-navy tracking-tight">${formatPrice(price)}<span class="text-[10px] text-gray-300 font-normal ml-1">tax in</span></p>
          <button onclick="event.stopPropagation(); handleQuickAddSet('${set.id}')"
                  class="bg-dmat-red text-white py-2 px-4 rounded-lg hover:bg-dmat-red-dark transition-all text-xs font-medium tracking-wide hover:shadow-lg hover:shadow-red-100">
            カートに入れる
          </button>
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
  toast.className = 'dmat-toast fixed bottom-6 right-6 bg-dmat-navy text-white px-6 py-3.5 rounded-xl shadow-2xl z-50 flex items-center gap-2.5 transition-all duration-300';
  toast.style.transform = 'translateY(20px)';
  toast.style.opacity = '0';
  toast.innerHTML = `
    <svg class="w-4.5 h-4.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    <span class="text-xs font-medium tracking-wide">${message}</span>
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

// Intersection Observer for scroll animations
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
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

  // Init scroll animations on all pages
  if (typeof initScrollAnimations === 'function') {
    // Delay slightly to ensure DOM is ready
    requestAnimationFrame(() => initScrollAnimations());
  }
});
