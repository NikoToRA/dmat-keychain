const {
  CATEGORY_PRICE,
  calculateItemPrice,
  calculateShipping,
  getItemDescription,
} = require('../shared/products');

describe('calculateItemPrice', () => {
  test('standard-red + ball-chain = 880', () => {
    expect(calculateItemPrice('standard-red', ['ball-chain'])).toBe(880);
  });

  test('不正な colorId は null を返す', () => {
    expect(calculateItemPrice('invalid-color', ['ball-chain'])).toBeNull();
  });

  test('hospital カテゴリは +400 円になる', () => {
    expect(calculateItemPrice('standard-red', ['ball-chain'], 'hospital')).toBe(1280);
  });
});

describe('calculateShipping', () => {
  test('0個 = 0円', () => {
    expect(calculateShipping(0)).toEqual({ method: null, price: 0 });
  });

  test('1個 = 185円', () => {
    expect(calculateShipping(1)).toEqual({ method: 'クリックポスト', price: 185 });
  });

  test('4個 = 185円', () => {
    expect(calculateShipping(4)).toEqual({ method: 'クリックポスト', price: 185 });
  });

  test('5個 = 370円', () => {
    expect(calculateShipping(5)).toEqual({ method: 'レターパックライト', price: 370 });
  });

  test('15個 = 370円', () => {
    expect(calculateShipping(15)).toEqual({ method: 'レターパックライト', price: 370 });
  });

  test('16個 = 740円', () => {
    expect(calculateShipping(16)).toEqual({ method: 'レターパックライト ×2', price: 740 });
  });

  test('30個 = 740円', () => {
    expect(calculateShipping(30)).toEqual({ method: 'レターパックライト ×2', price: 740 });
  });

  test('31個 = 1110円', () => {
    expect(calculateShipping(31)).toEqual({ method: 'レターパックライト ×3', price: 1110 });
  });
});

describe('getItemDescription', () => {
  test('商品説明文字列を返す', () => {
    expect(getItemDescription('standard-red', ['ball-chain', 'carabiner'])).toBe(
      'DMAT キーホルダー（スタンダードレッド） + カラビナ'
    );
  });
});

describe('CATEGORY_PRICE', () => {
  test('カテゴリごとの価格差分が定義されている', () => {
    expect(CATEGORY_PRICE['dmat-member']).toBe(0);
    expect(CATEGORY_PRICE.hospital).toBe(400);
  });
});
