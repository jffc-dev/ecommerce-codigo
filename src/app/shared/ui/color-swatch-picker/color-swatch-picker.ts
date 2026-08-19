import { Component, input, model } from '@angular/core';

import { SwatchDot } from '../swatch-dot/swatch-dot';

@Component({
  selector: 'app-color-swatch-picker',
  imports: [SwatchDot],
  templateUrl: './color-swatch-picker.html',
  styleUrl: './color-swatch-picker.css',
})
export class ColorSwatchPicker {
  readonly colors = input.required<string[]>();
  readonly selected = model<string | null>(null);

  select(color: string): void {
    this.selected.set(color);
  }
}
