import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart';
import { NavigationService } from '../../core/services/navigation';
import { ProductService } from '../../core/services/product';
import { discountPercent, discountedPrice, isOnSale, swatchesFor } from '../../core/utils/pricing';
import { Button } from '../../shared/ui/button/button';
import { ColorSwatchPicker } from '../../shared/ui/color-swatch-picker/color-swatch-picker';
import { FilterChip } from '../../shared/ui/filter-chip/filter-chip';
import { IconButton } from '../../shared/ui/icon-button/icon-button';
import { QuantityStepper } from '../../shared/ui/quantity-stepper/quantity-stepper';

const SIZES = ['S', 'M', 'L', 'XL'];

interface DisclosureRow {
  key: string;
  label: string;
}

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, Button, ColorSwatchPicker, FilterChip, IconButton, QuantityStepper],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly titleService = inject(Title);
  protected readonly nav = inject(NavigationService);

  protected readonly product = signal<Product | null>(null);

  protected readonly onSale = computed(() => {
    const product = this.product();
    return product ? isOnSale(product) : false;
  });

  protected readonly price = computed(() => {
    const product = this.product();
    return product ? discountedPrice(product) : 0;
  });

  protected readonly discountPercent = discountPercent();

  protected readonly swatches = computed(() => {
    const product = this.product();
    return product ? swatchesFor(product) : [];
  });

  protected readonly sizes = SIZES;
  protected readonly selectedColor = signal<string | null>(null);
  protected readonly selectedSize = signal<string | null>(null);
  protected readonly quantity = signal(1);
  protected readonly addedToBag = signal(false);

  protected readonly disclosureRows: DisclosureRow[] = [
    { key: 'details', label: 'Detalles del Producto' },
    { key: 'shipping', label: 'Envíos y Devoluciones' },
    { key: 'reviews', label: 'Reseñas' },
  ];
  protected readonly expandedRow = signal<string | null>('details');

  constructor() {
    effect(() => {
      const id = this.nav.selectedProductId();
      if (id == null) {
        this.product.set(null);
        return;
      }
      this.productService.getProduct(id).subscribe({
        next: (product) => this.product.set(product),
        error: () => this.product.set(null),
      });
    });

    effect(() => {
      const product = this.product();
      this.titleService.setTitle(product ? `${product.title} | STRIDE` : 'STRIDE');
    });
  }

  goBack(): void {
    this.nav.goBack();
  }

  selectSize(size: string): void {
    this.selectedSize.update((current) => (current === size ? null : size));
  }

  toggleRow(key: string): void {
    this.expandedRow.update((current) => (current === key ? null : key));
  }

  addToBag(): void {
    const product = this.product();
    if (!product) {
      return;
    }
    this.cart.addItem(product, this.quantity());
    this.addedToBag.set(true);
    setTimeout(() => this.addedToBag.set(false), 2000);
  }
}
