import { Route } from "@angular/router";
import { authGuard } from "./core/guards/auth-guard";
import { Auth } from "./features/auth/auth";
import { Cart } from "./features/cart/cart";
import { AccessDenied } from "./features/access-denied/access-denied";

export const routes: Route[] = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', loadComponent: () => import('./features/home/home').then(n => n.Home)},


  {path: 'product-list', canMatch: [authGuard] ,loadComponent: () => import('./features/product-list/product-list').then(n => n.ProductList)},

  {path: 'cart', canActivate: [authGuard] ,component: Cart},


  {path: 'product-detail/:id', loadComponent: () => import('./features/product-detail/product-detail').then(n => n.ProductDetail)},
  {path: 'login', component: Auth},
  {path: 'access-denied', component: AccessDenied},
  {path: '**', loadComponent: () => import('./features/not-found/not-found').then(n => n.NotFound)},

  //canMatch -> lazy loading (canLoad) / ejecutamos el guard antes de hacer match
  //cantActivate -> eager loading / todas las demas rutas / ejecutamos el guard despues de hacer match y solo si se puede activar o no
]
