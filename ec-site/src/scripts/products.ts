// 商品マスタデータ (TypeScript)

export interface BaseProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
}

export interface ColorVariant {
  id: string;
  name: string;
  priceDiff: number;
  image: string;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  image: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface RecommendedSet {
  id: string;
  name: string;
  description: string;
  color: string;
  accessories: string[];
  badge: string;
  category: string;
}

export const BASE_PRODUCT: BaseProduct = {
  id: 'dmat-keychain',
  name: 'DMAT キーホルダー',
  description: '3Dプリント製、NFC内蔵。DMATカラーのキーホルダー。',
  basePrice: 680,
  image: 'images/keychain-standard.webp',
};

export const COLOR_VARIANTS: ColorVariant[] = [
  { id: 'standard-red', name: 'スタンダードレッド', priceDiff: 0, image: 'images/keychain-standard.webp' },
  { id: 'premium-red', name: 'プレミアレッド', priceDiff: 0, image: 'images/keychain-premium.webp' },
];

export const ACCESSORIES: Accessory[] = [
  { id: 'ball-chain', name: 'ボールチェーン', price: 0, isDefault: true, image: 'images/ball-chain.webp' },
  { id: 'carabiner', name: 'カラビナ', price: 300, isDefault: false, image: 'images/carabiner.webp' },
  { id: 'glow-band', name: '蓄光バンド', price: 400, isDefault: false, image: 'images/glow-band.webp' },
];

export const CATEGORIES: Category[] = [
  { id: 'dmat-member', name: 'DMAT隊員用グッズ', description: '現場スタッフ向け' },
  { id: 'hospital', name: '病院用グッズ', description: '病院・施設導入向け' },
];

export const CATEGORY_PRICE: Record<string, number> = {
  'dmat-member': 0,
  'hospital': 300,
};

export const RECOMMENDED_SETS: RecommendedSet[] = [
  {
    id: 'basic',
    name: 'ベーシックセット',
    description: 'スタンダードレッド',
    color: 'standard-red',
    accessories: ['ball-chain'],
    badge: '定番',
    category: 'dmat-member',
  },
  {
    id: 'premium',
    name: 'カラビナセット',
    description: 'カラビナ',
    color: 'premium-red',
    accessories: ['ball-chain', 'carabiner'],
    badge: 'カラビナ付き',
    category: 'dmat-member',
  },
  {
    id: 'hospital-basic',
    name: '病院用ベーシック',
    description: 'スタンダードレッド',
    color: 'standard-red',
    accessories: ['ball-chain'],
    badge: '施設向け',
    category: 'hospital',
  },
  {
    id: 'hospital-glow',
    name: '病院用 蓄光バンド付き',
    description: 'スタンダードレッド + 蓄光バンド',
    color: 'standard-red',
    accessories: ['ball-chain', 'glow-band'],
    badge: '蓄光付き',
    category: 'hospital',
  },
];

export function calculateItemPrice(colorId: string, accessoryIds: string[], category?: string): number {
  const color = COLOR_VARIANTS.find((c) => c.id === colorId);
  const colorDiff = color ? color.priceDiff : 0;
  const categoryDiff = CATEGORY_PRICE[category || ''] || 0;
  const accessoryTotal = accessoryIds.reduce((sum, accId) => {
    const acc = ACCESSORIES.find((a) => a.id === accId);
    return sum + (acc ? acc.price : 0);
  }, 0);
  return BASE_PRODUCT.basePrice + colorDiff + categoryDiff + accessoryTotal;
}

export function calculateSetPrice(set: { color: string; accessories: string[]; category?: string }): number {
  return calculateItemPrice(set.color, set.accessories, set.category);
}

export function getItemDescription(colorId: string, accessoryIds: string[]): string {
  const color = COLOR_VARIANTS.find((c) => c.id === colorId);
  const accNames = accessoryIds
    .map((id) => ACCESSORIES.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => a!.name);
  return `${BASE_PRODUCT.name}（${color ? color.name : ''}）${accNames.length > 0 ? ' + ' + accNames.join(' + ') : ''}`;
}
