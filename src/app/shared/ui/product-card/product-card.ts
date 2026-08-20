import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

import { Product } from '../../../core/models/product.model';
import { NavigationService } from '../../../core/services/navigation';
import {
  categoryLabel,
  colorSwatchHex,
  defaultImageUrl,
  hasPriceRange,
  optionValues,
  startingPrice,
} from '../../../core/utils/product-helpers';
import { Badge } from '../badge/badge';
import { SwatchDot } from '../swatch-dot/swatch-dot';

const NEW_THRESHOLD_DAYS = 14;

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, SwatchDot, Badge],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  private readonly nav = inject(NavigationService);

  readonly product = input.required<Product>();

  protected readonly image = computed(() => defaultImageUrl(this.product()));
  protected readonly category = computed(() => categoryLabel(this.product()));
  protected readonly price = computed(() => startingPrice(this.product()));
  protected readonly showsFromPrice = computed(() => hasPriceRange(this.product()));
  protected readonly colors = computed(() => optionValues(this.product(), 'Color').map(colorSwatchHex));

  protected readonly isNew = computed(() => {
    const days = (Date.now() - new Date(this.product().created_at).getTime()) / 86_400_000;
    return days <= NEW_THRESHOLD_DAYS;
  });

  open(): void {
    this.nav.goToProduct(this.product().id);
  }
}
