import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { CartService } from '../../core/services/cart';
import { NavigationService } from '../../core/services/navigation';
import { IconButton } from '../../shared/ui/icon-button/icon-button';

const NAV_LINKS = ['Novedades', 'Hombre', 'Mujer', 'Niños', 'Ofertas'];

@Component({
  selector: 'app-header',
  imports: [IconButton],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cart = inject(CartService);
  protected readonly nav = inject(NavigationService);

  protected readonly navLinks = NAV_LINKS;
  protected readonly cartCount = this.cart.itemCount;

  protected readonly isSearchOpen = signal(false);
  protected readonly isMenuOpen = signal(false);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly searchTerm$ = new Subject<string>();

  constructor() {
    this.searchTerm$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        if (term.trim()) {
          this.nav.search(term.trim());
          this.isSearchOpen.set(false);
        }
      });

    effect(() => {
      if (this.isSearchOpen()) {
        this.searchInput()?.nativeElement.focus();
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm$.next(value);
  }

  toggleSearch(): void {
    this.isSearchOpen.update((open) => !open);
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  selectCategory(category: string): void {
    this.nav.goToProducts(category);
    this.closeMenu();
  }
}
