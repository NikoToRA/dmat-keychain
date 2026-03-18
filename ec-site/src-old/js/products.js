// 商品マスタデータ
const BASE_PRODUCT = {
  id: 'dmat-keychain',
  name: 'DMAT キーホルダー',
  description: '3Dプリント製、NFC内蔵。DMAT公式カラーのキーホルダー。',
  basePrice: 680,
  image: 'images/keychain-standard.webp',
};

const COLOR_VARIANTS = [
  { id: 'standard-red', name: 'スタンダードレッド', priceDiff: 0, image: 'images/keychain-standard.webp' },
  { id: 'premium-red', name: 'プレミアレッド', priceDiff: 100, image: 'images/keychain-premium.webp' },
];

const ACCESSORIES = [
  { id: 'ball-chain', name: 'ボールチェーン', price: 0, isDefault: true, image: 'images/ball-chain.webp' },
  { id: 'carabiner', name: 'カラビナ', price: 300, isDefault: false, image: 'images/carabiner.webp' },
  { id: 'glow-band', name: '蓄光バンド', price: 400, isDefault: false, image: 'images/glow-band.webp' },
];

const CATEGORIES = [
  { id: 'dmat-member', name: 'DMAT隊員用グッズ', description: '現場スタッフ向け' },
  { id: 'hospital', name: '病院用グッズ', description: '病院・施設導入向け' },
];

// おすすめセット（事前定義の組み合わせ）
const RECOMMENDED_SETS = [
  {
    id: 'basic',
    name: 'ベーシックセット',
    description: 'スタンダードレッド + ボールチェーン',
    color: 'standard-red',
    accessories: ['ball-chain'],
    badge: '定番',
    category: 'dmat-member',
  },
  {
    id: 'premium',
    name: 'プレミアムセット',
    description: 'プレミアレッド + カラビナ + 蓄光バンド',
    color: 'premium-red',
    accessories: ['ball-chain', 'carabiner', 'glow-band'],
    badge: 'フルセット',
    category: 'dmat-member',
  },
  {
    id: 'hospital-basic',
    name: '病院用ベーシック',
    description: 'スタンダードレッド + ボールチェーン',
    color: 'standard-red',
    accessories: ['ball-chain'],
    badge: '施設向け',
    category: 'hospital',
  },
  {
    id: 'hospital-glow',
    name: '病院用 夜勤対応',
    description: 'スタンダードレッド + 蓄光バンド',
    color: 'standard-red',
    accessories: ['ball-chain', 'glow-band'],
    badge: '夜勤に',
    category: 'hospital',
  },
];

// 価格計算
function calculateItemPrice(colorId, accessoryIds) {
  const color = COLOR_VARIANTS.find(c => c.id === colorId);
  const colorDiff = color ? color.priceDiff : 0;
  const accessoryTotal = accessoryIds.reduce((sum, accId) => {
    const acc = ACCESSORIES.find(a => a.id === accId);
    return sum + (acc ? acc.price : 0);
  }, 0);
  return BASE_PRODUCT.basePrice + colorDiff + accessoryTotal;
}

function calculateSetPrice(set) {
  return calculateItemPrice(set.color, set.accessories);
}

function getItemDescription(colorId, accessoryIds) {
  const color = COLOR_VARIANTS.find(c => c.id === colorId);
  const accNames = accessoryIds
    .map(id => ACCESSORIES.find(a => a.id === id))
    .filter(Boolean)
    .map(a => a.name);
  return `${BASE_PRODUCT.name}（${color ? color.name : ''}）${accNames.length > 0 ? ' + ' + accNames.join(' + ') : ''}`;
}
