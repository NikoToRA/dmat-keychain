// カート機能（localStorage永続化）
const CART_KEY = 'dmat_cart';

function generateCartItemId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function loadCart() {
  return getCart();
}

function addToCart(colorId, accessoryIds, quantity) {
  quantity = Math.max(1, parseInt(quantity) || 1);
  const cart = getCart();

  // 同じ構成の既存アイテムを検索
  const existing = cart.find(
    item =>
      item.colorId === colorId &&
      item.accessoryIds.length === accessoryIds.length &&
      item.accessoryIds.every(id => accessoryIds.includes(id))
  );

  if (existing) {
    existing.quantity += quantity;
    existing.unitPrice = calculateItemPrice(colorId, accessoryIds);
    existing.description = getItemDescription(colorId, accessoryIds);
  } else {
    cart.push({
      id: generateCartItemId(),
      colorId,
      accessoryIds: [...accessoryIds],
      quantity,
      unitPrice: calculateItemPrice(colorId, accessoryIds),
      description: getItemDescription(colorId, accessoryIds),
    });
  }

  saveCart(cart);
}

function removeFromCart(itemId) {
  const cart = getCart().filter(item => item.id !== itemId);
  saveCart(cart);
}

function updateQuantity(itemId, quantity) {
  quantity = parseInt(quantity) || 0;
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter(item => item.id !== itemId);
  } else {
    const existing = cart.find(item => item.id === itemId);
    if (existing) existing.quantity = quantity;
  }
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartTotal() {
  const cart = getCart();
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of cart) {
    const itemTotal = item.unitPrice * item.quantity;
    subtotal += itemTotal;
    totalQuantity += item.quantity;
  }

  const shipping = calculateShipping(totalQuantity);
  const total = subtotal + shipping.price;

  return { items: cart, subtotal, shipping, totalQuantity, total };
}

function getCartTotalQuantity() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getCartTotalQuantity();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
