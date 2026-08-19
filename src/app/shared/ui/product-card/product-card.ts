import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

import { NavigationService } from '../../../core/services/navigation';
import { Product } from '../../../core/models/product.model';
import { discountPercent, discountedPrice, isOnSale, swatchesFor } from '../../../core/utils/pricing';
import { Badge } from '../badge/badge';
import { SwatchDot } from '../swatch-dot/swatch-dot';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, SwatchDot, Badge],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  private readonly nav = inject(NavigationService);

  readonly product = input.required<Product>();

  protected readonly onSale = computed(() => isOnSale(this.product()));
  protected readonly price = computed(() => discountedPrice(this.product()));
  protected readonly discountPercent = discountPercent();
  protected readonly swatches = computed(() => swatchesFor(this.product()));
  protected readonly isNew = computed(() => this.product().id % 4 === 0);

  open(): void {
    this.nav.goToProduct(this.product().id);
  }
}
