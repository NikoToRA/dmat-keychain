const { calculateItemPrice } = require('../shared/products');

describe('calculateItemPrice', () => {
  // スタンダードレッド (priceDiff: 0) + ボールチェーン (price: 0) = 880
  test('スタンダードレッド + ボールチェーン = 880', () => {
    expect(calculateItemPrice('standard-red', ['ball-chain'])).toBe(880);
  });

  // スタンダードレッド + カラビナ (400) = 1280
  test('スタンダードレッド + カラビナ = 1280', () => {
    expect(calculateItemPrice('standard-red', ['carabiner'])).toBe(1280);
  });

  // スタンダードレッド + 蓄光バンド (400) = 1280
  test('スタンダードレッド + 蓄光バンド = 1280', () => {
    expect(calculateItemPrice('standard-red', ['glow-band'])).toBe(1280);
  });

  // スタンダードレッド + カラビナ + 蓄光バンド = 880 + 400 + 400 = 1680
  test('スタンダードレッド + カラビナ + 蓄光バンド = 1680', () => {
    expect(calculateItemPrice('standard-red', ['carabiner', 'glow-band'])).toBe(1680);
  });

  // プレミアレッド (priceDiff: 0) + ボールチェーン = 880（スタンダードと同価格）
  test('プレミアレッド + ボールチェーン = 880', () => {
    expect(calculateItemPrice('premium-red', ['ball-chain'])).toBe(880);
  });

  // プレミアレッド + カラビナ + 蓄光バンド = 880 + 400 + 400 = 1680
  test('プレミアレッド + カラビナ + 蓄光バンド = 1680', () => {
    expect(calculateItemPrice('premium-red', ['carabiner', 'glow-band'])).toBe(1680);
  });

  // プレミアレッド + 全付属品 = 880 + 0 + 400 + 400 = 1680
  test('プレミアレッド + 全付属品 = 1680', () => {
    expect(calculateItemPrice('premium-red', ['ball-chain', 'carabiner', 'glow-band'])).toBe(1680);
  });

  // 無効なcolorId → null
  test('無効なcolorId → null', () => {
    expect(calculateItemPrice('invalid-color', ['ball-chain'])).toBeNull();
  });

  // 無効なaccessoryId → null
  test('無効なaccessoryId → null', () => {
    expect(calculateItemPrice('standard-red', ['invalid-accessory'])).toBeNull();
  });

  // 空のaccessoryIds → スタンダード 880 / プレミア 880（同価格）
  test('空のaccessoryIds スタンダード = 880', () => {
    expect(calculateItemPrice('standard-red', [])).toBe(880);
  });

  test('空のaccessoryIds プレミア = 880', () => {
    expect(calculateItemPrice('premium-red', [])).toBe(880);
  });
});
