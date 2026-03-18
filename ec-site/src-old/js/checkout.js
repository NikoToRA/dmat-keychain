// 決済連携（price_data インライン方式）
async function startCheckout() {
  const cartData = getCartTotal();
  if (cartData.items.length === 0) {
    showToast('カートが空です');
    return;
  }

  // サーバーに colorId + accessoryIds を送信（サーバー側で金額を再計算・検証）
  const items = cartData.items.map(item => ({
    colorId: item.colorId,
    accessoryIds: item.accessoryIds,
    quantity: item.quantity,
  }));

  const button = document.getElementById('checkout-button');
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
  } catch (err) {
    showToast(err.message);
    if (button) {
      button.disabled = false;
      button.textContent = '注文を確定して決済へ進む';
    }
  }
}
