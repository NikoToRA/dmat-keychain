// 決済連携（price_data インライン方式）TypeScript版
import { getCartTotal } from './cart';

function showToast(message: string): void {
  const container = document.getElementById('toast-container');
  if (!container) {
    alert(message);
    return;
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export async function startCheckout(): Promise<void> {
  const cartData = getCartTotal();
  if (cartData.items.length === 0) {
    showToast('カートが空です');
    return;
  }

  const items = cartData.items.map((item) => ({
    colorId: item.colorId,
    accessoryIds: item.accessoryIds,
    quantity: item.quantity,
  }));

  const button = document.getElementById('checkout-button') as HTMLButtonElement | null;
  if (button) {
    button.disabled = true;
    button.textContent = '処理中...';
  }

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '決済エラー');
    }

    const { url } = await res.json();
    window.location.href = url;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '決済エラー';
    showToast(message);
    if (button) {
      button.disabled = false;
      button.textContent = '注文を確定して決済へ進む';
    }
  }
}
