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

  // プレミアレッド (priceDiff: 100) + ボールチェーン = 780
  test('プレミアレッド + ボールチェーン = 780', () => {
    expect(calculateItemPrice('premium-red', ['ball-chain'])).toBe(780);
  });

  // プレミアレッド + カラビナ + 蓄光バンド = 780 + 300 + 400 = 1480
  test('プレミアレッド + カラビナ + 蓄光バンド = 1480', () => {
    expect(calculateItemPrice('premium-red', ['carabiner', 'glow-band'])).toBe(1480);
  });

  // プレミアレッド + 全付属品 = 780 + 0 + 300 + 400 = 1480
  test('プレミアレッド + 全付属品 = 1480', () => {
    expect(calculateItemPrice('premium-red', ['ball-chain', 'carabiner', 'glow-band'])).toBe(1480);
  });

  // 無効なcolorId → null
  test('無効なcolorId → null', () => {
    expect(calculateItemPrice('invalid-color', ['ball-chain'])).toBeNull();
  });

  // 無効なaccessoryId → null
  test('無効なaccessoryId → null', () => {
    expect(calculateItemPrice('standard-red', ['invalid-accessory'])).toBeNull();
  });

  // 空のaccessoryIds → スタンダード 680 / プレミア 780
  test('空のaccessoryIds スタンダード = 680', () => {
    expect(calculateItemPrice('standard-red', [])).toBe(680);
  });

  test('空のaccessoryIds プレミア = 780', () => {
    expect(calculateItemPrice('premium-red', [])).toBe(780);
  });
});
