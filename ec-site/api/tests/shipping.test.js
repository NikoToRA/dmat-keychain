const { calculateShipping } = require('../shared/products');

describe('calculateShipping', () => {
  test('0個 → 0円', () => {
    const result = calculateShipping(0);
    expect(result.price).toBe(0);
    expect(result.method).toBeNull();
  });

  test('1個 → 185円（クリックポスト）', () => {
    const result = calculateShipping(1);
    expect(result.price).toBe(185);
    expect(result.method).toBe('クリックポスト');
  });

  test('4個 → 185円（クリックポスト）', () => {
    const result = calculateShipping(4);
    expect(result.price).toBe(185);
    expect(result.method).toBe('クリックポスト');
  });

  test('5個 → 370円（レターパックライト）', () => {
    const result = calculateShipping(5);
    expect(result.price).toBe(370);
    expect(result.method).toBe('レターパックライト');
  });

  test('10個 → 370円（レターパックライト）', () => {
    const result = calculateShipping(10);
    expect(result.price).toBe(370);
    expect(result.method).toBe('レターパックライト');
  });
});
