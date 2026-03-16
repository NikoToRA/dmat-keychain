// 送料計算（REQUIREMENT.md 2.2.1 準拠）TypeScript版

export interface ShippingMethod {
  name: string;
  price: number;
  maxQuantity?: number;
  minQuantity?: number;
}

export interface ShippingConfig {
  clickpost: ShippingMethod;
  letterpack: ShippingMethod;
}

export const SHIPPING: ShippingConfig = {
  clickpost: { name: 'クリックポスト', price: 185, maxQuantity: 4 },
  letterpack: { name: 'レターパックライト', price: 370, minQuantity: 5 },
};

export function calculateShipping(totalQuantity: number): { method: string | null; price: number } {
  if (totalQuantity <= 0) {
    return { method: null, price: 0 };
  }
  if (totalQuantity >= SHIPPING.letterpack.minQuantity!) {
    return { method: SHIPPING.letterpack.name, price: SHIPPING.letterpack.price };
  }
  return { method: SHIPPING.clickpost.name, price: SHIPPING.clickpost.price };
}
