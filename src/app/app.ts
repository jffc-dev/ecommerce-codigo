import { Component, inject } from '@angular/core';

import { NavigationService } from './core/services/navigation';
import { Cart } from './features/cart/cart';
import { Home } from './features/home/home';
import { ProductDetail } from './features/product-detail/product-detail';
import { ProductList } from './features/product-list/product-list';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';

@Component({
  selector: 'app-root',
  imports: [Header, Footer, Home, ProductList, ProductDetail, Cart],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly nav = inject(NavigationService);
}
