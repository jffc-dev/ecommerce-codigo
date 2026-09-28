import { Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline-on-image';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly fullWidth = input(false);

  readonly pressed = output<void>();

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-sm rounded-full font-medium text-button transition-all duration-200 ease-out motion-safe:active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none';
    const sizing = this.variant() === 'outline-on-image' ? 'px-xl py-md' : 'px-xxl py-lg h-12';
    const palette =
      this.variant() === 'primary'
        ? 'bg-ink text-on-primary hover:bg-charcoal hover:shadow-lg hover:shadow-ink/20'
        : this.variant() === 'secondary'
          ? 'bg-soft-cloud text-ink hover:bg-hairline-soft'
          : 'bg-canvas text-ink hover:bg-soft-cloud';
    const width = this.fullWidth() ? 'w-full' : '';
    return `${base} ${sizing} ${palette} ${width}`;
  });

  onClick(): void {
    if (this.disabled()) {
      return;
    }
    this.pressed.emit();
  }
}
