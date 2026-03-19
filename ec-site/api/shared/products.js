// サーバー側商品マスタデータ（価格の真の計算はここで行う）
const BASE_PRODUCT = {
  id: 'dmat-keychain',
  name: 'DMAT キーホルダー',
  basePrice: 880,
};

const COLOR_VARIANTS = [
  { id: 'standard-red', name: 'スタンダードレッド', priceDiff: 0 },
  { id: 'premium-red', name: 'プレミアレッド', priceDiff: 0 },
  { id: 'black', name: 'ブラック', priceDiff: 0 },
];

const ACCESSORIES = [
  { id: 'ball-chain', name: 'ボールチェーン', price: 0 },
  { id: 'carabiner', name: 'カラビナ', price: 400 },
  { id: 'glow-band', name: '蓄光バンド', price: 400 },
];

const CATEGORY_PRICE = {
  'dmat-member': 0,
  'hospital': 400,
};

function calculateItemPrice(colorId, accessoryIds, category) {
  const color = COLOR_VARIANTS.find(c => c.id === colorId);
  if (!color) return null;

  const invalidAcc = accessoryIds.find(id => !ACCESSORIES.find(a => a.id === id));
  if (invalidAcc) return null;

  const uniqueAccessoryIds = [...new Set(accessoryIds)];

  const colorDiff = color.priceDiff;
  const categoryDiff = CATEGORY_PRICE[category] || 0;
  const accessoryTotal = uniqueAccessoryIds.reduce((sum, accId) => {
    const acc = ACCESSORIES.find(a => a.id === accId);
    return sum + (acc ? acc.price : 0);
  }, 0);
  return BASE_PRODUCT.basePrice + colorDiff + categoryDiff + accessoryTotal;
}

function getItemDescription(colorId, accessoryIds, category) {
  const color = COLOR_VARIANTS.find(c => c.id === colorId);
  const accNames = accessoryIds
    .filter(id => id !== 'ball-chain')
    .map(id => ACCESSORIES.find(a => a.id === id))
    .filter(Boolean)
    .map(a => a.name);
  const categoryLabel = category === 'hospital' ? '（病院向け）' : '';
  return `${BASE_PRODUCT.name}（${color ? color.name : ''}）${accNames.length > 0 ? ' + ' + accNames.join(' + ') : ''}${categoryLabel}`;
}

// 送料計算
function calculateShipping(totalQuantity) {
  if (totalQuantity <= 0) return { method: null, price: 0 };
  if (totalQuantity <= 4) return { method: 'クリックポスト', price: 185 };
  const packs = Math.ceil(totalQuantity / 15);
  return { method: 'レターパックライト' + (packs > 1 ? ' ×' + packs : ''), price: 370 * packs };
}

module.exports = {
  BASE_PRODUCT,
  COLOR_VARIANTS,
  ACCESSORIES,
  CATEGORY_PRICE,
  calculateItemPrice,
  getItemDescription,
  calculateShipping,
};
