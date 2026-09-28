import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { SUPABASE_REST_URL } from '../config/supabase.config';
import { CartItem } from '../models/product.model';

const RAISE_EXCEPTION_CODE = 'P0001';
const GENERIC_ERROR_MESSAGE = 'No pudimos procesar tu pedido. Intenta nuevamente en unos minutos.';

export interface CheckoutCustomer {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  product_name: string;
  sku: string;
  options: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shipping_address: string;
  shipping_city: string;
  paid_at: string | null;
  created_at: string;
  items: OrderItem[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  /** Crea el pedido vía la función create_order de Supabase. Devuelve el id del pedido. */
  createOrder(customer: CheckoutCustomer, items: CartItem[]): Observable<string> {
    const body = {
      p_customer: customer,
      p_items: items.map((item) => ({ variant_id: item.variant.id, quantity: item.quantity })),
    };

    return this.http.post<string>(`${SUPABASE_REST_URL}/rpc/create_order`, body).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo los RAISE EXCEPTION de create_order (código P0001) son mensajes pensados para el cliente.
        // Cualquier otro error (red, esquema, permisos...) es técnico: se loguea y se muestra un mensaje genérico.
        if (error.error?.code === RAISE_EXCEPTION_CODE && error.error?.message) {
          return throwError(() => new Error(error.error.message));
        }
        console.error('Error al crear el pedido', error);
        return throwError(() => new Error(GENERIC_ERROR_MESSAGE));
      }),
    );
  }

  /** Pedidos del cliente (más recientes primero) vía la función get_my_orders de Supabase. */
  getMyOrders(email: string): Observable<Order[]> {
    return this.http.post<Order[]>(`${SUPABASE_REST_URL}/rpc/get_my_orders`, { p_email: email }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error al cargar los pedidos', error);
        return throwError(() => new Error('No pudimos cargar tus compras. Intenta nuevamente.'));
      }),
    );
  }
}
