import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-quantity-stepper',
  imports: [],
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.css',
})
export class QuantityStepper {
  readonly min = input(1);
  readonly max = input(99);
  readonly value = model(1);

  decrement(): void {
    this.value.update((v) => Math.max(this.min(), v - 1));
  }

  increment(): void {
    this.value.update((v) => Math.min(this.max(), v + 1));
  }
}
