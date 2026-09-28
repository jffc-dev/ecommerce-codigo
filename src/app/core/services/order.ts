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
}
