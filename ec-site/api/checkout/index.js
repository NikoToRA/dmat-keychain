const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { calculateItemPrice, getItemDescription, calculateShipping } = require('../shared/products');

module.exports = async function (context, req) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      context.res = { status: 400, body: { error: '商品が選択されていません' } };
      return;
    }

    // 各アイテムのバリデーション + サーバー側価格計算
    const lineItems = [];
    let totalQuantity = 0;

    for (const item of items) {
      const qty = item.quantity;
      if (!item.colorId || !Array.isArray(item.accessoryIds) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        context.res = { status: 400, body: { error: '不正なリクエストです' } };
        return;
      }

      const category = item.category;
      if (!category || (category !== 'dmat-member' && category !== 'hospital')) {
        context.res = { status: 400, body: { error: '無効なカテゴリです' } };
        return;
      }

      const unitAmount = calculateItemPrice(item.colorId, item.accessoryIds, category);
      if (unitAmount === null) {
        context.res = { status: 400, body: { error: '無効な商品構成です' } };
        return;
      }

      const name = getItemDescription(item.colorId, item.accessoryIds, category);

      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: unitAmount,
          product_data: {
            name,
            metadata: {
              category: category,
            },
          },
        },
        quantity: qty,
      });

      totalQuantity += qty;
    }

    if (totalQuantity > 500) {
      context.res = { status: 400, body: { error: '一度に注文できる数量を超えています' } };
      return;
    }
    if (items.length > 20) {
      context.res = { status: 400, body: { error: '一度に注文できるアイテム数を超えています' } };
      return;
    }

    // 送料を独立line_itemとして追加
    const shipping = calculateShipping(totalQuantity);
    if (shipping.price > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          unit_amount: shipping.price,
          product_data: {
            name: `送料（${shipping.method}）`,
          },
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['JP'],
      },
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${process.env.PUBLIC_BASE_URL}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_BASE_URL}/cancel`,
      locale: 'ja',
      metadata: {
        service: 'dmat-store',
        total_quantity: String(totalQuantity),
        shipping_method: totalQuantity <= 4 ? 'clickpost' : 'letterpack_x' + Math.ceil(totalQuantity / 15),
      },
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { url: session.url },
    };
  } catch (err) {
    context.log.error('Checkout error:', err);
    context.res = {
      status: 500,
      body: { error: '決済セッションの作成に失敗しました' },
    };
  }
};
