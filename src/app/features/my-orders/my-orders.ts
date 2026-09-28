import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth';
import { Order, OrderService, OrderStatus } from '../../core/services/order';

const STATUS_LABELS: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: 'Pendiente de pago', classes: 'bg-soft-cloud text-ink' },
  paid: { label: 'Pagado', classes: 'bg-success text-on-primary' },
  failed: { label: 'Pago rechazado', classes: 'bg-sale text-on-primary' },
  cancelled: { label: 'Cancelado', classes: 'bg-hairline-soft text-mute' },
  refunded: { label: 'Reembolsado', classes: 'bg-accent-purple-pale text-ink' },
};

@Component({
  selector: 'app-my-orders',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly orderService = inject(OrderService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly expandedId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    const email = this.auth.currentUser()?.email;
    if (!email) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.orderService.getMyOrders(email).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.expandedId.set(orders[0]?.id ?? null);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  status(order: Order) {
    return STATUS_LABELS[order.status];
  }

  shortId(order: Order): string {
    return order.id.slice(0, 8).toUpperCase();
  }

  itemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  toggle(order: Order): void {
    this.expandedId.update((id) => (id === order.id ? null : order.id));
  }

  goToProducts(): void {
    this.router.navigate(['product-list']);
  }
}
