import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

export type AuthMode = 'login' | 'register';

function passwordsMatchValidator(): ValidatorFn {
  return (group): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  };
}

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService)

  readonly mode = input<AuthMode>('login', { alias: 'mode' });

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly registered = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly isLogin = computed(() => this.mode() !== 'register');

  protected readonly loginForm = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
  });

  protected readonly registerForm = this.fb.group(
    {
      name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
      email: this.fb.control('', [Validators.required, Validators.email]),
      password: this.fb.control('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: this.fb.control('', [Validators.required]),
      acceptsTerms: this.fb.control(false, [Validators.requiredTrue]),
    },
    { validators: passwordsMatchValidator() },
  );

  switchTab(mode: AuthMode): void {
    this.submitError.set(null);
    this.registered.set(false);
    this.router.navigate(['login'], { queryParams: { mode } });
  }

  toggleShowPassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    // TODO: reemplazar por llamada real a Supabase Auth (signInWithPassword)
    setTimeout(() => {
      this.submitting.set(false);
      this.auth.login(this.loginForm.get('email')!.value, this.loginForm.get('password')!.value)
      this.router.navigate(['']);
    }, 600);
  }

  submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    // TODO: reemplazar por llamada real a Supabase Auth (signUp)
    setTimeout(() => {
      this.submitting.set(false);
      this.registered.set(true);
      this.registerForm.reset({ acceptsTerms: false });
    }, 600);
  }

  goToHome(): void {
    this.router.navigate(['']);
  }
}
