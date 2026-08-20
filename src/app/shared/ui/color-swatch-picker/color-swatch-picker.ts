import { Component, input, model } from '@angular/core';

import { SwatchDot } from '../swatch-dot/swatch-dot';

export interface ColorOption {
  value: string;
  hex: string;
}

@Component({
  selector: 'app-color-swatch-picker',
  imports: [SwatchDot],
  templateUrl: './color-swatch-picker.html',
  styleUrl: './color-swatch-picker.css',
})
export class ColorSwatchPicker {
  readonly colors = input.required<ColorOption[]>();
  readonly selected = model<string | null>(null);

  select(value: string): void {
    this.selected.set(this.selected() === value ? null : value);
  }
}
