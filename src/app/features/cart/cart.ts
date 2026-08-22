import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { CartItem } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart';
import { variantImages, variantPrice } from '../../core/utils/product-helpers';
import { IconButton } from '../../shared/ui/icon-button/icon-button';
import { QuantityStepper } from '../../shared/ui/quantity-stepper/quantity-stepper';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, IconButton, QuantityStepper],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  protected readonly cart = inject(CartService);
  protected readonly variantPrice = variantPrice;
  private router = inject(Router)

  onQuantityChange(variantId: string, quantity: number): void {
    this.cart.updateQuantity(variantId, quantity);
  }

  lineImage(item: CartItem): string | null {
    return variantImages(item.product, item.variant)[0]?.url ?? null;
  }

  lineOptions(item: CartItem): string {
    return item.variant.product_variant_option_value.map((pivot) => pivot.variant_option_value.value).join(' · ');
  }

  goToProducts(){
    this.router.navigate(['product-list'])
  }
}
