import { NgClass, NgStyle } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-swatch-dot',
  imports: [NgClass, NgStyle],
  templateUrl: './swatch-dot.html',
  styleUrl: './swatch-dot.css',
})
export class SwatchDot {
  readonly color = input.required<string>();
  readonly active = input(false);
}
