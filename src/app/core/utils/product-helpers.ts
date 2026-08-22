import { Product, ProductImage, ProductVariant } from '../models/product.model';

const COLOR_HEX_MAP: Record<string, string> = {
  negro: '#111111',
  black: '#111111',
  blanco: '#ffffff',
  white: '#ffffff',
  rojo: '#d30005',
  red: '#d30005',
  azul: '#1151ff',
  blue: '#1151ff',
  verde: '#007d48',
  green: '#007d48',
  gris: '#9e9ea0',
  gray: '#9e9ea0',
  grey: '#9e9ea0',
  amarillo: '#f5c400',
  yellow: '#f5c400',
  rosa: '#ed1aa0',
  pink: '#ed1aa0',
  morado: '#beaffd',
  purple: '#beaffd',
  naranja: '#ff7a1a',
  orange: '#ff7a1a',
  celeste: '#0a7281',
  turquesa: '#0a7281',
};

export function colorSwatchHex(colorName: string): string {
  return COLOR_HEX_MAP[colorName.trim().toLowerCase()] ?? '#9e9ea0';
}

function sortByPosition(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => a.position - b.position);
}

export function defaultImageUrl(product: Product): string | null {
  const images = product.product_image?.length
    ? product.product_image
    : (product.product_variant ?? []).flatMap((variant) => variant.product_image ?? []);
  const primary = images.find((image) => image.is_default) ?? sortByPosition(images)[0];
  return primary?.url ?? null;
}

export function categoryLabel(product: Product): string {
  const names = product.product_category?.map((link) => link.category.name) ?? [];
  return names.length ? names.join(', ') : 'Sin categoría';
}

export function startingPrice(product: Product): number {
  const variants = product.product_variant ?? [];
  if (variants.length === 0) {
    return product.base_price;
  }
  return Math.min(...variants.map((variant) => variant.price ?? product.base_price));
}

export function hasPriceRange(product: Product): boolean {
  const prices = new Set((product.product_variant ?? []).map((variant) => variant.price ?? product.base_price));
  return prices.size > 1;
}

export function optionNames(product: Product): string[] {
  const names = new Set<string>();
  for (const variant of product.product_variant ?? []) {
    for (const pivot of variant.product_variant_option_value) {
      names.add(pivot.variant_option_value.variant_option.name);
    }
  }
  return [...names];
}

export function optionValues(product: Product, optionName: string): string[] {
  const values = new Set<string>();
  for (const variant of product.product_variant ?? []) {
    for (const pivot of variant.product_variant_option_value) {
      if (pivot.variant_option_value.variant_option.name === optionName) {
        values.add(pivot.variant_option_value.value);
      }
    }
  }
  return [...values];
}

export function findVariant(product: Product, selections: Record<string, string>): ProductVariant | undefined {
  const entries = Object.entries(selections);
  if (entries.length === 0) {
    return undefined;
  }
  return product.product_variant?.find((variant) => {
    const variantValues = variant.product_variant_option_value.map(
      (pivot) => [pivot.variant_option_value.variant_option.name, pivot.variant_option_value.value] as const,
    );
    return entries.every(([optionName, value]) =>
      variantValues.some(([name, val]) => name === optionName && val === value),
    );
  });
}

export function variantPrice(product: Product, variant: ProductVariant | null): number {
  if (variant) {
    return variant.price ?? product.base_price;
  }
  return startingPrice(product);
}

export function variantImages(product: Product, variant: ProductVariant | null): ProductImage[] {
  if (variant && variant.product_image.length > 0) {
    return sortByPosition(variant.product_image);
  }
  if (product.product_image?.length) {
    return sortByPosition(product.product_image);
  }
  const fallback = (product.product_variant ?? []).flatMap((v) => v.product_image ?? []);
  return sortByPosition(fallback);
}
