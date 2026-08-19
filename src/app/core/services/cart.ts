import { Injectable, computed, effect, signal } from '@angular/core';

import { CartItem, Product } from '../models/product.model';
import { discountedPrice } from '../utils/pricing';

const STORAGE_KEY = 'stride-cart';

function readInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartItem[]>(readInitialCart());

  readonly cartItems = this.items.asReadonly();

  readonly itemCount = computed(() => this.items().reduce((total, item) => total + item.quantity, 0));

  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + discountedPrice(item.product) * item.quantity, 0),
  );

  readonly shipping = computed(() => (this.subtotal() === 0 || this.subtotal() > 50 ? 0 : 6.99));

  readonly total = computed(() => this.subtotal() + this.shipping());

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    });
  }

  addItem(product: Product, quantity = 1): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [...items, { product, quantity }];
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(productId);
      return;
    }
    this.items.update((items) =>
      items.map((item) => (item.product.id === productId ? { ...item, quantity } : item)),
    );
  }

  removeItem(productId: number): void {
    this.items.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clear(): void {
    this.items.set([]);
  }
}
