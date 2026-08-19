import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  imports: [NgClass],
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.css',
})
export class IconButton {
  readonly ariaLabel = input.required<string>();
  readonly transparent = input(false);

  readonly pressed = output<void>();
}
