import { test, expect } from '@playwright/test'

// Helper: set cart data in localStorage before navigating
async function setCartData(page: any, cartData: any[]) {
  // We need to navigate first to set localStorage on the correct origin
  await page.goto('/')
  await page.evaluate((data: any[]) => {
    localStorage.setItem('dmat_cart', JSON.stringify(data))
  }, cartData)
}

// ============================================================
// 1. Top page loads correctly
// ============================================================
test.describe('1. Top page loads correctly', () => {
  test('page title contains DMAT STORE', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/DMAT STORE/)
  })

  test('header has DMAT STORE text', async ({ page }) => {
    await page.goto('/')
    const header = page.locator('#site-header')
    await expect(header).toContainText('DMAT STORE')
  })

  test('recommended section heading is visible', async ({ page }) => {
    await page.goto('/')
    const heading = page.locator('h2', { hasText: 'おすすめ商品' })
    await expect(heading).toBeVisible()
  })

  test('5 product cards are rendered', async ({ page }) => {
    await page.goto('/')
    const grid = page.locator('#recommended-grid')
    await expect(grid).toBeVisible()
    const cards = grid.locator('.product-card')
    await expect(cards).toHaveCount(5, { timeout: 10000 })
  })

  test('how-to-use section exists', async ({ page }) => {
    await page.goto('/')
    const heading = page.locator('h2', { hasText: 'キーホルダーの使い方' })
    await expect(heading).toBeVisible()
  })

  test('category section exists', async ({ page }) => {
    await page.goto('/')
    const heading = page.locator('h2', { hasText: 'カテゴリーから探す' })
    await expect(heading).toBeVisible()
  })

  test('custom order section exists', async ({ page }) => {
    await page.goto('/')
    const heading = page.locator('h2', { hasText: '自分のキーホルダーを作る' })
    await expect(heading).toBeVisible()
  })

  test('footer is present', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})

// ============================================================
// 2. Product card quantity and add to cart
// ============================================================
test.describe('2. Product card quantity and add to cart', () => {
  test('set quantity to 2 and add to cart, verify in cart page', async ({ page }) => {
    await page.goto('/')
    // Wait for product cards in recommended grid
    const grid = page.locator('#recommended-grid')
    const firstCard = grid.locator('.product-card').first()
    await expect(firstCard).toBeVisible({ timeout: 10000 })

    // Click + button to increment quantity to 2
    const plusBtn = firstCard.locator('.qty-plus')
    await plusBtn.click()

    // Verify quantity display shows 2
    const qtyDisplay = firstCard.locator('.qty-display')
    await expect(qtyDisplay).toHaveText('2')

    // Click "カートに入れる"
    const addBtn = firstCard.locator('.add-set-btn')
    await addBtn.click()

    // Verify toast notification appears
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible({ timeout: 5000 })

    // Navigate to cart
    await page.goto('/cart')

    // Verify cart shows item with quantity 2
    const cartContent = page.locator('#cart-content')
    await expect(cartContent).toContainText('2', { timeout: 5000 })
  })
})

// ============================================================
// 3. Product detail page - Set mode
// ============================================================
test.describe('3. Product detail page - Set mode', () => {
  test('basic set page shows correct info', async ({ page }) => {
    await page.goto('/product?set=basic')

    // Wait for JS to render content
    const content = page.locator('#product-content')
    await expect(content).not.toBeEmpty({ timeout: 10000 })

    // Verify product name
    await expect(content.locator('h1')).toContainText('ベーシック')

    // Verify price is displayed (680 yen)
    await expect(content).toContainText('680')

    // Verify "カートに入れる" button exists
    const addBtn = page.locator('#add-to-cart-btn')
    await expect(addBtn).toBeVisible()
    await expect(addBtn).toContainText('カートに入れる')

    // Click "カートに入れる"
    await addBtn.click()

    // Verify toast appears
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// 4. Product detail page - Custom builder
// ============================================================
test.describe('4. Product detail page - Custom builder', () => {
  test('custom builder shows steps and allows selection', async ({ page }) => {
    await page.goto('/product?custom=true')

    const content = page.locator('#product-content')
    await expect(content).not.toBeEmpty({ timeout: 10000 })

    // Verify "用途を選ぶ" step exists
    await expect(content.locator('text=用途を選ぶ')).toBeVisible()

    // Verify "カラーを選ぶ" step exists
    await expect(content.locator('text=カラーを選ぶ')).toBeVisible()

    // Verify "アクセサリを選ぶ" step exists
    await expect(content.locator('text=アクセサリを選ぶ')).toBeVisible()

    // Click on "病院向け" category option
    const hospitalOption = page.locator('[data-category="hospital"]')
    await hospitalOption.click()

    // Verify it becomes selected
    await expect(hospitalOption).toHaveClass(/selected/)

    // Get the initial price text
    const priceEl = page.locator('#custom-price')
    const priceBefore = await priceEl.textContent()

    // Click on カラビナ accessory
    const carabinerOption = page.locator('[data-accessory="carabiner"]')
    await carabinerOption.click()

    // Verify accessory becomes selected
    await expect(carabinerOption).toHaveClass(/selected/)

    // Verify price updates (should increase with carabiner +300)
    const priceAfter = await priceEl.textContent()
    expect(priceAfter).not.toBe(priceBefore)

    // Click "カートに入れる"
    const addBtn = page.locator('#add-to-cart-btn')
    await addBtn.click()

    // Verify toast
    const toast = page.locator('.toast')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })
})

// ============================================================
// 5. Cart page
// ============================================================
test.describe('5. Cart page', () => {
  test('displays cart items and allows quantity change', async ({ page }) => {
    // Set cart data via localStorage
    const cartData = [{
      id: 'test-1',
      colorId: 'standard-red',
      accessoryIds: ['ball-chain'],
      quantity: 2,
      unitPrice: 680,
      description: 'テスト商品',
      category: 'dmat-member'
    }]
    await setCartData(page, cartData)

    // Navigate to cart
    await page.goto('/cart')

    const cartContent = page.locator('#cart-content')
    await expect(cartContent).not.toBeEmpty({ timeout: 10000 })

    // Verify item is displayed
    await expect(cartContent).toContainText('テスト商品')

    // Verify quantity shows 2
    await expect(cartContent).toContainText('2')

    // Verify price calculation: 680 * 2 = 1,360
    await expect(cartContent).toContainText('1,360')

    // Click + to increase quantity
    const plusBtn = cartContent.locator('.cart-qty-plus').first()
    await plusBtn.click()

    // Verify quantity updates to 3 (re-rendered)
    await expect(cartContent).toContainText('3', { timeout: 5000 })
  })
})

// ============================================================
// 6. Confirm page
// ============================================================
test.describe('6. Confirm page', () => {
  test('shows order summary and checkout button', async ({ page }) => {
    const cartData = [{
      id: 'test-1',
      colorId: 'standard-red',
      accessoryIds: ['ball-chain'],
      quantity: 2,
      unitPrice: 680,
      description: 'テスト商品',
      category: 'dmat-member'
    }]
    await setCartData(page, cartData)

    await page.goto('/confirm')

    const confirmContent = page.locator('#confirm-content')
    await expect(confirmContent).not.toBeEmpty({ timeout: 10000 })

    // Verify order summary table is shown
    await expect(confirmContent.locator('table')).toBeVisible()

    // Verify item is in the table
    await expect(confirmContent).toContainText('テスト商品')

    // Verify "注文を確定して決済へ進む" button exists
    const checkoutBtn = page.locator('#checkout-button')
    await expect(checkoutBtn).toBeVisible()
    await expect(checkoutBtn).toContainText('注文を確定して決済へ進む')
  })
})

// ============================================================
// 7. Page navigation - all pages return 200
// ============================================================
test.describe('7. Page navigation - all pages load', () => {
  const pages = [
    { path: '/', name: 'Top' },
    { path: '/cart', name: 'Cart' },
    { path: '/product', name: 'Product' },
    { path: '/confirm', name: 'Confirm' },
    { path: '/thanks', name: 'Thanks' },
    { path: '/cancel', name: 'Cancel' },
    { path: '/category', name: 'Category' },
    { path: '/legal/tokushoho', name: 'Tokushoho' },
    { path: '/legal/privacy', name: 'Privacy' },
    { path: '/legal/returns', name: 'Returns' },
  ]

  for (const p of pages) {
    test(`${p.name} page (${p.path}) loads without error`, async ({ page }) => {
      const response = await page.goto(p.path)
      // Verify response status is 200
      expect(response?.status()).toBe(200)
      // Verify page has content (not blank)
      const body = page.locator('body')
      await expect(body).not.toBeEmpty()
    })
  }
})

// ============================================================
// 8. Category page
// ============================================================
test.describe('8. Category page', () => {
  test('dmat-member category shows correct title and filtered products', async ({ page }) => {
    await page.goto('/category?cat=dmat-member')

    // Verify category title
    const title = page.locator('#category-title')
    await expect(title).toHaveText('DMAT隊員用グッズ')

    // Verify product cards are rendered (filtered to dmat-member: 5 products)
    const grid = page.locator('#category-grid')
    const cards = grid.locator('.product-card')
    await expect(cards).toHaveCount(5, { timeout: 10000 })
  })
})

// ============================================================
// 9. "公式" text is nowhere
// ============================================================
test.describe('9. No "公式" or "Official" text', () => {
  test('page does not contain 公式 or Official', async ({ page }) => {
    await page.goto('/')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('公式')
    // Check for "Official" (case insensitive) - but allow it in CSS class names or technical attrs
    // Only check visible text content
    expect(bodyText).not.toMatch(/Official/i)
  })
})

// ============================================================
// 10. Mobile responsive
// ============================================================
test.describe('10. Mobile responsive', () => {
  test('page loads on iPhone viewport and cards stack vertically', async ({ page }) => {
    // Set viewport to iPhone size
    await page.setViewportSize({ width: 375, height: 812 })

    await page.goto('/')

    // Verify page loads
    await expect(page).toHaveTitle(/DMAT STORE/)

    // Verify product cards are visible
    const grid = page.locator('#recommended-grid')
    const cards = grid.locator('.product-card')
    await expect(cards).toHaveCount(5, { timeout: 10000 })

    // On mobile (375px), grid-cols-1 means cards stack vertically
    // Verify by checking that first two cards have same X position (left aligned)
    const firstCard = cards.nth(0)
    const secondCard = cards.nth(1)

    const firstBox = await firstCard.boundingBox()
    const secondBox = await secondCard.boundingBox()

    expect(firstBox).not.toBeNull()
    expect(secondBox).not.toBeNull()

    if (firstBox && secondBox) {
      // Cards should be stacked vertically: same X, different Y
      expect(firstBox.x).toBe(secondBox.x)
      expect(secondBox.y).toBeGreaterThan(firstBox.y)
    }
  })
})
