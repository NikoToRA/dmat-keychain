// Stripeをモック
jest.mock('stripe', () => {
  const mockCreate = jest.fn().mockResolvedValue({
    url: 'https://checkout.stripe.com/test-session',
  });
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: mockCreate,
      },
    },
  }));
});

// 環境変数
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.PUBLIC_BASE_URL = 'https://example.com';

const checkoutHandler = require('../checkout/index');
const stripe = require('stripe');

function createContext() {
  return {
    log: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    res: null,
  };
}

describe('checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('空のitems → 400エラー', async () => {
    const context = createContext();
    await checkoutHandler(context, { body: { items: [] } });
    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toBe('商品が選択されていません');
  });

  test('items未指定 → 400エラー', async () => {
    const context = createContext();
    await checkoutHandler(context, { body: {} });
    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toBe('商品が選択されていません');
  });

  test('無効なcolorId → 400エラー', async () => {
    const context = createContext();
    await checkoutHandler(context, {
      body: {
        items: [{ colorId: 'invalid', accessoryIds: ['ball-chain'], quantity: 1, category: 'dmat-member' }],
      },
    });
    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toBe('無効な商品構成です');
  });

  test('category未指定 → 400エラー', async () => {
    const context = createContext();
    await checkoutHandler(context, {
      body: {
        items: [{ colorId: 'standard-red', accessoryIds: ['ball-chain'], quantity: 1 }],
      },
    });
    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toBe('無効なカテゴリです');
  });

  test('不正なcategory → 400エラー', async () => {
    const context = createContext();
    await checkoutHandler(context, {
      body: {
        items: [{ colorId: 'standard-red', accessoryIds: ['ball-chain'], quantity: 1, category: 'fake' }],
      },
    });
    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toBe('無効なカテゴリです');
  });

  test('数量100 → 400エラー（上限超過）', async () => {
    const context = createContext();
    await checkoutHandler(context, {
      body: {
        items: [{ colorId: 'standard-red', accessoryIds: ['ball-chain'], quantity: 100, category: 'dmat-member' }],
      },
    });
    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toBe('不正なリクエストです');
  });

  test('数量0 → 400エラー', async () => {
    const context = createContext();
    await checkoutHandler(context, {
      body: {
        items: [{ colorId: 'standard-red', accessoryIds: ['ball-chain'], quantity: 0, category: 'dmat-member' }],
      },
    });
    expect(context.res.status).toBe(400);
    expect(context.res.body.error).toBe('不正なリクエストです');
  });

  test('正常なリクエスト → Stripe session作成', async () => {
    const context = createContext();
    await checkoutHandler(context, {
      body: {
        items: [{ colorId: 'standard-red', accessoryIds: ['ball-chain'], quantity: 2, category: 'dmat-member' }],
      },
    });

    expect(context.res.status).toBe(200);
    expect(context.res.body.url).toBe('https://checkout.stripe.com/test-session');

    // Stripe sessions.createが呼ばれたことを確認
    const stripeInstance = stripe();
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledTimes(1);

    const callArgs = stripeInstance.checkout.sessions.create.mock.calls[0][0];
    // サーバー側で価格を再計算していることを確認（unit_amount = 880）
    expect(callArgs.line_items[0].price_data.unit_amount).toBe(880);
    expect(callArgs.line_items[0].quantity).toBe(2);
    // 送料line_itemが含まれている
    expect(callArgs.line_items[1].price_data.unit_amount).toBe(185);
    expect(callArgs.line_items[1].price_data.product_data.name).toContain('送料');
    // 日本国内限定
    expect(callArgs.shipping_address_collection.allowed_countries).toEqual(['JP']);
  });
});
