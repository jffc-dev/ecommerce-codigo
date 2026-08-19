import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { CartService } from '../../core/services/cart';
import { NavigationService } from '../../core/services/navigation';
import { discountedPrice } from '../../core/utils/pricing';
import { IconButton } from '../../shared/ui/icon-button/icon-button';
import { QuantityStepper } from '../../shared/ui/quantity-stepper/quantity-stepper';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, IconButton, QuantityStepper],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  protected readonly cart = inject(CartService);
  protected readonly nav = inject(NavigationService);
  protected readonly discountedPrice = discountedPrice;

  onQuantityChange(productId: number, quantity: number): void {
    this.cart.updateQuantity(productId, quantity);
  }
}
