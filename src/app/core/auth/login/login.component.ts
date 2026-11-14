import { Component, inject, signal, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { AppInputComponent } from "../../../shared/components/input/input.component";
import { AppButtonComponent } from "../../../shared/components/button/button.component";
import { AppAuthSliderComponent } from "../../../shared/components/auth-slider/auth-slider.component";
import { AppOtpInputComponent } from "../otp-input/otp-input.component";

@Component({
  selector: "app-login",
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.scss",
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
