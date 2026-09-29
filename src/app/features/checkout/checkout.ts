import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CartItem } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth';
import { CartService } from '../../core/services/cart';
import { OrderService } from '../../core/services/order';
import { PaymentCancelledError, PaymentService } from '../../core/services/payment';
import { variantImages, variantPrice } from '../../core/utils/product-helpers';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);
  private readonly payment = inject(PaymentService);
  protected readonly cart = inject(CartService);
  protected readonly variantPrice = variantPrice;

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly orderId = signal<string | null>(null);
  private readonly pendingOrderId = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: this.fb.control(this.auth.currentUser()?.email ?? '', [Validators.required, Validators.email]),
    name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
    phone: this.fb.control('', [Validators.pattern(/^[0-9+\s-]{6,20}$/)]),
    address: this.fb.control('', [Validators.required, Validators.minLength(5)]),
    city: this.fb.control('', [Validators.required]),
    notes: this.fb.control(''),
  });

  constructor() {
    if (this.cart.cartItems().length === 0) {
      this.router.navigate(['cart']);
    }
  }

  lineImage(item: CartItem): string | null {
    return variantImages(item.product, item.variant)[0]?.url ?? null;
  }

  lineOptions(item: CartItem): string {
    return item.variant.product_variant_option_value.map((pivot) => pivot.variant_option_value.value).join(' · ');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      // Si un intento anterior falló (rechazo o modal cerrado), se reutiliza el mismo pedido
      // para no crear otro ni volver a descontar stock.
      const id =
        this.pendingOrderId() ?? (await firstValueFrom(this.orders.createOrder(this.form.getRawValue(), this.cart.cartItems())));
      this.pendingOrderId.set(id);

      await this.payment.pay({
        orderId: id,
        email: this.form.controls.email.value,
        amountCents: Math.round(this.cart.total() * 100),
      });

      this.pendingOrderId.set(null);
      this.orderId.set(id);
      this.cart.clear();
    } catch (error) {
      if (!(error instanceof PaymentCancelledError)) {
        this.submitError.set((error as Error).message);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  goToProducts(): void {
    this.router.navigate(['product-list']);
  }

  goToMyOrders(): void {
    this.router.navigate(['my-orders']);
  }

  backToCart(): void {
    this.router.navigate(['cart']);
  }
}
