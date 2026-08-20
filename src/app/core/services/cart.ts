import { Injectable, computed, effect, signal } from '@angular/core';

import { CartItem, Product, ProductVariant } from '../models/product.model';
import { variantPrice } from '../utils/product-helpers';

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
    this.items().reduce((total, item) => total + variantPrice(item.product, item.variant) * item.quantity, 0),
  );

  readonly shipping = computed(() => (this.subtotal() === 0 || this.subtotal() > 50 ? 0 : 6.99));

  readonly total = computed(() => this.subtotal() + this.shipping());

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    });
  }

  addItem(product: Product, variant: ProductVariant, quantity = 1): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.variant.id === variant.id);
      if (existing) {
        return items.map((item) =>
          item.variant.id === variant.id ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }
      return [...items, { product, variant, quantity }];
    });
  }

  updateQuantity(variantId: string, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(variantId);
      return;
    }
    this.items.update((items) =>
      items.map((item) => (item.variant.id === variantId ? { ...item, quantity } : item)),
    );
  }

  removeItem(variantId: string): void {
    this.items.update((items) => items.filter((item) => item.variant.id !== variantId));
  }

  clear(): void {
    this.items.set([]);
  }
}
