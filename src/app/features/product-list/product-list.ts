import { Component, computed, inject, signal } from '@angular/core';

import { Product } from '../../core/models/product.model';
import { NavigationService } from '../../core/services/navigation';
import { ProductService } from '../../core/services/product';
import { FilterChip } from '../../shared/ui/filter-chip/filter-chip';
import { IconButton } from '../../shared/ui/icon-button/icon-button';
import { ProductCard } from '../../shared/ui/product-card/product-card';

type SortOption = 'relevance' | 'price-asc' | 'price-desc';

@Component({
  selector: 'app-product-list',
  imports: [FilterChip, IconButton, ProductCard],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private readonly productService = inject(ProductService);
  protected readonly nav = inject(NavigationService);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<string[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly sortBy = signal<SortOption>('relevance');
  protected readonly showFilters = signal(true);

  protected readonly filteredProducts = computed(() => {
    let list = this.products();
    const category = this.nav.categoryFilter();
    const term = this.nav.searchQuery()?.toLowerCase() ?? '';

    if (category) {
      list = list.filter((product) => product.category === category);
    }
    if (term) {
      list = list.filter((product) => product.title.toLowerCase().includes(term));
    }

    const sort = this.sortBy();
    if (sort === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  });

  constructor() {
    this.productService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });

    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      },
    });
  }

  toggleCategory(category: string): void {
    this.nav.categoryFilter.update((current) => (current === category ? null : category));
  }

  onSortChange(value: string): void {
    this.sortBy.set(value as SortOption);
  }

  toggleFilters(): void {
    this.showFilters.update((visible) => !visible);
  }

  retry(): void {
    this.loadProducts();
  }
}
