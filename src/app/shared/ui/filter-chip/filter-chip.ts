import { NgClass } from '@angular/common';
import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-filter-chip',
  imports: [NgClass],
  templateUrl: './filter-chip.html',
  styleUrl: './filter-chip.css',
})
export class FilterChip {
  readonly label = input.required<string>();
  readonly active = model(false);

  toggle(): void {
    this.active.update((value) => !value);
  }
}
