import { Route } from "@angular/router";
import { Home } from "./features/home/home";
import { ProductList } from "./features/product-list/product-list";
import { ProductDetail } from "./features/product-detail/product-detail";
import { Cart } from "./features/cart/cart";
import { NotFound } from "./features/not-found/not-found";

export const routes: Route[] = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: Home},
  {path: 'product-list', component: ProductList},
  {path: 'product-detail/:id', component: ProductDetail},
  {path: 'cart', component: Cart},
  {path: '**', component: NotFound},
]
