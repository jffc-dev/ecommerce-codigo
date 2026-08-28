import { Route } from "@angular/router";

export const routes: Route[] = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', loadComponent: () => import('./features/home/home').then(n => n.Home)},
  {path: 'product-list', loadComponent: () => import('./features/product-list/product-list').then(n => n.ProductList)},
  {path: 'product-detail/:id', loadComponent: () => import('./features/product-detail/product-detail').then(n => n.ProductDetail)},
  {path: 'cart', loadComponent: () => import('./features/cart/cart').then(n => n.Cart)},
  {path: 'login', loadComponent: () => import('./features/auth/auth').then(n => n.Auth)},
  {path: '**', loadComponent: () => import('./features/not-found/not-found').then(n => n.NotFound)},
]
