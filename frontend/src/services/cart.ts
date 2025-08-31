import { Product } from './api';

export type CartLine = {
  productId: number;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stockOnHand: number;
};

const cartKey = 'mart-cart';

export function getCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(cartKey) ?? '[]') as CartLine[];
  } catch {
    return [];
  }
}

export function saveCart(items: CartLine[]) {
  localStorage.setItem(cartKey, JSON.stringify(items));
}

export function addToCart(product: Product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.sellingPrice,
      quantity,
      stockOnHand: product.stockOnHand
    });
  }

  saveCart(cart);
}

export function updateCartQuantity(productId: number, quantity: number) {
  const cart = getCart().map((item) => (item.productId === productId ? { ...item, quantity } : item)).filter((item) => item.quantity > 0);
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: number) {
  const cart = getCart().filter((item) => item.productId !== productId);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}