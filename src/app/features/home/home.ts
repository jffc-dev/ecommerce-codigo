import { SlicePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { NavigationService } from '../../core/services/navigation';
import { ProductService } from '../../core/services/product';
import { ProductCard } from '../../shared/ui/product-card/product-card';

interface SportTile {
  name: string;
  image: string;
}

interface CategoryIcon {
  label: string;
  emoji: string;
}

const SPORT_TILES: SportTile[] = [
  { name: 'Running', image: 'https://images.unsplash.com/photo-1502224562085-639556652f33?w=800&q=80' },
  { name: 'Baloncesto', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&q=80' },
  { name: 'Entrenamiento', image: 'https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=800&q=80' },
  { name: 'Fútbol', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80' },
];

const CATEGORY_ICONS: CategoryIcon[] = [
  { label: 'Camisetas', emoji: '👕' },
  { label: 'Calzado', emoji: '👟' },
  { label: 'Shorts', emoji: '🩳' },
  { label: 'Gorras', emoji: '🧢' },
  { label: 'Mochilas', emoji: '🎒' },
  { label: 'Medias', emoji: '🧦' },
];

@Component({
  selector: 'app-home',
  imports: [SlicePipe, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly productService = inject(ProductService);
  protected readonly nav = inject(NavigationService);

  protected readonly sportTiles = SPORT_TILES;
  protected readonly categoryIcons = CATEGORY_ICONS;

  protected readonly trending = toSignal(
    this.productService.getProducts().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
}
