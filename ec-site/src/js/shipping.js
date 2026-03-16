// 送料計算（REQUIREMENT.md 2.2.1 準拠）
const SHIPPING = {
  clickpost: { name: 'クリックポスト', price: 185, maxQuantity: 4 },
  letterpack: { name: 'レターパックライト', price: 370, minQuantity: 5 },
};

function calculateShipping(totalQuantity) {
  if (totalQuantity <= 0) return { method: null, price: 0 };
  if (totalQuantity >= SHIPPING.letterpack.minQuantity) {
    return { method: SHIPPING.letterpack.name, price: SHIPPING.letterpack.price };
  }
  return { method: SHIPPING.clickpost.name, price: SHIPPING.clickpost.price };
}
