import { Product } from '../models/product.model';

const SWATCH_PALETTE = ['#111111', '#0a7281', '#ed1aa0', '#beaffd', '#4b4b4d', '#d6d1ff'];

export function isOnSale(product: Pick<Product, 'id'>): boolean {
  return product.id % 3 === 0;
}

export function discountedPrice(product: Pick<Product, 'id' | 'price'>): number {
  return isOnSale(product) ? product.price * 0.8 : product.price;
}

export function discountPercent(): number {
  return 20;
}

export function swatchesFor(product: Pick<Product, 'id'>): string[] {
  const start = product.id % SWATCH_PALETTE.length;
  const count = 2 + (product.id % 3);
  return Array.from({ length: count }, (_, i) => SWATCH_PALETTE[(start + i) % SWATCH_PALETTE.length]);
}
