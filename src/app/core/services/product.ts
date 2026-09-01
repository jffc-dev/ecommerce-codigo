import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { SUPABASE_ANON_KEY, SUPABASE_REST_URL } from '../config/supabase.config';
import { Category, Product } from '../models/product.model';

const PRODUCT_SELECT = [
  'id',
  'name',
  'description',
  'base_price',
  'created_at',
  'product_category(category(id,name))',
  'product_image(id,url,alt_text,position,is_default)',
  'product_variant(id,sku,price,stock,' +
    'product_variant_option_value(variant_option_value(id,value,variant_option(id,name))),' +
    'product_image(id,url,alt_text,position,is_default))',
].join(',');

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>(`${SUPABASE_REST_URL}/product`, {
        params: { select: PRODUCT_SELECT, order: 'name.asc' },
      })
      .pipe(catchError(() => throwError(() => new Error('No pudimos cargar los productos. Intenta nuevamente.'))));
  }

  getProduct(id: string): Observable<Product> {
    return this.http
      .get<Product[]>(`${SUPABASE_REST_URL}/product`, {
        params: { select: PRODUCT_SELECT, id: `eq.${id}` },
      })
      .pipe(
        map((products) => {
          if (products.length === 0) {
            throw new Error('Producto no encontrado.');
          }
          return products[0];
        }),
        catchError(() => throwError(() => new Error('No pudimos cargar este producto.'))),
      );
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`${SUPABASE_REST_URL}/category`, {
        params: { select: 'id,name', order: 'name.asc' },
      })
      .pipe(catchError(() => throwError(() => new Error('No pudimos cargar las categorías.'))));
  }
}
