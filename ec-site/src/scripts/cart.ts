// カート機能（localStorage永続化）TypeScript版
import { calculateItemPrice, getItemDescription } from './products';
import { calculateShipping } from './shipping';

export interface CartItem {
  id: string;
  colorId: string;
  accessoryIds: string[];
  quantity: number;
  unitPrice: number;
  description: string;
}

export interface ShippingResult {
  method: string | null;
  price: number;
}

export interface CartTotal {
  items: CartItem[];
  subtotal: number;
  shipping: ShippingResult;
  totalQuantity: number;
  total: number;
}

const CART_KEY = 'dmat_cart';

function generateCartItemId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]') as CartItem[];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

export function addToCart(colorId: string, accessoryIds: string[], quantity: number): void {
  quantity = Math.max(1, Math.floor(quantity) || 1);
  const cart = getCart();

  const existing = cart.find(
    (item) =>
      item.colorId === colorId &&
      item.accessoryIds.length === accessoryIds.length &&
      item.accessoryIds.every((id) => accessoryIds.includes(id))
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

export function removeFromCart(itemId: string): void {
  const cart = getCart().filter((item) => item.id !== itemId);
  saveCart(cart);
}

export function updateQuantity(itemId: string, quantity: number): void {
  quantity = Math.floor(quantity) || 0;
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.id !== itemId);
  } else {
    const existing = cart.find((item) => item.id === itemId);
    if (existing) {
      existing.quantity = quantity;
    }
  }
  saveCart(cart);
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

export function getCartTotal(): CartTotal {
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

export function getCartTotalQuantity(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function updateCartBadge(): void {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getCartTotalQuantity();
  badge.textContent = String(count);
  badge.style.display = count > 0 ? 'flex' : 'none';
}
