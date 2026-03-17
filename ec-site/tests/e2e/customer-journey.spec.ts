import { test, expect, Page } from '@playwright/test'

// ============================================================
// Helpers
// ============================================================

/** Navigate to origin then clear localStorage so each test starts fresh */
async function clearCart(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
}

/** Inject cart data into localStorage (must be on site origin first) */
async function setCart(page: Page, items: object[]) {
  await page.evaluate((data) => {
    localStorage.setItem('dmat_cart', JSON.stringify(data))
  }, items)
}

/** Wait for the JS-rendered recommended grid on the top page */
async function waitForProductCards(page: Page) {
  const grid = page.locator('#recommended-grid')
  await expect(grid).toBeVisible({ timeout: 15000 })
  await expect(grid.locator('.product-card').first()).toBeVisible({ timeout: 15000 })
}

// Sample cart item matching the schema used by the site
function makeCartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dmat-keychain-test-' + Date.now(),
    colorId: 'standard-red',
    accessoryIds: ['ball-chain'],
    quantity: 1,
    unitPrice: 680,
    description: 'ベーシックセット',
    category: 'dmat-member',
    ...overrides,
  }
}

// ============================================================
// 1. Happy Path: Top -> Recommended -> Cart -> Confirm
// ============================================================
test.describe('1. Happy Path: Top -> Cart -> Confirm', () => {
  test.beforeEach(async ({ page }) => { await clearCart(page) })

  test('add first product from top, verify cart & confirm page', async ({ page }) => {
    await page.goto('/')
    await waitForProductCards(page)

    // Click "カートに入れる" on first product card
    const grid = page.locator('#recommended-grid')
    const firstCard = grid.locator('.product-card').first()
    const addBtn = firstCard.locator('.add-set-btn')
    await addBtn.click()

    // Toast should appear
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible({ timeout: 5000 })

    // Navigate to cart
    await page.goto('/cart')
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })

    // Verify item is shown with price
    await expect(cartContent).toContainText('ベーシックセット')
    await expect(cartContent).toContainText('680')

    // Click "まとめて購入する" link to /confirm
    const confirmLink = cartContent.locator('a[href="/confirm"]')
    await expect(confirmLink).toBeVisible()
    await confirmLink.click()

    // Verify confirm page
    await expect(page).toHaveURL(/\/confirm/)
    const confirmContent = page.locator('#confirm-content')
    await expect(confirmContent).not.toBeEmpty({ timeout: 10000 })
    await expect(confirmContent).toContainText('ベーシックセット')

    // Verify checkout button exists
    const checkoutBtn = page.locator('#checkout-button')
    await expect(checkoutBtn).toBeVisible()
    await expect(checkoutBtn).toContainText('注文を確定して決済へ進む')
  })
})

// ============================================================
// 2. Happy Path: Custom Builder -> Cart
// ============================================================
test.describe('2. Custom Builder -> Cart', () => {
  test.beforeEach(async ({ page }) => { await clearCart(page) })

  test('select hospital category + carabiner, set qty 3, add to cart', async ({ page }) => {
    await page.goto('/product?custom=true')

    const content = page.locator('#product-content')
    await expect(content).not.toBeEmpty({ timeout: 15000 })

    // Verify category options exist
    await expect(content.locator('text=用途を選ぶ')).toBeVisible()

    // Click "病院向け"
    const hospitalOption = page.locator('[data-category="hospital"]')
    await hospitalOption.click()
    await expect(hospitalOption).toHaveClass(/selected/)

    // Click カラビナ accessory
    const carabinerOption = page.locator('[data-accessory="carabiner"]')
    await carabinerOption.click()
    await expect(carabinerOption).toHaveClass(/selected/)

    // Verify price: base 680 + hospital 300 + carabiner 300 = 1,280
    const priceEl = page.locator('#custom-price')
    await expect(priceEl).toContainText('1,280')

    // Set quantity to 3 (click + twice; starts at 1)
    const plusBtn = page.locator('#qty-plus')
    await plusBtn.click()
    await plusBtn.click()
    const qtyInput = page.locator('#qty-input')
    await expect(qtyInput).toHaveValue('3')

    // Click "カートに入れる"
    await page.locator('#add-to-cart-btn').click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 })

    // Navigate to cart and verify
    await page.goto('/cart')
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })
    // Quantity 3 should be visible in the cart
    await expect(cartContent).toContainText('3')
  })
})

// ============================================================
// 3. Cart operations: qty change, remove, empty cart
// ============================================================
test.describe('3. Cart operations', () => {
  test('increase qty, remove items, verify empty state', async ({ page }) => {
    await clearCart(page)

    // Seed 2 items via localStorage
    const item1 = makeCartItem({ id: 'item-1', description: 'テスト商品A', unitPrice: 680, quantity: 1 })
    const item2 = makeCartItem({ id: 'item-2', description: 'テスト商品B', unitPrice: 980, quantity: 1, colorId: 'premium-red', accessoryIds: ['ball-chain', 'carabiner'] })
    await setCart(page, [item1, item2])

    await page.goto('/cart')
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })

    // Verify 2 items displayed
    await expect(cartContent).toContainText('テスト商品A')
    await expect(cartContent).toContainText('テスト商品B')

    // Increase quantity of first item (click +)
    const firstRow = cartContent.locator('[data-index="0"]')
    await firstRow.locator('.cart-qty-plus').click()
    // After re-render, verify quantity shows 2
    await expect(page.locator('#cart-content')).toContainText('テスト商品A')
    // Price for item1: 680*2 = 1,360
    await expect(page.locator('#cart-content')).toContainText('1,360')

    // Remove first item
    await page.locator('#cart-content [data-index="0"] .cart-remove').click()

    // After removal, only second item should remain
    await expect(page.locator('#cart-content')).toContainText('テスト商品B')
    await expect(page.locator('#cart-content')).not.toContainText('テスト商品A')

    // Remove remaining item
    await page.locator('#cart-content [data-index="0"] .cart-remove').click()

    // Verify empty cart message
    await expect(page.locator('#cart-content')).toContainText('カートに商品がありません')

    // Verify "商品を見る" link
    const shopLink = page.locator('#cart-content a[href="/"]')
    await expect(shopLink).toBeVisible()
    await expect(shopLink).toContainText('商品を見る')
  })
})

// ============================================================
// 4. Cart -> Top -> Back to Cart (persistence)
// ============================================================
test.describe('4. Cart persistence after navigating away', () => {
  test('cart survives navigation to top and back', async ({ page }) => {
    await clearCart(page)

    // Add item from top page
    await page.goto('/')
    await waitForProductCards(page)
    const addBtn = page.locator('#recommended-grid .add-set-btn').first()
    await addBtn.click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 })

    // Go to cart
    await page.goto('/cart')
    await expect(page.locator('#cart-content')).toContainText('ベーシックセット')

    // Click "買い物を続ける" -> goes to /
    const continueLink = page.locator('#cart-content a[href="/"]')
    await continueLink.click()
    await expect(page).toHaveURL('/')

    // Go back to cart -- item should still be there
    await page.goto('/cart')
    await expect(page.locator('#cart-content')).toContainText('ベーシックセット')
  })
})

// ============================================================
// 5. Confirm -> Back to Cart
// ============================================================
test.describe('5. Confirm page -> back to cart', () => {
  test('return to cart from confirm page with item intact', async ({ page }) => {
    await clearCart(page)
    await setCart(page, [makeCartItem()])

    await page.goto('/confirm')
    const confirmContent = page.locator('#confirm-content')
    await expect(confirmContent).not.toBeEmpty({ timeout: 10000 })
    await expect(confirmContent).toContainText('ベーシックセット')

    // Click "カートに戻る"
    const backLink = confirmContent.locator('a[href="/cart"]')
    await backLink.click()

    await expect(page).toHaveURL(/\/cart/)
    await expect(page.locator('#cart-content')).toContainText('ベーシックセット')
  })
})

// ============================================================
// 6. Empty cart -> Confirm page
// ============================================================
test.describe('6. Empty cart on confirm page', () => {
  test('shows empty message when cart is empty', async ({ page }) => {
    await clearCart(page)

    await page.goto('/confirm')
    const confirmContent = page.locator('#confirm-content')
    await expect(confirmContent).not.toBeEmpty({ timeout: 10000 })
    await expect(confirmContent).toContainText('カートに商品がありません')
  })
})

// ============================================================
// 7. Empty cart on cart page
// ============================================================
test.describe('7. Empty cart page', () => {
  test('shows empty state with link to shop', async ({ page }) => {
    await clearCart(page)

    await page.goto('/cart')
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })
    await expect(cartContent).toContainText('カートに商品がありません')

    const shopLink = cartContent.locator('a[href="/"]')
    await expect(shopLink).toBeVisible()
    await expect(shopLink).toContainText('商品を見る')
  })
})

// ============================================================
// 8. Product detail: Set mode -> Add to cart + Buy now
// ============================================================
test.describe('8. Product detail: Set mode', () => {
  test.beforeEach(async ({ page }) => { await clearCart(page) })

  test('premium set page -> add to cart -> toast', async ({ page }) => {
    await page.goto('/product?set=premium')
    const content = page.locator('#product-content')
    await expect(content).not.toBeEmpty({ timeout: 15000 })

    // Verify product name
    await expect(content.locator('h1')).toContainText('プレミアムセット')

    // Verify price is displayed (680 + carabiner 300 + glow 400 = 1,380)
    await expect(content).toContainText('1,380')

    // Click "カートに入れる"
    await page.locator('#add-to-cart-btn').click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 })
  })

  test('buy now redirects to cart', async ({ page }) => {
    await page.goto('/product?set=premium')
    const content = page.locator('#product-content')
    await expect(content).not.toBeEmpty({ timeout: 15000 })

    // Click "今すぐ購入"
    await page.locator('#buy-now-btn').click()

    // Should redirect to /cart
    await expect(page).toHaveURL(/\/cart/)
    await expect(page.locator('#cart-content')).toContainText('プレミアムセット')
  })
})

// ============================================================
// 9. Multiple distinct products in cart
// ============================================================
test.describe('9. Multiple products in cart', () => {
  test('two different sets show correct subtotal and shipping', async ({ page }) => {
    await clearCart(page)

    // Add basic set from top page
    await page.goto('/')
    await waitForProductCards(page)
    // First card = basic (680)
    await page.locator('#recommended-grid .add-set-btn').first().click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 })

    // Add premium set (second card) -- index 1
    // Wait for toast to disappear first to avoid click issues
    await page.waitForTimeout(500)
    await page.locator('#recommended-grid .product-card').nth(1).locator('.add-set-btn').click()
    await expect(page.locator('.toast').last()).toBeVisible({ timeout: 5000 })

    // Go to cart
    await page.goto('/cart')
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })

    // Verify 2 distinct items
    await expect(cartContent).toContainText('ベーシックセット')
    await expect(cartContent).toContainText('プレミアムセット')

    // Subtotal: 680 + 1380 = 2,060
    await expect(cartContent).toContainText('2,060')

    // Shipping: 2 items -> click post 185
    await expect(cartContent).toContainText('185')
    await expect(cartContent).toContainText('クリックポスト')
  })
})

// ============================================================
// 10. Same product added twice -> quantity merged
// ============================================================
test.describe('10. Same product merged in cart', () => {
  test('adding same basic set twice merges to qty 2', async ({ page }) => {
    await clearCart(page)

    await page.goto('/')
    await waitForProductCards(page)

    // Add basic set twice
    const addBasic = page.locator('#recommended-grid .product-card').first().locator('.add-set-btn')
    await addBasic.click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(600) // let toast clear and qty reset
    await addBasic.click()

    // Go to cart
    await page.goto('/cart')
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })

    // Should be 1 line item with qty 2
    // Count data-index rows -- should be only 1 (index 0)
    const rows = cartContent.locator('[data-index]')
    await expect(rows).toHaveCount(1)

    // Line total should be 680 * 2 = 1,360
    await expect(cartContent).toContainText('1,360')
  })
})

// ============================================================
// 11. Category page -> product selection
// ============================================================
test.describe('11. Category page', () => {
  test.beforeEach(async ({ page }) => { await clearCart(page) })

  test('dmat-member category shows filtered products', async ({ page }) => {
    await page.goto('/category?cat=dmat-member')

    const title = page.locator('#category-title')
    await expect(title).toHaveText('DMAT隊員用グッズ')

    const grid = page.locator('#category-grid')
    const cards = grid.locator('.product-card')
    await expect(cards).toHaveCount(2, { timeout: 10000 })
  })

  test('clicking product card navigates to product detail', async ({ page }) => {
    await page.goto('/category?cat=dmat-member')

    const grid = page.locator('#category-grid')
    const firstLink = grid.locator('a[href*="/product?set="]').first()
    await expect(firstLink).toBeVisible({ timeout: 10000 })
    await firstLink.click()

    await expect(page).toHaveURL(/\/product\?set=/)
    const content = page.locator('#product-content')
    await expect(content).not.toBeEmpty({ timeout: 15000 })
  })
})

// ============================================================
// 12. Browser back preserves cart
// ============================================================
test.describe('12. Browser back navigation', () => {
  test('go to product -> back -> cart preserved', async ({ page }) => {
    await clearCart(page)

    // Add item first
    await page.goto('/')
    await waitForProductCards(page)
    await page.locator('#recommended-grid .add-set-btn').first().click()
    await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 })

    // Click product link to go to detail page
    const productLink = page.locator('#recommended-grid .product-card a[href*="/product?set=basic"]').first()
    await productLink.click()
    await expect(page).toHaveURL(/\/product\?set=basic/)

    // Press browser back
    await page.goBack()
    await expect(page).toHaveURL('/')

    // Cart state should be preserved -- verify by going to cart
    await page.goto('/cart')
    await expect(page.locator('#cart-content')).toContainText('ベーシックセット')
  })
})

// ============================================================
// 13. Thanks & Cancel pages direct access
// ============================================================
test.describe('13. Thanks & Cancel direct access', () => {
  test('thanks page loads without error (no session_id)', async ({ page }) => {
    const response = await page.goto('/thanks')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1')).toContainText('ご注文ありがとうございます')
    // "トップに戻る" link (use getByRole to target the specific button-style link)
    await expect(page.getByRole('link', { name: 'トップに戻る' })).toBeVisible()
  })

  test('cancel page loads with "カートに戻る" button', async ({ page }) => {
    const response = await page.goto('/cancel')
    expect(response?.status()).toBe(200)

    await expect(page.locator('h1')).toContainText('決済がキャンセルされました')
    const cartLink = page.getByRole('link', { name: 'カートに戻る' })
    await expect(cartLink).toBeVisible()
  })
})

// ============================================================
// 14. Shipping threshold: 4 items vs 5 items
// ============================================================
test.describe('14. Shipping threshold', () => {
  test('4 items -> click post 185; 5 items -> letter pack 370', async ({ page }) => {
    await clearCart(page)

    // Seed cart with qty 4
    await setCart(page, [makeCartItem({ quantity: 4 })])
    await page.goto('/cart')
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })
    await expect(cartContent).toContainText('クリックポスト')
    await expect(cartContent).toContainText('185')

    // Increase to 5 by clicking +
    await page.locator('#cart-content [data-index="0"] .cart-qty-plus').click()

    // After re-render, shipping should change
    await expect(page.locator('#cart-content')).toContainText('レターパックライト')
    await expect(page.locator('#cart-content')).toContainText('370')
  })
})

// ============================================================
// 15. Custom builder: accessory select/deselect/reselect
// ============================================================
test.describe('15. Custom builder accessory toggle', () => {
  test('select carabiner, deselect, select glow band, verify price', async ({ page }) => {
    await clearCart(page)

    await page.goto('/product?custom=true')
    const content = page.locator('#product-content')
    await expect(content).not.toBeEmpty({ timeout: 15000 })

    const priceEl = page.locator('#custom-price')

    // Initial price: 680 (base) + 0 (dmat-member) + 0 (ball-chain default) = 680
    await expect(priceEl).toContainText('680')

    // Select carabiner -> 680 + 300 = 980
    const carabiner = page.locator('[data-accessory="carabiner"]')
    await carabiner.click()
    await expect(carabiner).toHaveClass(/selected/)
    await expect(priceEl).toContainText('980')

    // Deselect carabiner -> back to 680
    await carabiner.click()
    await expect(carabiner).not.toHaveClass(/selected/)
    await expect(priceEl).toContainText('680')

    // Select glow band -> 680 + 400 = 1,080
    const glowBand = page.locator('[data-accessory="glow-band"]')
    await glowBand.click()
    await expect(glowBand).toHaveClass(/selected/)
    await expect(priceEl).toContainText('1,080')
  })
})
