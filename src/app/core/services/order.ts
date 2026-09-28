import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { SUPABASE_REST_URL } from '../config/supabase.config';
import { CartItem } from '../models/product.model';

export interface CheckoutCustomer {
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
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
        // Los RAISE EXCEPTION de la función llegan en error.error.message
        const message = error.error?.message ?? 'No pudimos procesar tu pedido. Intenta nuevamente.';
        return throwError(() => new Error(message));
      }),
    );
  }
}
