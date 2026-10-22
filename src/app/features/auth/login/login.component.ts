import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppInputComponent } from '../../../shared/components/input/input.component';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { AppAuthSliderComponent } from '../../../shared/components/auth-slider/auth-slider.component';
import { AppOtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppInputComponent,
    AppButtonComponent,
    AppAuthSliderComponent,
    AppOtpInputComponent,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1 1 100%;
        width: 100%;
        min-height: 100vh;
        min-height: 100dvh;
      }
    `,
  ],
  template: `
    <div class="flex flex-1 w-full min-h-screen min-h-[100dvh] bg-white dark:bg-slate-900">
      <!-- Left Side: Interactive Auth Slider with Brand Linear Gradient Theme Color -->
      <app-auth-slider class="hidden lg:flex lg:w-1/2 bg-[#2A65F6] min-h-screen min-h-[100dvh]"></app-auth-slider>

      <!-- Right Side: Clean Modern Form Container -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto min-h-screen min-h-[100dvh]">
        <div class="w-full max-w-md space-y-7 animate-fade-in my-auto">
          <!-- Mobile Brand Logo Header (Visible on < lg screens) -->
          <div class="lg:hidden flex items-center space-x-3 mb-6">
            <div
              class="w-10 h-10 rounded-xl bg-[#2A65F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20"
            >
              <svg
                class="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white block">WorkivLab</span>
              <span class="text-[10px] text-slate-400 tracking-wider font-semibold uppercase block">Enterprise Workspace</span>
            </div>
          </div>

          <!-- Alert Notices -->
          @if (resetSuccessNotice()) {
            <div
              class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2.5 animate-fade-in"
            >
              <span class="text-base font-bold">✓</span>
              <span>{{ resetSuccessNotice() }}</span>
            </div>
          }

          @if (errorMessage()) {
            <div
              class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center space-x-2.5 animate-fade-in"
            >
              <span class="text-base">⚠️</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- VIEW 1: SIGN IN FORM -->
          @if (viewMode() === 'login') {
            <div>
              <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Sign In
              </h1>
            </div>

            <!-- Form with AppInputComponent & AppButtonComponent -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmitLogin()" class="space-y-4">
              <div>
                <app-input
                  label="Corporate Email"
                  type="email"
                  placeholder="you@company.com"
                  [required]="true"
                  formControlName="email"
                  [error]="getLoginFieldError('email')"
                ></app-input>
              </div>

              <div>
                <app-input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  [required]="true"
                  formControlName="password"
                  [error]="getLoginFieldError('password')"
                ></app-input>
              </div>

              <div class="flex items-center justify-between text-xs pt-1">
                <label
                  class="flex items-center space-x-2 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  (click)="switchToForgotMode()"
                  class="text-xs font-semibold text-[#2A65F6] hover:underline transition-colors focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              <div class="pt-2">
                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="isSubmitting()"
                >
                  Sign In to Workspace
                </app-button>
              </div>
            </form>

            <!-- Footer Prompt -->
            <div class="text-center pt-5 border-t border-slate-200 dark:border-slate-800">
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Don't have a company account?
                <a
                  routerLink="/auth/register"
                  class="font-semibold text-[#2A65F6] hover:underline ml-1"
                >
                  Create workspace
                </a>
              </p>
            </div>

          } @else {
            <!-- VIEW 2: FORGOT PASSWORD IN-FORM (EMBEDDED DIRECTLY IN PAGE, NO MODAL) -->
            <div>
              <div
                class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs font-semibold text-[#2A65F6] mb-3"
              >
                <span>🔑</span>
                <span>Account Recovery</span>
              </div>
              <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                @if (forgotStep() === 1) { Reset Password }
                @else if (forgotStep() === 2) { Verify OTP Code }
                @else { Set New Password }
              </h1>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                @if (forgotStep() === 1) {
                  Enter your corporate email address to receive a 6-digit security OTP code.
                } @else if (forgotStep() === 2) {
                  We sent a 6-digit verification code to
                  <strong class="text-slate-800 dark:text-slate-200">{{ forgotEmail() }}</strong>.
                } @else {
                  Choose a strong new password for your account.
                }
              </p>
            </div>

            <!-- Step Progress Indicator -->
            <div class="flex items-center space-x-2 pt-1">
              <div
                class="flex-1 h-1.5 rounded-full transition-all duration-300"
                [ngClass]="forgotStep() >= 1 ? 'bg-[#2A65F6]' : 'bg-slate-200 dark:bg-slate-800'"
              ></div>
              <div
                class="flex-1 h-1.5 rounded-full transition-all duration-300"
                [ngClass]="forgotStep() >= 2 ? 'bg-[#2A65F6]' : 'bg-slate-200 dark:bg-slate-800'"
              ></div>
              <div
                class="flex-1 h-1.5 rounded-full transition-all duration-300"
                [ngClass]="forgotStep() >= 3 ? 'bg-[#2A65F6]' : 'bg-slate-200 dark:bg-slate-800'"
              ></div>
            </div>

            <!-- STEP 1: EMAIL DISPATCH -->
            @if (forgotStep() === 1) {
              <form (ngSubmit)="sendForgotOtp()" class="space-y-4">
                <div>
                  <app-input
                    label="Corporate Email"
                    type="email"
                    placeholder="you@company.com"
                    [required]="true"
                    [formControl]="forgotEmailControl"
                    [error]="getForgotEmailError()"
                  ></app-input>
                </div>

                <div class="pt-2 space-y-3">
                  <app-button
                    type="submit"
                    variant="primary"
                    size="lg"
                    [fullWidth]="true"
                    [loading]="forgotLoading()"
                  >
                    Send 6-Digit OTP Code
                  </app-button>

                  <button
                    type="button"
                    (click)="switchToLoginMode()"
                    class="w-full text-center py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>

            <!-- STEP 2: VERIFY OTP -->
            } @else if (forgotStep() === 2) {
              <form (ngSubmit)="verifyForgotOtp()" class="space-y-5">
                <div>
                  <app-otp-input
                    [length]="6"
                    label="Enter Security Verification Code"
                    [formControl]="forgotOtpControl"
                    [error]="getForgotOtpError() || ''"
                    (completed)="verifyForgotOtp()"
                  ></app-otp-input>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <span class="text-slate-500 dark:text-slate-400">Didn't receive code?</span>
                  <button
                    type="button"
                    (click)="sendForgotOtp()"
                    class="font-semibold text-[#2A65F6] hover:underline focus:outline-none"
                  >
                    Resend OTP code
                  </button>
                </div>

                <div class="pt-2 space-y-3">
                  <app-button
                    type="submit"
                    variant="primary"
                    size="lg"
                    [fullWidth]="true"
                    [loading]="forgotLoading()"
                  >
                    Verify Code
                  </app-button>

                  <button
                    type="button"
                    (click)="forgotStep.set(1)"
                    class="w-full text-center py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                  >
                    ← Change Email Address
                  </button>
                </div>
              </form>

            <!-- STEP 3: RESET NEW PASSWORD -->
            } @else {
              <form [formGroup]="forgotPasswordForm" (ngSubmit)="submitPasswordReset()" class="space-y-4">
                <div>
                  <app-input
                    label="New Password"
                    type="password"
                    placeholder="At least 8 characters"
                    [required]="true"
                    formControlName="newPassword"
                    [error]="getForgotResetFieldError('newPassword')"
                  ></app-input>
                </div>

                <div>
                  <app-input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Confirm new password"
                    [required]="true"
                    formControlName="confirmPassword"
                    [error]="getForgotResetFieldError('confirmPassword')"
                  ></app-input>
                </div>

                <div class="pt-2 space-y-3">
                  <app-button
                    type="submit"
                    variant="primary"
                    size="lg"
                    [fullWidth]="true"
                    [loading]="forgotLoading()"
                  >
                    Save New Password & Sign In
                  </app-button>

                  <button
                    type="button"
                    (click)="switchToLoginMode()"
                    class="w-full text-center py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus:outline-none"
                  >
                    Cancel and Return to Sign In
                  </button>
                </div>
              </form>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // View state: 'login' | 'forgot'
  readonly viewMode = signal<'login' | 'forgot'>('login');

  // Login form state
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly resetSuccessNotice = signal<string | null>(null);

  readonly loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  // Forgot password form state
  readonly forgotStep = signal<1 | 2 | 3>(1);
  readonly forgotLoading = signal<boolean>(false);
  readonly forgotEmail = signal<string>('');

  readonly forgotEmailControl = new FormControl('', [Validators.required, Validators.email]);
  readonly forgotOtpControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(6),
  ]);

  readonly forgotPasswordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  getLoginFieldError(field: string): string | null {
    const control = this.loginForm.get(field);
    if (!control || !control.touched || !control.errors) return null;
    if (control.errors['required']) return 'This field is required';
    if (control.errors['email']) return 'A valid email is required';
    return null;
  }

  getForgotEmailError(): string | null {
    if (!this.forgotEmailControl.touched || !this.forgotEmailControl.errors) return null;
    if (this.forgotEmailControl.errors['required']) return 'Corporate email is required';
    if (this.forgotEmailControl.errors['email']) return 'A valid email address is required';
    return null;
  }

  getForgotOtpError(): string | null {
    if (!this.forgotOtpControl.touched || !this.forgotOtpControl.errors) return null;
    if (this.forgotOtpControl.errors['required']) return '6-digit OTP code is required';
    if (this.forgotOtpControl.errors['minlength'] || this.forgotOtpControl.errors['maxlength'])
      return 'OTP must be exactly 6 digits';
    return null;
  }

  getForgotResetFieldError(field: string): string | null {
    const control = this.forgotPasswordForm.get(field);
    if (!control || !control.touched || !control.errors) return null;
    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return 'Password must be at least 8 characters';
    return null;
  }

  switchToForgotMode(): void {
    const currentEmail = this.loginForm.get('email')?.value || '';
    this.forgotEmailControl.setValue(currentEmail);
    this.forgotOtpControl.reset('');
    this.forgotPasswordForm.reset();
    this.forgotStep.set(1);
    this.errorMessage.set(null);
    this.resetSuccessNotice.set(null);
    this.viewMode.set('forgot');
  }

  switchToLoginMode(): void {
    this.errorMessage.set(null);
    this.viewMode.set('login');
  }

  onSubmitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err?.error?.message || 'Invalid email or password';
        this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  sendForgotOtp(): void {
    if (this.forgotEmailControl.invalid) {
      this.forgotEmailControl.markAsTouched();
      return;
    }

    const email = (this.forgotEmailControl.value || '').trim();
    this.forgotEmail.set(email);
    this.forgotLoading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.forgotLoading.set(false);
        this.forgotStep.set(2);
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to dispatch reset code');
      },
    });
  }

  verifyForgotOtp(): void {
    if (this.forgotOtpControl.invalid) {
      this.forgotOtpControl.markAsTouched();
      return;
    }

    const email = this.forgotEmail();
    const otp = (this.forgotOtpControl.value || '').trim();

    this.forgotLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyResetOtp(email, otp).subscribe({
      next: () => {
        this.forgotLoading.set(false);
        this.forgotStep.set(3);
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Invalid or expired OTP code');
      },
    });
  }

  submitPasswordReset(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = this.forgotEmail();
    const otp = (this.forgotOtpControl.value || '').trim();
    const { newPassword, confirmPassword } = this.forgotPasswordForm.value;

    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.forgotLoading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({ email, otp, newPassword }).subscribe({
      next: (res) => {
        this.forgotLoading.set(false);
        this.resetSuccessNotice.set(res.message || 'Password reset successfully! Please sign in with your new password.');
        this.loginForm.patchValue({ email, password: '' });
        this.viewMode.set('login');
      },
      error: (err) => {
        this.forgotLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to reset password');
      },
    });
  }
}
