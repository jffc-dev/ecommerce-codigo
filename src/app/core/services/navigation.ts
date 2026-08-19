import { Injectable, signal } from '@angular/core';

export type View = 'home' | 'product-list' | 'product-detail' | 'cart';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  readonly view = signal<View>('home');
  readonly selectedProductId = signal<number | null>(null);
  readonly categoryFilter = signal<string | null>(null);
  readonly searchQuery = signal<string | null>(null);

  private previousView: View = 'home';

  goHome(): void {
    this.categoryFilter.set(null);
    this.searchQuery.set(null);
    this.setView('home');
  }

  goToProducts(category: string | null = null): void {
    this.categoryFilter.set(category);
    this.searchQuery.set(null);
    this.setView('product-list');
  }

  search(term: string): void {
    this.searchQuery.set(term);
    this.categoryFilter.set(null);
    this.setView('product-list');
  }

  goToProduct(id: number): void {
    this.selectedProductId.set(id);
    this.setView('product-detail');
  }

  goToCart(): void {
    this.setView('cart');
  }

  goBack(): void {
    this.setView(this.previousView);
  }

  private setView(view: View): void {
    this.previousView = this.view();
    this.view.set(view);
  }
}
