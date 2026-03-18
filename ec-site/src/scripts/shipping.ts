// 送料計算（REQUIREMENT.md 2.2.1 準拠）TypeScript版

export function calculateShipping(totalQuantity: number): { method: string | null; price: number } {
  if (totalQuantity <= 0) {
    return { method: null, price: 0 };
  }
  if (totalQuantity <= 4) {
    return { method: 'クリックポスト', price: 185 };
  }
  const packs = Math.ceil(totalQuantity / 15);
  return {
    method: 'レターパックライト' + (packs > 1 ? ' ×' + packs : ''),
    price: 370 * packs,
  };
}
