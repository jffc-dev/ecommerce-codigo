import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { Product } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart';
import { ProductService } from '../../core/services/product';
import {
  categoryLabel,
  colorSwatchHex,
  findVariant,
  hasPriceRange,
  optionNames,
  optionValues,
  variantImages,
  variantPrice,
} from '../../core/utils/product-helpers';
import { Button } from '../../shared/ui/button/button';
import { ColorSwatchPicker } from '../../shared/ui/color-swatch-picker/color-swatch-picker';
import { FilterChip } from '../../shared/ui/filter-chip/filter-chip';
import { IconButton } from '../../shared/ui/icon-button/icon-button';
import { QuantityStepper } from '../../shared/ui/quantity-stepper/quantity-stepper';

interface DisclosureRow {
  key: string;
  label: string;
}

const COLOR_OPTION_NAME = 'Color';

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
  id = input.required<string>()

  protected readonly categoryOptionName = COLOR_OPTION_NAME;
  protected readonly product = signal<Product | null>(null);
  protected readonly category = computed(() => {
    const product = this.product();
    return product ? categoryLabel(product) : '';
  });

  protected readonly optionTypes = computed(() => {
    const product = this.product();
    return product ? optionNames(product) : [];
  });

  protected readonly selections = signal<Record<string, string>>({});

  protected readonly selectedVariant = computed(() => {
    const product = this.product();
    return product ? findVariant(product, this.selections()) : undefined;
  });

  protected readonly allOptionsSelected = computed(
    () => this.optionTypes().length > 0 && this.optionTypes().every((name) => !!this.selections()[name]),
  );

  protected readonly price = computed(() => {
    const product = this.product();
    return product ? variantPrice(product, this.selectedVariant() ?? null) : 0;
  });

  protected readonly showsFromPrice = computed(() => {
    const product = this.product();
    return product ? hasPriceRange(product) && !this.selectedVariant() : false;
  });

  protected readonly imageList = computed(() => {
    const product = this.product();
    return product ? variantImages(product, this.selectedVariant() ?? null) : [];
  });

  protected readonly activeImageIndex = signal(0);
  protected readonly activeImage = computed(() => this.imageList()[this.activeImageIndex()]?.url ?? null);

  protected readonly colorOptions = computed(() => {
    const product = this.product();
    if (!product) {
      return [];
    }
    return optionValues(product, COLOR_OPTION_NAME).map((value) => ({ value, hex: colorSwatchHex(value) }));
  });

  protected readonly quantity = signal(1);
  protected readonly addedToBag = signal(false);

  protected readonly canAddToBag = computed(
    () => this.allOptionsSelected() && !!this.selectedVariant() && this.selectedVariant()!.stock > 0,
  );

  protected readonly addButtonLabel = computed(() => {
    if (this.addedToBag()) {
      return 'Agregado ✓';
    }
    if (!this.allOptionsSelected()) {
      return 'Elige las opciones';
    }
    if (!this.canAddToBag()) {
      return 'Sin stock';
    }
    return 'Agregar a la Bolsa';
  });

  protected readonly disclosureRows: DisclosureRow[] = [
    { key: 'details', label: 'Detalles del Producto' },
    { key: 'shipping', label: 'Envíos y Devoluciones' },
    { key: 'availability', label: 'Disponibilidad' },
  ];
  protected readonly expandedRow = signal<string | null>('details');

  constructor() {
    effect(() => {
      this.selections.set({});
      this.productService.getProduct(this.id()).subscribe({
        next: (product) => this.product.set(product),
        error: () => this.product.set(null),
      });
    });

    effect(() => {
      this.imageList();
      this.activeImageIndex.set(0);
    });

    effect(() => {
      const product = this.product();
      this.titleService.setTitle(product ? `${product.name} | STRIDE` : 'STRIDE');
    });
  }

  goBack(): void {
    //todo
    // this.nav.goBack();
  }

  optionValuesFor(optionName: string): string[] {
    const product = this.product();
    return product ? optionValues(product, optionName) : [];
  }

  toggleOption(optionName: string, value: string): void {
    this.selections.update((current) => {
      const next = { ...current };
      if (next[optionName] === value) {
        delete next[optionName];
      } else {
        next[optionName] = value;
      }
      return next;
    });
  }

  setColor(value: string | null): void {
    this.selections.update((current) => {
      const next = { ...current };
      if (value === null) {
        delete next[COLOR_OPTION_NAME];
      } else {
        next[COLOR_OPTION_NAME] = value;
      }
      return next;
    });
  }

  toggleRow(key: string): void {
    this.expandedRow.update((current) => (current === key ? null : key));
  }

  addToBag(): void {
    const product = this.product();
    const variant = this.selectedVariant();
    if (!product || !variant || variant.stock < 1) {
      return;
    }
    this.cart.addItem(product, variant, this.quantity());
    this.addedToBag.set(true);
    setTimeout(() => this.addedToBag.set(false), 2000);
  }
}
