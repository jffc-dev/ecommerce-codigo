import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { Product } from '../models/product.model';

const API_URL = 'https://fakestoreapi.com/products';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>(API_URL)
      .pipe(catchError(() => throwError(() => new Error('No pudimos cargar los productos. Intenta nuevamente.'))));
  }

  getProduct(id: number): Observable<Product> {
    return this.http
      .get<Product>(`${API_URL}/${id}`)
      .pipe(catchError(() => throwError(() => new Error('No pudimos cargar este producto.'))));
  }

  getCategories(): Observable<string[]> {
    return this.http
      .get<string[]>(`${API_URL}/categories`)
      .pipe(catchError(() => throwError(() => new Error('No pudimos cargar las categorías.'))));
  }
}
