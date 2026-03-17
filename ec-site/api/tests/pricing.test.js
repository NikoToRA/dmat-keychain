const { calculateItemPrice } = require('../shared/products');

describe('calculateItemPrice', () => {
  // スタンダードレッド (priceDiff: 0) + ボールチェーン (price: 0) = 680
  test('スタンダードレッド + ボールチェーン = 680', () => {
    expect(calculateItemPrice('standard-red', ['ball-chain'])).toBe(680);
  });

  // スタンダードレッド + カラビナ (300) = 980
  test('スタンダードレッド + カラビナ = 980', () => {
    expect(calculateItemPrice('standard-red', ['carabiner'])).toBe(980);
  });

  // スタンダードレッド + 蓄光バンド (400) = 1080
  test('スタンダードレッド + 蓄光バンド = 1080', () => {
    expect(calculateItemPrice('standard-red', ['glow-band'])).toBe(1080);
  });

  // スタンダードレッド + カラビナ + 蓄光バンド = 680 + 300 + 400 = 1380
  test('スタンダードレッド + カラビナ + 蓄光バンド = 1380', () => {
    expect(calculateItemPrice('standard-red', ['carabiner', 'glow-band'])).toBe(1380);
  });

  // プレミアレッド (priceDiff: 0) + ボールチェーン = 680（スタンダードと同価格）
  test('プレミアレッド + ボールチェーン = 680', () => {
    expect(calculateItemPrice('premium-red', ['ball-chain'])).toBe(680);
  });

  // プレミアレッド + カラビナ + 蓄光バンド = 680 + 300 + 400 = 1380
  test('プレミアレッド + カラビナ + 蓄光バンド = 1380', () => {
    expect(calculateItemPrice('premium-red', ['carabiner', 'glow-band'])).toBe(1380);
  });

  // プレミアレッド + 全付属品 = 680 + 0 + 300 + 400 = 1380
  test('プレミアレッド + 全付属品 = 1380', () => {
    expect(calculateItemPrice('premium-red', ['ball-chain', 'carabiner', 'glow-band'])).toBe(1380);
  });

  // 無効なcolorId → null
  test('無効なcolorId → null', () => {
    expect(calculateItemPrice('invalid-color', ['ball-chain'])).toBeNull();
  });

  // 無効なaccessoryId → null
  test('無効なaccessoryId → null', () => {
    expect(calculateItemPrice('standard-red', ['invalid-accessory'])).toBeNull();
  });

  // 空のaccessoryIds → スタンダード 680 / プレミア 680（同価格）
  test('空のaccessoryIds スタンダード = 680', () => {
    expect(calculateItemPrice('standard-red', [])).toBe(680);
  });

  test('空のaccessoryIds プレミア = 680', () => {
    expect(calculateItemPrice('premium-red', [])).toBe(680);
  });
});
