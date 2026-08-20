export interface Category {
  id: string;
  name: string;
}

export interface VariantOption {
  id: string;
  name: string;
}

export interface VariantOptionValue {
  id: string;
  value: string;
  variant_option: VariantOption;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_default: boolean;
}

export interface ProductVariantOptionValue {
  variant_option_value: VariantOptionValue;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number | null;
  stock: number;
  product_variant_option_value: ProductVariantOptionValue[];
  product_image: ProductImage[];
}

export interface ProductCategoryLink {
  category: Category;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  created_at: string;
  product_category: ProductCategoryLink[];
  product_image: ProductImage[];
  product_variant: ProductVariant[];
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}
