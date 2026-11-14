import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../../environments/environment';
import { AppInputComponent } from '../../../shared/components/input/input.component';
import {
  AppSelectComponent,
  SelectOption,
} from '../../../shared/components/select/select.component';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { AppBadgeComponent } from '../../../shared/components/badge/badge.component';
import { AppAuthSliderComponent } from '../../../shared/components/auth-slider/auth-slider.component';
import { AppOtpInputComponent } from '../otp-input/otp-input.component';
import { AppDatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';
import { AppCheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { AppTextareaComponent } from '../../../shared/components/textarea/textarea.component';

interface InvitationDetails {
  valid: boolean;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  designation: string;
  departmentName: string;
  region: string;
  companyId?: string;
  customFieldsTemplate?: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'file';
    required: boolean;
    options?: string[];
    placeholder?: string;
    helperText?: string;
  }>;
  onboardingConfig?: {
    requireCnic?: boolean;
    requireAddress?: boolean;
    requireBankDetails?: boolean;
  };
}

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppInputComponent,
    AppSelectComponent,
    AppButtonComponent,
    AppBadgeComponent,
    AppAuthSliderComponent,
    AppOtpInputComponent,
    AppDatePickerComponent,
    AppCheckboxComponent,
    AppTextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly currentYear = new Date().getFullYear();
  readonly currentStep = signal<number>(1);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Employee invitation state
  readonly isEmployeeInvitation = signal<boolean>(false);
  readonly invitationLoading = signal<boolean>(false);
  readonly invitationError = signal<string | null>(null);
  readonly invitationDetails = signal<InvitationDetails | null>(null);
  readonly isSubmittingEmployee = signal<boolean>(false);
  readonly employeeErrorMessage = signal<string | null>(null);
  readonly invitationStep = signal<1 | 2>(1);
  private invitationToken = '';

  readonly hasCustomFields = computed(() => {
    const list = this.invitationDetails()?.customFieldsTemplate;
    return !!(list && list.length > 0);
  });

  readonly isCustomFormValid = computed(() => {
    const template = this.invitationDetails()?.customFieldsTemplate;
    if (!template || template.length === 0) return true;
    const values = this.customFieldValues();
    const docs = this.uploadedDocuments();
    for (const field of template) {
      if (field.required) {
        if (field.type === 'file') {
          const hasDoc = docs.some((d) => d.fieldKey === field.id);
          if (!hasDoc) return false;
        } else if (field.type === 'checkbox') {
          const val = values[field.id];
          if (!Array.isArray(val) || val.length === 0) return false;
        } else {
          const val = values[field.id];
          if (val === undefined || val === null || String(val).trim() === '') return false;
        }
      }
    }
    return true;
  });

  canProceedToInvitationStep2(): boolean {
    const val = this.employeeForm.value;
    return !!(
      val?.firstName?.trim() &&
      val?.lastName?.trim() &&
      val?.password &&
      val?.password.length >= 8 &&
      val?.password === val?.confirmPassword
    );
  }

  isEmployeeFormComplete(): boolean {
    if (this.employeeForm.invalid) return false;
    const val = this.employeeForm.value;
    if (val.password !== val.confirmPassword) return false;
    const details = this.invitationDetails();
    const config = details?.onboardingConfig;
    if (config?.requireCnic && !val.cnic?.trim()) return false;
    if (config?.requireAddress && !val.address?.trim()) return false;
    if (config?.requireBankDetails && (!val.bankName?.trim() || !val.accountNumber?.trim())) return false;
    if (this.hasCustomFields()) {
      return this.isCustomFormValid();
    }
    return true;
  }

  goToInvitationStep2(): void {
    const val = this.employeeForm.value;
    if (val.password !== val.confirmPassword) {
      this.employeeErrorMessage.set('Passwords do not match');
      return;
    }
    const details = this.invitationDetails();
    const config = details?.onboardingConfig;
    if (config?.requireCnic && !val.cnic?.trim()) {
      this.employeeErrorMessage.set('National ID / CNIC is required by company policy');
      return;
    }
    if (config?.requireAddress && !val.address?.trim()) {
      this.employeeErrorMessage.set('Residential address is required by company policy');
      return;
    }
    if (config?.requireBankDetails && (!val.bankName?.trim() || !val.accountNumber?.trim())) {
      this.employeeErrorMessage.set('Bank Name and Account Number are required by company policy');
      return;
    }
    if (this.employeeForm.invalid) {
      this.employeeErrorMessage.set('Please fill out all required fields');
      return;
    }
    this.employeeErrorMessage.set(null);
    this.invitationStep.set(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToInvitationStep1(): void {
    this.invitationStep.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDateOfBirthChange(date: Date | null): void {
    if (!date) {
      this.employeeForm.patchValue({ dateOfBirth: '' });
    } else {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      this.employeeForm.patchValue({ dateOfBirth: `${yyyy}-${mm}-${dd}` });
    }
    this.cdr.markForCheck();
  }

  onCustomDateChange(fieldId: string, date: Date | null): void {
    if (!date) {
      this.onCustomFieldChange(fieldId, '');
    } else {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      this.onCustomFieldChange(fieldId, `${yyyy}-${mm}-${dd}`);
    }
    this.cdr.markForCheck();
  }

  getCustomSelectOptions(options?: string[]): SelectOption[] {
    return (options || []).map((opt) => ({ label: opt, value: opt }));
  }

  // Subscription plan choice
  readonly selectedPlan = signal<'STARTER' | 'PRO' | 'ENTERPRISE'>('PRO');
  readonly selectedSeats = signal<number>(10);
  readonly isStripeRedirecting = signal<boolean>(false);

  // setPlan: updates chosen subscription tier
  setPlan(plan: 'STARTER' | 'PRO' | 'ENTERPRISE'): void {
    this.selectedPlan.set(plan);
  }

  // setSeats: updates chosen total seats quota
  setSeats(count: number): void {
    this.selectedSeats.set(Math.max(1, count));
  }

  // getPlanPricePerSeat: returns unit price for selected plan tier
  getPlanPricePerSeat(): number {
    switch (this.selectedPlan()) {
      case 'STARTER':
        return 3;
      case 'ENTERPRISE':
        return 8;
      case 'PRO':
      default:
        return 5;
    }
  }

  // getTotalMonthlyCost: calculates monthly total for seats
  getTotalMonthlyCost(): number {
    return this.selectedSeats() * this.getPlanPricePerSeat();
  }

  // getAiQuotaLabel: returns descriptive AI quota for plan
  getAiQuotaLabel(): string {
    switch (this.selectedPlan()) {
      case 'STARTER':
        return '1,000 requests/mo';
      case 'ENTERPRISE':
        return 'Unlimited requests';
      case 'PRO':
      default:
        return '5,000 requests/mo';
    }
  }

  // Logo upload state
  readonly uploadedLogoUrl = signal<string | null>(null);
  readonly isUploadingLogo = signal<boolean>(false);

  // Verification state
  readonly isVerifying = signal<boolean>(false);
  readonly verificationEmail = signal<string>('');
  readonly verificationCodeInput = signal<string>('');
  readonly verificationError = signal<string | null>(null);
  readonly verificationSuccess = signal<string | null>(null);
  readonly isSubmittingVerification = signal<boolean>(false);
  readonly resendCooldown = signal<number>(0);

  readonly countryOptions: SelectOption[] = [
    { label: 'Pakistan (PK)', value: 'PK' },
    { label: 'India (IND)', value: 'IN' },
    { label: 'United States (US)', value: 'US' },
    { label: 'United Arab Emirates (AE)', value: 'AE' },
    { label: 'United Kingdom (GB)', value: 'GB' },
    { label: 'Saudi Arabia (SA)', value: 'SA' },
    { label: 'Canada (CA)', value: 'CA' },
    { label: 'Australia (AU)', value: 'AU' },
    { label: 'Germany (DE)', value: 'DE' },
    { label: 'France (FR)', value: 'FR' },
    { label: 'Singapore (SG)', value: 'SG' },
    { label: 'Qatar (QA)', value: 'QA' },
    { label: 'Japan (JP)', value: 'JP' },
    { label: 'Turkey (TR)', value: 'TR' },
    { label: 'Malaysia (MY)', value: 'MY' },
    { label: 'Netherlands (NL)', value: 'NL' },
    { label: 'Switzerland (CH)', value: 'CH' },
    { label: 'Sweden (SE)', value: 'SE' },
    { label: 'Norway (NO)', value: 'NO' },
    { label: 'Ireland (IE)', value: 'IE' },
    { label: 'New Zealand (NZ)', value: 'NZ' },
    { label: 'Spain (ES)', value: 'ES' },
    { label: 'Italy (IT)', value: 'IT' },
    { label: 'Brazil (BR)', value: 'BR' },
    { label: 'Mexico (MX)', value: 'MX' },
    { label: 'South Africa (ZA)', value: 'ZA' },
    { label: 'Bahrain (BH)', value: 'BH' },
    { label: 'Kuwait (KW)', value: 'KW' },
    { label: 'Oman (OM)', value: 'OM' },
    { label: 'Bangladesh (BD)', value: 'BD' },
    { label: 'Sri Lanka (LK)', value: 'LK' },
    { label: 'Worldwide / Other', value: 'OTHER' },
  ];

  readonly timezoneOptions: SelectOption[] = [
    { label: 'Asia/Karachi (PKT, UTC+5)', value: 'Asia/Karachi' },
    { label: 'Asia/Kolkata (IST, UTC+5:30)', value: 'Asia/Kolkata' },
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
    { label: 'America/New_York (EST / EDT)', value: 'America/New_York' },
    { label: 'America/Chicago (CST / CDT)', value: 'America/Chicago' },
    { label: 'America/Los_Angeles (PST / PDT)', value: 'America/Los_Angeles' },
    { label: 'Europe/London (GMT / BST)', value: 'Europe/London' },
    { label: 'Europe/Paris (CET / CEST)', value: 'Europe/Paris' },
    { label: 'Europe/Berlin (CET / CEST)', value: 'Europe/Berlin' },
    { label: 'Asia/Dubai (GST, UTC+4)', value: 'Asia/Dubai' },
    { label: 'Asia/Riyadh (AST, UTC+3)', value: 'Asia/Riyadh' },
    { label: 'Asia/Singapore (SGT, UTC+8)', value: 'Asia/Singapore' },
    { label: 'Asia/Tokyo (JST, UTC+9)', value: 'Asia/Tokyo' },
    { label: 'Australia/Sydney (AEST, UTC+10)', value: 'Australia/Sydney' },
  ];

  readonly currencyOptions: SelectOption[] = [
    { label: 'USD ($) - US Dollar', value: 'USD' },
    { label: 'PKR (₨) - Pakistani Rupee', value: 'PKR' },
    { label: 'INR (₹) - Indian Rupee', value: 'INR' },
    { label: 'EUR (€) - Euro', value: 'EUR' },
    { label: 'GBP (£) - British Pound', value: 'GBP' },
    { label: 'AED (د.إ) - UAE Dirham', value: 'AED' },
    { label: 'SAR (﷼) - Saudi Riyal', value: 'SAR' },
    { label: 'CAD (C$) - Canadian Dollar', value: 'CAD' },
    { label: 'AUD (A$) - Australian Dollar', value: 'AUD' },
    { label: 'JPY (¥) - Japanese Yen', value: 'JPY' },
    { label: 'SGD (S$) - Singapore Dollar', value: 'SGD' },
    { label: 'CHF (Fr.) - Swiss Franc', value: 'CHF' },
  ];

  readonly form: FormGroup = this.fb.group({
    companyName: ['', Validators.required],
    logoUrl: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    country: ['US', Validators.required],
    city: [''],
    postalCode: [''],
    address: [''],
    region: ['USA', Validators.required],
    timezone: ['UTC', Validators.required],
    currency: ['USD', Validators.required],
  });

  readonly employeeForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    userLocationRegion: ['US', Validators.required],
    dateOfBirth: [''],
    cnic: [''],
    address: [''],
    bankName: [''],
    accountTitle: [''],
    accountNumber: [''],
    iban: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  readonly customFieldValues = signal<Record<string, any>>({});
  readonly uploadedDocuments = signal<Array<{ name: string; url: string; fieldKey?: string }>>([]);
  readonly uploadingFieldId = signal<string | null>(null);

  onCustomFieldChange(fieldId: string, val: any): void {
    this.customFieldValues.update((prev) => ({ ...prev, [fieldId]: val }));
  }

  isCheckboxOptionSelected(fieldId: string, opt: string): boolean {
    const list = this.customFieldValues()[fieldId] || [];
    return Array.isArray(list) && list.includes(opt);
  }

  toggleCheckboxOption(fieldId: string, opt: string): void {
    const list: string[] = this.customFieldValues()[fieldId] || [];
    const next = list.includes(opt) ? list.filter((x) => x !== opt) : [...list, opt];
    this.customFieldValues.update((prev) => ({ ...prev, [fieldId]: next }));
  }

  getUploadedDocsForField(fieldId: string): Array<{ name: string; url: string; fieldKey?: string }> {
    return this.uploadedDocuments().filter((d) => d.fieldKey === fieldId);
  }

  onFileUpload(fieldId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploadingFieldId.set(fieldId);

    const formData = new FormData();
    formData.append('file', file);

    this.api.post<{ success: boolean; url: string }>('upload/attachment', formData).subscribe({
      next: (res) => {
        this.uploadingFieldId.set(null);
        this.uploadedDocuments.update((prev) => [
          ...prev.filter((d) => d.fieldKey !== fieldId),
          { name: file.name, url: res.url, fieldKey: fieldId },
        ]);
        this.customFieldValues.update((prev) => ({ ...prev, [fieldId]: res.url }));
      },
      error: () => {
        this.uploadingFieldId.set(null);
        this.uploadedDocuments.update((prev) => [
          ...prev.filter((d) => d.fieldKey !== fieldId),
          { name: file.name, url: `/uploads/docs/${file.name}`, fieldKey: fieldId },
        ]);
        this.customFieldValues.update((prev) => ({ ...prev, [fieldId]: file.name }));
      },
    });
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParams;
    const token = qp['token'];
    const email = qp['email'];
    const type = qp['type'];
    const region = qp['region'];

    if (token && (type === 'employee' || !type)) {
      this.isEmployeeInvitation.set(true);
      this.invitationToken = token;
      this.loadInvitationDetails(token, email || '', region || '');
    }

    if (qp['plan'] && ['STARTER', 'PRO', 'ENTERPRISE'].includes(qp['plan'])) {
      this.selectedPlan.set(qp['plan'] as 'STARTER' | 'PRO' | 'ENTERPRISE');
    }
    if (qp['seats'] && !isNaN(Number(qp['seats']))) {
      this.selectedSeats.set(Math.max(1, Number(qp['seats'])));
    }

    // Auto-derive database shard and local preferences when country changes
    this.form.get('country')?.valueChanges.subscribe((countryCode: string) => {
      this.handleCountryChange(countryCode);
    });

    if (this.form.get('country')?.value) {
      this.handleCountryChange(this.form.get('country')?.value);
    }
  }

  handleCountryChange(code: string): void {
    if (!code) return;
    const countryToRegionMap: Record<
      string,
      { region: string; timezone?: string; currency?: string }
    > = {
      PK: { region: 'PK', timezone: 'Asia/Karachi', currency: 'PKR' },
      IN: { region: 'IND', timezone: 'Asia/Kolkata', currency: 'INR' },
      US: { region: 'USA', timezone: 'America/New_York', currency: 'USD' },
      AE: { region: 'UAE', timezone: 'Asia/Dubai', currency: 'AED' },
      GB: { region: 'GB', timezone: 'Europe/London', currency: 'GBP' },
      CA: { region: 'CA', timezone: 'America/Toronto', currency: 'CAD' },
      AU: { region: 'AU', timezone: 'Australia/Sydney', currency: 'AUD' },
      DE: { region: 'DE', timezone: 'Europe/Berlin', currency: 'EUR' },
      FR: { region: 'FR', timezone: 'Europe/Paris', currency: 'EUR' },
      SA: { region: 'SA', timezone: 'Asia/Riyadh', currency: 'SAR' },
      SG: { region: 'SG', timezone: 'Asia/Singapore', currency: 'SGD' },
      QA: { region: 'QA', timezone: 'Asia/Qatar', currency: 'QAR' },
      JP: { region: 'JP', timezone: 'Asia/Tokyo', currency: 'JPY' },
      TR: { region: 'TR', timezone: 'Europe/Istanbul', currency: 'TRY' },
      MY: { region: 'MY', timezone: 'Asia/Kuala_Lumpur', currency: 'MYR' },
      NL: { region: 'NL', timezone: 'Europe/Amsterdam', currency: 'EUR' },
      CH: { region: 'CH', timezone: 'Europe/Zurich', currency: 'CHF' },
      SE: { region: 'SE', timezone: 'Europe/Stockholm', currency: 'EUR' },
      NO: { region: 'NO', timezone: 'Europe/Oslo', currency: 'EUR' },
      IE: { region: 'IE', timezone: 'Europe/Dublin', currency: 'EUR' },
      NZ: { region: 'NZ', timezone: 'Pacific/Auckland', currency: 'AUD' },
      ES: { region: 'ES', timezone: 'Europe/Madrid', currency: 'EUR' },
      IT: { region: 'IT', timezone: 'Europe/Rome', currency: 'EUR' },
      BR: { region: 'BR', timezone: 'America/Sao_Paulo', currency: 'USD' },
      MX: { region: 'MX', timezone: 'America/Mexico_City', currency: 'USD' },
      ZA: { region: 'ZA', timezone: 'Africa/Johannesburg', currency: 'USD' },
      BH: { region: 'BH', timezone: 'Asia/Bahrain', currency: 'AED' },
      KW: { region: 'KW', timezone: 'Asia/Kuwait', currency: 'AED' },
      OM: { region: 'OM', timezone: 'Asia/Muscat', currency: 'AED' },
      BD: { region: 'BD', timezone: 'Asia/Dhaka', currency: 'USD' },
      LK: { region: 'LK', timezone: 'Asia/Colombo', currency: 'USD' },
    };

    const mapping = countryToRegionMap[code] || { region: code };
    this.form.get('region')?.setValue(mapping.region);
    if (mapping.timezone) {
      this.form.get('timezone')?.setValue(mapping.timezone);
    }
    if (mapping.currency) {
      this.form.get('currency')?.setValue(mapping.currency);
    }
  }

  getSelectedCountryLabel(): string {
    const val = this.form.get('country')?.value;
    const opt = this.countryOptions.find((c) => c.value === val);
    return opt ? opt.label : val || 'Not specified';
  }

  loadInvitationDetails(token: string, email: string, region?: string): void {
    this.invitationLoading.set(true);
    this.invitationError.set(null);

    let url = `${environment.apiUrl}/auth/invitation?token=${token}&email=${encodeURIComponent(email)}`;
    if (region) {
      url += `&region=${encodeURIComponent(region)}`;
    }
    this.http.get<InvitationDetails>(url).subscribe({
      next: (details) => {
        this.invitationLoading.set(false);
        this.invitationDetails.set(details);
        this.employeeForm.patchValue({
          firstName: details.firstName || '',
          lastName: details.lastName || '',
          userLocationRegion: details.region || 'US',
        });
      },
      error: (err) => {
        this.invitationLoading.set(false);
        this.invitationError.set(
          err?.error?.message ||
            'This invitation link is invalid or has expired. Please request a new invite from your workspace administrator.',
        );
      },
    });
  }

  submitEmployeeActivation(): void {
    if (this.employeeForm.invalid) return;

    const val = this.employeeForm.value;
    if (val.password !== val.confirmPassword) {
      this.employeeErrorMessage.set('Passwords do not match');
      return;
    }

    const details = this.invitationDetails();
    const config = details?.onboardingConfig;

    if (config?.requireCnic && !val.cnic?.trim()) {
      this.employeeErrorMessage.set('National ID / CNIC is required by company policy');
      return;
    }
    if (config?.requireAddress && !val.address?.trim()) {
      this.employeeErrorMessage.set('Residential address is required by company policy');
      return;
    }
    if (config?.requireBankDetails && (!val.bankName?.trim() || !val.accountNumber?.trim())) {
      this.employeeErrorMessage.set('Bank Name and Account Number are required by company policy');
      return;
    }

    // Validate custom fields
    const template = details?.customFieldsTemplate || [];
    for (const field of template) {
      if (field.required) {
        if (field.type === 'file') {
          const hasDoc = this.uploadedDocuments().some((d) => d.fieldKey === field.id);
          if (!hasDoc) {
            this.employeeErrorMessage.set(`${field.label} is required`);
            return;
          }
        } else {
          const fieldVal = this.customFieldValues()[field.id];
          if (fieldVal === undefined || fieldVal === null || fieldVal === '') {
            this.employeeErrorMessage.set(`${field.label} is required`);
            return;
          }
        }
      }
    }

    this.isSubmittingEmployee.set(true);
    this.employeeErrorMessage.set(null);

    const payload = {
      type: 'employee' as const,
      email: details ? details.email : '',
      password: val.password,
      firstName: val.firstName,
      lastName: val.lastName,
      companyRegion: details?.region,
      userLocationRegion: val.userLocationRegion || details?.region || 'US',
      dateOfBirth: val.dateOfBirth || undefined,
      cnic: val.cnic?.trim() || undefined,
      address: val.address?.trim() || undefined,
      bankDetails: val.accountNumber?.trim()
        ? {
            bankName: val.bankName?.trim(),
            accountTitle: val.accountTitle?.trim(),
            accountNumber: val.accountNumber?.trim(),
            iban: val.iban?.trim(),
          }
        : undefined,
      customFields: Object.keys(this.customFieldValues()).length > 0 ? this.customFieldValues() : undefined,
      documents: this.uploadedDocuments().length > 0 ? this.uploadedDocuments() : undefined,
      invitationToken: this.invitationToken,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isSubmittingEmployee.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmittingEmployee.set(false);
        this.employeeErrorMessage.set(
          err?.error?.message || 'Failed to activate employee account. Please try again.',
        );
      },
    });
  }

  // getProgressPercent: calculates registration progress percentage
  getProgressPercent(): number {
    return Math.round((this.currentStep() / 5) * 100);
  }

  getNextStepButtonLabel(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Next: Location';
      case 2:
        return 'Next: Settings';
      case 3:
        return 'Next: Subscription';
      case 4:
        return 'Next: Review';
      default:
        return 'Next';
    }
  }

  setRegion(region: 'USA' | 'EU' | 'UAE' | 'PK' | 'IND' | string): void {
    this.form.get('region')?.setValue(region);
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return !!(
        this.form.get('companyName')?.valid &&
        this.form.get('email')?.valid &&
        this.form.get('password')?.valid &&
        this.form.get('firstName')?.valid &&
        this.form.get('lastName')?.valid
      );
    }
    if (step === 2) {
      return !!this.form.get('country')?.valid;
    }
    return true;
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep())) {
      this.currentStep.update((s) => Math.min(5, s + 1));
    }
  }

  prevStep(): void {
    this.currentStep.update((s) => Math.max(1, s - 1));
  }

  onLogoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      this.errorMessage.set('Please select a valid image file (PNG, JPG, WEBP, or SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('Logo file size must be less than 5MB');
      return;
    }

    this.isUploadingLogo.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.api.post<{ success: boolean; url: string }>('upload/logo', formData).subscribe({
      next: (res) => {
        this.isUploadingLogo.set(false);
        this.uploadedLogoUrl.set(res.url);
        this.form.get('logoUrl')?.setValue(res.url);
      },
      error: (err) => {
        this.isUploadingLogo.set(false);
        const msg = err?.error?.message || 'Failed to upload logo to Cloudinary';
        this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  submitRegistration(): void {
    if (this.form.invalid) {
      this.errorMessage.set('Please fill in all required fields properly');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const values = this.form.value;
    this.authService
      .register({
        type: 'company',
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName,
        logoUrl: this.uploadedLogoUrl() || undefined,
        country: values.country,
        city: values.city,
        postalCode: values.postalCode,
        address: values.address,
        region: values.region,
        timezone: values.timezone,
        currency: values.currency,
        subscriptionPlan: this.selectedPlan(),
        purchasedSeats: this.selectedSeats(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.verificationEmail.set(values.email);
          this.isVerifying.set(true);
          this.startResendTimer();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.error?.message || 'Registration failed. Please try again.';
          this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
  }

  onVerificationCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(0, 6);
    this.verificationCodeInput.set(value);
    input.value = value;
  }

  submitVerification(): void {
    const code = this.verificationCodeInput().trim();
    if (code.length !== 6) return;

    this.isSubmittingVerification.set(true);
    this.verificationError.set(null);

    this.authService.verifyEmail(this.verificationEmail(), code).subscribe({
      next: () => {
        this.isSubmittingVerification.set(false);

        // If a paid plan was selected, optionally redirect to Stripe checkout session
        if (this.selectedPlan()) {
          this.isStripeRedirecting.set(true);
          this.api
            .post<{ url: string; isSandbox: boolean }>('subscriptions/checkout', {
              plan: this.selectedPlan(),
            })
            .subscribe({
              next: (res) => {
                if (res.url && !res.isSandbox) {
                  window.location.href = res.url;
                } else {
                  this.router.navigate(['/dashboard']);
                }
              },
              error: () => {
                this.router.navigate(['/dashboard']);
              },
            });
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isSubmittingVerification.set(false);
        const msg = err?.error?.message || 'Verification failed. Please check the code.';
        this.verificationError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  resendCode(): void {
    if (this.resendCooldown() > 0) return;

    this.authService.resendVerification(this.verificationEmail()).subscribe({
      next: () => {
        this.verificationSuccess.set('A new 6-digit code has been dispatched to your email.');
        this.startResendTimer();
        setTimeout(() => this.verificationSuccess.set(null), 5000);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to resend verification code';
        this.verificationError.set(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  }

  private startResendTimer(): void {
    this.resendCooldown.set(60);
    const interval = setInterval(() => {
      this.resendCooldown.update((v) => {
        if (v <= 1) {
          clearInterval(interval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }
}
