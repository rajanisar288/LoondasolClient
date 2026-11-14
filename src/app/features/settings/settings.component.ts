import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AppMultiSelectComponent } from '../../shared/components/multi-select/multi-select.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { AppTabsComponent, TabItem } from '../../shared/components/tabs/tabs.component';

export interface SeatStatusResponse {
  purchasedSeats: number;
  totalActiveSeats: number;
  availableSeats: number;
  plan: string;
  pricePerSeat: number;
  aiLimit: number;
  aiUsed: number;
}

export interface SalaryComponentItem {
  id: string;
  name: string;
  code: string;
  type: 'EARNING' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE_OF_BASE' | 'FORMULA';
  value: number;
  formula: string;
  isTaxable: boolean;
  enabled: boolean;
}

interface DepartmentItem {
  departmentId: string;
  name: string;
  description?: string;
  employeeCount?: number;
}

interface SocialAccountItem {
  username?: string;
  password?: string;
  apiKey?: string;
  connected?: boolean;
}

interface BranchItem {
  branchId: string;
  name: string;
  address: string;
  phone?: string;
  timezone: string;
  currency?: string;
  workingHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    workingDays: number[];
    enforceLoginRestriction: boolean;
  };
  employeeCount?: number;
}

interface WorkspaceSubscription {
  plan: 'FREE_TRIAL' | 'PRO' | 'ULTRA';
  status: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  isStripeConfigured: boolean;
  publishableKey?: string;
}

interface CompanySettings {
  companyId: string;
  name: string;
  region: string;
  industry?: string;
  companySize?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  address?: string;
  timezone?: string;
  currency?: string;
  workingHours?: {
    enabled?: boolean;
    startTime?: string;
    endTime?: string;
    workingDays?: number[];
    loginRestriction?: boolean;
    lateGracePeriodMinutes?: number;
  };
  onboardingConfig?: {
    requireCnic?: boolean;
    requireAddress?: boolean;
    requireBankDetails?: boolean;
    allowBranchDepartments?: boolean;
    allowBranchCustomForms?: boolean;
  };
  payrollConfig?: {
    lateFineType?: string;
    lateFineValue?: number;
    overtimeMultiplier?: number;
    salaryPayDay?: number;
    autoSalarySlipEnabled?: boolean;
    autoSendEmail?: boolean;
    defaultTaxPercentage?: number;
    enableLopDeduction?: boolean;
    standardWorkingDays?: number;
    passwordProtectPdf?: boolean;
    pdfPasswordRule?: 'EMP_ID_LAST4' | 'NAME4_YEAR';
    templateVersion?: number;
    templateLayout?: 'MODERN_EXECUTIVE' | 'CLASSIC_CORPORATE' | 'MINIMAL_COMPACT';
    primaryColor?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    headerCustomNote?: string;
    headerAlignment?: 'LEFT' | 'CENTERED' | 'SPLIT';
    footerText?: string;
    footerDisclaimer?: string;
    showCompanyLogo?: boolean;
    showEmployeeId?: boolean;
    showDesignation?: boolean;
    showDepartment?: boolean;
    showBranch?: boolean;
    showAttendanceSummary?: boolean;
    showPaidLeaves?: boolean;
    showLopDays?: boolean;
    showOvertimeHours?: boolean;
    showLateArrivals?: boolean;
    showBankDetails?: boolean;
    showTaxBreakdown?: boolean;
    showNetPayInWords?: boolean;
    numberWordsFormat?: 'INTERNATIONAL' | 'INDIAN_SOUTH_ASIAN';
    showSignature?: boolean;
    signatureImageUrl?: string;
    signatoryName?: string;
    signatoryTitle?: string;
    enableESignStamp?: boolean;
    customComponents?: SalaryComponentItem[];
  };
  socialMedia?: {
    linkedin?: SocialAccountItem;
    twitter?: SocialAccountItem;
    facebook?: SocialAccountItem;
    instagram?: SocialAccountItem;
  };
  topPerformerEnabled?: boolean;
  topPerformerEvalDay?: number;
  leavePolicy?: {
    totalYearlyQuota?: number;
    monthlyLimit?: number;
    leaveTypes?: Array<{
      id: string;
      name: string;
      quota: number;
      monthlyLimit?: number;
      isPaid: boolean;
    }>;
  };
}

export interface FormFieldItem {
  id: string;
  label: string;
  type: string;
  required: boolean;
  optionsStr?: string;
  options?: string[];
  placeholder?: string;
}

export interface OnboardingFormItem {
  templateId: string;
  companyId: string;
  title: string;
  branchId?: string;
  branchName?: string;
  departmentId?: string;
  departmentName?: string;
  isDefault: boolean;
  fields: FormFieldItem[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppMultiSelectComponent,
    AppBadgeComponent,
    AppModalComponent,
    AppCheckboxComponent,
    AppTabsComponent,
  ],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly Math = Math;

  readonly isSaving = signal<boolean>(false);
  readonly saveSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeSection = signal<string>('profile');
  readonly settingsTabs: TabItem[] = [
    { id: 'profile', label: 'Organization Profile' },
    { id: 'branches', label: 'Branches' },
    { id: 'departments', label: 'Departments' },
    { id: 'hours', label: 'Working Hours' },
    { id: 'regional', label: 'Regional' },
    { id: 'subscription', label: 'Billing & Plan' },
    { id: 'onboarding', label: 'Onboarding' },
    { id: 'payroll', label: 'Salary Slip Studio' },
    { id: 'leavePolicy', label: 'Leave Policy' },
    { id: 'performer', label: 'Top Performer' },
    { id: 'social', label: 'Social Media' },
    { id: 'danger', label: 'Danger Zone' },
    { id: 'all', label: 'View All' },
  ];
  readonly selectedDays = signal<number[]>([1, 2, 3, 4, 5]);
  readonly isUploadingLogo = signal<boolean>(false);
  readonly logoUploadError = signal<string | null>(null);

  // Salary Slip Studio State
  readonly salaryComponents = signal<SalaryComponentItem[]>([
    {
      id: 'HRA',
      name: 'House Rent Allowance',
      code: 'HRA',
      type: 'EARNING',
      calculationType: 'PERCENTAGE_OF_BASE',
      value: 20,
      formula: 'BASE * 0.20',
      isTaxable: true,
      enabled: false,
    },
    {
      id: 'MEDICAL',
      name: 'Medical Allowance',
      code: 'MED',
      type: 'EARNING',
      calculationType: 'PERCENTAGE_OF_BASE',
      value: 10,
      formula: 'BASE * 0.10',
      isTaxable: false,
      enabled: false,
    },
    {
      id: 'FUEL',
      name: 'Fuel & Conveyance Allowance',
      code: 'FUEL',
      type: 'EARNING',
      calculationType: 'FIXED',
      value: 150,
      formula: '150',
      isTaxable: false,
      enabled: false,
    },
    {
      id: 'PF',
      name: 'Provident Fund',
      code: 'PF',
      type: 'DEDUCTION',
      calculationType: 'PERCENTAGE_OF_BASE',
      value: 5,
      formula: 'BASE * 0.05',
      isTaxable: false,
      enabled: false,
    },
  ]);
  readonly isSalaryComponentModalOpen = signal<boolean>(false);
  readonly editingSalaryCompId = signal<string | null>(null);
  readonly compName = signal<string>('');
  readonly compCode = signal<string>('');
  readonly compType = signal<'EARNING' | 'DEDUCTION'>('EARNING');
  readonly compCalcType = signal<'FIXED' | 'PERCENTAGE_OF_BASE' | 'FORMULA'>('PERCENTAGE_OF_BASE');
  readonly compValue = signal<number>(10);
  readonly compFormula = signal<string>('BASE * 0.10');
  readonly compIsTaxable = signal<boolean>(true);
  readonly compEnabled = signal<boolean>(true);

  readonly isUploadingSignature = signal<boolean>(false);
  readonly isPreviewingSlip = signal<boolean>(false);
  readonly isSlipPreviewModalOpen = signal<boolean>(false);
  readonly slipPreviewRawHtml = signal<string>('');
  readonly slipPreviewSafeHtml = signal<SafeHtml | null>(null);
  readonly studioView = signal<'designer' | 'preview'>('designer');

  setStudioView(view: 'designer' | 'preview'): void {
    this.studioView.set(view);
    if (!this.slipPreviewSafeHtml() || view === 'preview') {
      this.refreshLiveSlipPreview();
    }
  }

  /** Refreshes the live actual salary slip preview in real-time. */
  refreshLiveSlipPreview(): void {
    this.isPreviewingSlip.set(true);
    const currentPayrollConfig = {
      ...this.settingsForm.get('payrollConfig')?.value,
      customComponents: this.salaryComponents(),
    };

    this.api
      .post<{ html: string; netSalary: number; netPayInWords: string }>('payroll/preview-html', {
        payrollConfigOverride: currentPayrollConfig,
        templateConfig: currentPayrollConfig,
      })
      .subscribe({
        next: (res) => {
          this.isPreviewingSlip.set(false);
          this.slipPreviewRawHtml.set(res.html || '');
          this.slipPreviewSafeHtml.set(this.sanitizer.bypassSecurityTrustHtml(res.html || ''));
        },
        error: (err) => {
          this.isPreviewingSlip.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to render live HTML preview');
        },
      });
  }

  readonly formulaVariables = [
    'BASE',
    'DAILY_RATE',
    'HOURLY_RATE',
    'WORKING_DAYS',
    'PRESENT_DAYS',
    'PAID_LEAVES',
    'LOP_DAYS',
    'LATE_DAYS',
    'OVERTIME_HOURS',
    '+',
    '-',
    '*',
    '/',
    '(',
    ')',
  ];

  readonly slipLayoutOptions: Array<{
    id: 'MODERN_EXECUTIVE' | 'CLASSIC_CORPORATE' | 'MINIMAL_COMPACT';
    title: string;
    desc: string;
  }> = [
    {
      id: 'MODERN_EXECUTIVE',
      title: '1. Modern Executive',
      desc: 'SaaS gradient accents, structured KPI cards, side-by-side earnings/deductions, and highlighted Net Pay banner.',
    },
    {
      id: 'CLASSIC_CORPORATE',
      title: '2. Classic Corporate',
      desc: 'Traditional enterprise double-bordered tabular statement ideal for formal banking, audit, and statutory compliance.',
    },
    {
      id: 'MINIMAL_COMPACT',
      title: '3. Minimal Compact',
      desc: 'Clean, ultra-crisp single-sheet layout optimized for fast reading and low-ink office printing.',
    },
  ];

  readonly slipFieldToggles = [
    { control: 'showCompanyLogo', label: 'Company Logo' },
    { control: 'showEmployeeId', label: 'Employee ID' },
    { control: 'showDesignation', label: 'Designation' },
    { control: 'showDepartment', label: 'Department' },
    { control: 'showBranch', label: 'Branch Name' },
    { control: 'showAttendanceSummary', label: 'Attendance Summary' },
    { control: 'showPaidLeaves', label: 'Paid Leaves' },
    { control: 'showLopDays', label: 'LOP (Unpaid) Days' },
    { control: 'showOvertimeHours', label: 'Overtime Hours' },
    { control: 'showLateArrivals', label: 'Late Arrivals' },
    { control: 'showBankDetails', label: 'Bank Details' },
    { control: 'showTaxBreakdown', label: 'Tax Breakdown' },
    { control: 'showNetPayInWords', label: 'Net Pay in Words' },
    { control: 'showSignature', label: 'Signatory & e-Sign' },
  ];

  readonly leaveTypes = signal<Array<{ id: string; name: string; quota: number; monthlyLimit?: number; isPaid: boolean }>>([
    { id: 'ANNUAL', name: 'Annual / Paid Leave', quota: 10, monthlyLimit: 2, isPaid: true },
    { id: 'SICK', name: 'Sick Leave', quota: 7, monthlyLimit: 2, isPaid: true },
    { id: 'CASUAL', name: 'Casual Leave', quota: 7, monthlyLimit: 2, isPaid: true },
  ]);
  readonly isAddLeaveTypeModalOpen = signal<boolean>(false);
  readonly newLeaveTypeName = signal<string>('');
  readonly newLeaveTypeQuota = signal<number>(7);
  readonly newLeaveTypeMonthlyLimit = signal<number>(2);
  readonly newLeaveTypeIsPaid = signal<boolean>(true);

  readonly departments = signal<DepartmentItem[]>([]);
  readonly isAddDeptModalOpen = signal<boolean>(false);
  readonly newDeptName = signal<string>('');
  readonly newDeptDesc = signal<string>('');
  readonly isCreatingDept = signal<boolean>(false);

  readonly branches = signal<BranchItem[]>([]);
  readonly hasBranches = computed(() => this.branches().length > 0);
  readonly hasDepartments = computed(() => this.departments().length > 0);
  readonly gracePeriodUnit = signal<'minutes' | 'hours'>('minutes');

  get displayedGracePeriod(): number {
    const mins = Number(this.settingsForm.get('workingHours.lateGracePeriodMinutes')?.value || 0);
    if (this.gracePeriodUnit() === 'hours') {
      return parseFloat((mins / 60).toFixed(2));
    }
    return mins;
  }

  onGracePeriodInput(value: any): void {
    const num = parseFloat(value) || 0;
    if (this.gracePeriodUnit() === 'hours') {
      this.settingsForm.patchValue({
        workingHours: { lateGracePeriodMinutes: Math.round(num * 60) },
      });
    } else {
      this.settingsForm.patchValue({
        workingHours: { lateGracePeriodMinutes: Math.round(num) },
      });
    }
  }

  toggleGracePeriodUnit(unit: 'minutes' | 'hours'): void {
    this.gracePeriodUnit.set(unit);
    this.cdr.markForCheck();
  }

  private alertTimeout: any = null;

  triggerAutoDismiss(): void {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    this.alertTimeout = setTimeout(() => {
      this.saveSuccess.set(false);
      this.errorMessage.set(null);
      this.cdr.markForCheck();
    }, 4500);
  }
  readonly isAddBranchModalOpen = signal<boolean>(false);
  readonly editingBranchId = signal<string | null>(null);
  readonly isSavingBranch = signal<boolean>(false);
  readonly branchSelectedDays = signal<number[]>([1, 2, 3, 4, 5]);
  readonly showSocialPassword = signal<{ [key: string]: boolean }>({});

  readonly subscription = signal<WorkspaceSubscription | null>(null);
  readonly isUpgrading = signal<string | null>(null);
  readonly isManagingBilling = signal<boolean>(false);

  readonly seatStatus = signal<SeatStatusResponse | null>(null);
  readonly isAddSeatsModalOpen = signal<boolean>(false);
  readonly additionalSeatsCount = signal<number>(2);
  readonly isExpandingSeats = signal<boolean>(false);
  readonly addSeatsSuccessMessage = signal<string | null>(null);

  // loadSeatStatus: fetches workspace seat count, active employees, and AI quotas
  loadSeatStatus(): void {
    this.api.get<SeatStatusResponse>('companies/seats/status').subscribe({
      next: (res) => this.seatStatus.set(res),
      error: () => {},
    });
  }

  // openAddSeatsModal: displays modal to purchase incremental employee seats
  openAddSeatsModal(): void {
    this.additionalSeatsCount.set(2);
    this.addSeatsSuccessMessage.set(null);
    this.isAddSeatsModalOpen.set(true);
  }

  // closeAddSeatsModal: dismisses the add seats modal
  closeAddSeatsModal(): void {
    this.isAddSeatsModalOpen.set(false);
  }

  // setAdditionalSeatsCount: updates quantity of seats to purchase
  setAdditionalSeatsCount(count: number): void {
    this.additionalSeatsCount.set(Math.max(1, count));
  }

  // getAdditionalSeatsCost: calculates charge for only the additional seats
  getAdditionalSeatsCost(): number {
    const rate = this.seatStatus()?.pricePerSeat ?? 5;
    return this.additionalSeatsCount() * rate;
  }

  // confirmAddSeats: submits request to expand seats and charges for incremental quantity
  confirmAddSeats(): void {
    const seats = this.additionalSeatsCount();
    if (!seats || seats < 1) return;
    this.isExpandingSeats.set(true);
    this.api
      .patch<{ success: boolean; totalSeats: number; chargedAmount: number }>(
        'companies/seats/expand',
        { additionalSeats: seats },
      )
      .subscribe({
        next: (res) => {
          this.isExpandingSeats.set(false);
          this.addSeatsSuccessMessage.set(
            `Successfully added ${seats} seats ($${res.chargedAmount} charged). Your workspace now accommodates ${res.totalSeats} seats.`,
          );
          this.loadSeatStatus();
          setTimeout(() => {
            this.closeAddSeatsModal();
          }, 2000);
        },
        error: (err) => {
          this.isExpandingSeats.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to add seats');
        },
      });
  }

  readonly isDeleteCompanyModalOpen = signal<boolean>(false);
  readonly isDeletingCompany = signal<boolean>(false);
  readonly deleteConfirmationText = signal<string>('');

  readonly daysOfWeek = [
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
    { label: 'Sun', value: 0 },
  ];

  readonly companySizeOptions: SelectOption[] = [
    { label: '1 - 10 employees', value: '1-10' },
    { label: '11 - 50 employees', value: '11-50' },
    { label: '51 - 200 employees', value: '51-200' },
    { label: '201 - 500 employees', value: '201-500' },
    { label: '500+ enterprise', value: '500+' },
  ];

  readonly industryOptions: SelectOption[] = [
    { label: 'Software & Technology', value: 'Technology' },
    { label: 'Financial Services', value: 'Finance' },
    { label: 'Healthcare & Biotech', value: 'Healthcare' },
    { label: 'E-commerce & Retail', value: 'Retail' },
    { label: 'Professional Consulting', value: 'Consulting' },
    { label: 'Manufacturing & Logistics', value: 'Logistics' },
  ];

  readonly timezoneOptions: SelectOption[] = [
    { label: 'Asia/Karachi (Pakistan • UTC+05:00)', value: 'Asia/Karachi' },
    { label: 'Asia/Kolkata (India • UTC+05:30)', value: 'Asia/Kolkata' },
    { label: 'Asia/Dubai (UAE • UTC+04:00)', value: 'Asia/Dubai' },
    { label: 'Asia/Riyadh (Saudi Arabia • UTC+03:00)', value: 'Asia/Riyadh' },
    { label: 'Europe/London (UK • UTC+00:00 / +01:00)', value: 'Europe/London' },
    { label: 'Europe/Berlin (Central Europe • UTC+01:00 / +02:00)', value: 'Europe/Berlin' },
    { label: 'America/New_York (USA Eastern • UTC-05:00 / -04:00)', value: 'America/New_York' },
    { label: 'America/Chicago (USA Central • UTC-06:00 / -05:00)', value: 'America/Chicago' },
    { label: 'America/Denver (USA Mountain • UTC-07:00 / -06:00)', value: 'America/Denver' },
    { label: 'America/Los_Angeles (USA Pacific • UTC-08:00 / -07:00)', value: 'America/Los_Angeles' },
    { label: 'America/Toronto (Canada • UTC-05:00 / -04:00)', value: 'America/Toronto' },
    { label: 'Australia/Sydney (Australia • UTC+10:00 / +11:00)', value: 'Australia/Sydney' },
    { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  ];

  readonly currencyOptions: SelectOption[] = [
    { label: 'USD ($) - US Dollar', value: 'USD' },
    { label: 'PKR (₨) - Pakistani Rupee', value: 'PKR' },
    { label: 'EUR (€) - Euro', value: 'EUR' },
    { label: 'GBP (£) - British Pound', value: 'GBP' },
    { label: 'AED (د.إ) - UAE Dirham', value: 'AED' },
    { label: 'SAR (﷼) - Saudi Riyal', value: 'SAR' },
    { label: 'INR (₹) - Indian Rupee', value: 'INR' },
    { label: 'CAD ($) - Canadian Dollar', value: 'CAD' },
    { label: 'AUD ($) - Australian Dollar', value: 'AUD' },
  ];

  /** Returns branch select options for onboarding form scope. */
  branchScopeOptions(): SelectOption[] {
    return [
      { label: 'All Branches (Company-wide)', value: '' },
      ...this.branches().map((b) => ({ label: b.name, value: b.branchId })),
    ];
  }

  /** Returns department select options for onboarding form scope. */
  departmentScopeOptions(): SelectOption[] {
    return [
      { label: 'All Departments', value: '' },
      ...this.departments().map((d) => ({ label: d.name, value: d.departmentId })),
    ];
  }

  readonly branchForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    phone: [''],
    timezone: ['Asia/Karachi'],
    currency: ['USD'],
    workingHours: this.fb.group({
      enabled: [true],
      startTime: ['09:00', Validators.required],
      endTime: ['18:00', Validators.required],
      enforceLoginRestriction: [false],
    }),
  });

  readonly settingsForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
    website: [''],
    companySize: ['1-10'],
    industry: ['Technology'],
    logoUrl: [''],
    city: [''],
    address: [''],
    postalCode: [''],
    timezone: ['Asia/Karachi'],
    currency: ['USD'],
    workingHours: this.fb.group({
      enabled: [false],
      startTime: ['09:00'],
      endTime: ['18:00'],
      loginRestriction: [false],
      lateGracePeriodMinutes: [15],
    }),
    onboardingConfig: this.fb.group({
      requireCnic: [false],
      requireAddress: [false],
      requireBankDetails: [false],
      allowBranchDepartments: [false],
      allowBranchCustomForms: [false],
    }),
    payrollConfig: this.fb.group({
      lateFineType: ['PERCENTAGE'],
      lateFineValue: [2],
      overtimeMultiplier: [1.5],
      salaryPayDay: [1],
      autoSalarySlipEnabled: [false],
      autoSendEmail: [false],
      defaultTaxPercentage: [0],
      enableLopDeduction: [true],
      standardWorkingDays: [22],
      passwordProtectPdf: [false],
      pdfPasswordRule: ['EMP_ID_LAST4'],
      templateVersion: [1],
      templateLayout: ['MODERN_EXECUTIVE'],
      primaryColor: ['#2A65F6'],
      headerTitle: ['SALARY SLIP'],
      headerSubtitle: ['Official Monthly Compensation Statement'],
      headerCustomNote: [''],
      headerAlignment: ['SPLIT'],
      footerText: ['This is a computer-generated salary slip and does not require a physical wet signature.'],
      footerDisclaimer: ['Confidential — For the named recipient only.'],
      showCompanyLogo: [true],
      showEmployeeId: [true],
      showDesignation: [true],
      showDepartment: [true],
      showBranch: [true],
      showAttendanceSummary: [true],
      showPaidLeaves: [true],
      showLopDays: [true],
      showOvertimeHours: [true],
      showLateArrivals: [true],
      showBankDetails: [true],
      showTaxBreakdown: [true],
      showNetPayInWords: [true],
      numberWordsFormat: ['INDIAN_SOUTH_ASIAN'],
      showSignature: [true],
      signatureImageUrl: [''],
      signatoryName: ['Authorized Signatory'],
      signatoryTitle: ['Human Resources & Finance'],
      enableESignStamp: [true],
    }),
    leavePolicy: this.fb.group({
      totalYearlyQuota: [24],
      monthlyLimit: [2],
    }),
    socialMedia: this.fb.group({
      linkedin: this.fb.group({
        username: [''],
        password: [''],
        apiKey: [''],
        connected: [false],
      }),
      twitter: this.fb.group({
        username: [''],
        password: [''],
        apiKey: [''],
        connected: [false],
      }),
      facebook: this.fb.group({
        username: [''],
        password: [''],
        apiKey: [''],
        connected: [false],
      }),
      instagram: this.fb.group({
        username: [''],
        password: [''],
        apiKey: [''],
        connected: [false],
      }),
    }),
    topPerformerEnabled: [false],
    topPerformerEvalDay: [28],
  });

  /** Loads all workspace settings, branches, departments, and billing state on initialization. */
  ngOnInit(): void {
    this.loadSettings();
    this.loadDepartments();
    this.loadBranches();
    this.loadSubscription();
    this.loadSeatStatus();
    this.loadOnboardingForms();
  }

  /** Fetches the current company configuration from the backend. */
  loadSettings(): void {
    this.api.get<CompanySettings>('companies/current').subscribe({
      next: (comp) => {
        this.settingsForm.patchValue({
          name: comp.name,
          phone: comp.phone || '',
          website: comp.website || '',
          companySize: comp.companySize || '1-10',
          industry: comp.industry || 'Technology',
          logoUrl: comp.logoUrl || '',
          city: comp.city || '',
          address: comp.address || '',
          postalCode: comp.postalCode || '',
          timezone: comp.timezone || 'Asia/Karachi',
          currency: comp.currency || 'USD',
          workingHours: {
            enabled: comp.workingHours?.enabled ?? false,
            startTime: comp.workingHours?.startTime || '09:00',
            endTime: comp.workingHours?.endTime || '18:00',
            loginRestriction: comp.workingHours?.loginRestriction ?? false,
            lateGracePeriodMinutes: comp.workingHours?.lateGracePeriodMinutes ?? 15,
          },
          onboardingConfig: {
            requireCnic: comp.onboardingConfig?.requireCnic ?? false,
            requireAddress: comp.onboardingConfig?.requireAddress ?? false,
            requireBankDetails: comp.onboardingConfig?.requireBankDetails ?? false,
            allowBranchDepartments: comp.onboardingConfig?.allowBranchDepartments ?? false,
            allowBranchCustomForms: comp.onboardingConfig?.allowBranchCustomForms ?? false,
          },
          payrollConfig: {
            lateFineType: comp.payrollConfig?.lateFineType || 'PERCENTAGE',
            lateFineValue: comp.payrollConfig?.lateFineValue ?? 2,
            overtimeMultiplier: comp.payrollConfig?.overtimeMultiplier ?? 1.5,
            salaryPayDay: comp.payrollConfig?.salaryPayDay ?? 1,
            autoSalarySlipEnabled: comp.payrollConfig?.autoSalarySlipEnabled ?? false,
            autoSendEmail: comp.payrollConfig?.autoSendEmail ?? false,
            defaultTaxPercentage: comp.payrollConfig?.defaultTaxPercentage ?? 0,
            enableLopDeduction: comp.payrollConfig?.enableLopDeduction ?? true,
            standardWorkingDays: comp.payrollConfig?.standardWorkingDays ?? 22,
            passwordProtectPdf: comp.payrollConfig?.passwordProtectPdf ?? false,
            pdfPasswordRule: comp.payrollConfig?.pdfPasswordRule || 'EMP_ID_LAST4',
            templateVersion: comp.payrollConfig?.templateVersion ?? 1,
            templateLayout: comp.payrollConfig?.templateLayout || 'MODERN_EXECUTIVE',
            primaryColor: comp.payrollConfig?.primaryColor || '#2A65F6',
            headerTitle: comp.payrollConfig?.headerTitle || 'SALARY SLIP',
            headerSubtitle: comp.payrollConfig?.headerSubtitle || 'Official Monthly Compensation Statement',
            headerCustomNote: comp.payrollConfig?.headerCustomNote || '',
            headerAlignment: comp.payrollConfig?.headerAlignment || 'SPLIT',
            footerText:
              comp.payrollConfig?.footerText ||
              'This is a computer-generated salary slip and does not require a physical wet signature.',
            footerDisclaimer: comp.payrollConfig?.footerDisclaimer || 'Confidential — For the named recipient only.',
            showCompanyLogo: comp.payrollConfig?.showCompanyLogo ?? true,
            showEmployeeId: comp.payrollConfig?.showEmployeeId ?? true,
            showDesignation: comp.payrollConfig?.showDesignation ?? true,
            showDepartment: comp.payrollConfig?.showDepartment ?? true,
            showBranch: comp.payrollConfig?.showBranch ?? true,
            showAttendanceSummary: comp.payrollConfig?.showAttendanceSummary ?? true,
            showPaidLeaves: comp.payrollConfig?.showPaidLeaves ?? true,
            showLopDays: comp.payrollConfig?.showLopDays ?? true,
            showOvertimeHours: comp.payrollConfig?.showOvertimeHours ?? true,
            showLateArrivals: comp.payrollConfig?.showLateArrivals ?? true,
            showBankDetails: comp.payrollConfig?.showBankDetails ?? true,
            showTaxBreakdown: comp.payrollConfig?.showTaxBreakdown ?? true,
            showNetPayInWords: comp.payrollConfig?.showNetPayInWords ?? true,
            numberWordsFormat: comp.payrollConfig?.numberWordsFormat || 'INDIAN_SOUTH_ASIAN',
            showSignature: comp.payrollConfig?.showSignature ?? true,
            signatureImageUrl: comp.payrollConfig?.signatureImageUrl || '',
            signatoryName: comp.payrollConfig?.signatoryName || 'Authorized Signatory',
            signatoryTitle: comp.payrollConfig?.signatoryTitle || 'Human Resources & Finance',
            enableESignStamp: comp.payrollConfig?.enableESignStamp ?? true,
          },
          leavePolicy: {
            totalYearlyQuota: comp.leavePolicy?.totalYearlyQuota ?? 24,
            monthlyLimit: comp.leavePolicy?.monthlyLimit ?? 2,
          },
          socialMedia: {
            linkedin: {
              username: comp.socialMedia?.linkedin?.username || '',
              password: comp.socialMedia?.linkedin?.password || '',
              apiKey: comp.socialMedia?.linkedin?.apiKey || '',
              connected: comp.socialMedia?.linkedin?.connected ?? false,
            },
            twitter: {
              username: comp.socialMedia?.twitter?.username || '',
              password: comp.socialMedia?.twitter?.password || '',
              apiKey: comp.socialMedia?.twitter?.apiKey || '',
              connected: comp.socialMedia?.twitter?.connected ?? false,
            },
            facebook: {
              username: comp.socialMedia?.facebook?.username || '',
              password: comp.socialMedia?.facebook?.password || '',
              apiKey: comp.socialMedia?.facebook?.apiKey || '',
              connected: comp.socialMedia?.facebook?.connected ?? false,
            },
            instagram: {
              username: comp.socialMedia?.instagram?.username || '',
              password: comp.socialMedia?.instagram?.password || '',
              apiKey: comp.socialMedia?.instagram?.apiKey || '',
              connected: comp.socialMedia?.instagram?.connected ?? false,
            },
          },
          topPerformerEnabled: comp.topPerformerEnabled ?? false,
          topPerformerEvalDay: comp.topPerformerEvalDay ?? 28,
        });
        if (comp.payrollConfig?.customComponents && comp.payrollConfig.customComponents.length > 0) {
          this.salaryComponents.set(comp.payrollConfig.customComponents);
        }
        if (comp.leavePolicy?.leaveTypes && comp.leavePolicy.leaveTypes.length > 0) {
          this.leaveTypes.set(comp.leavePolicy.leaveTypes);
        }
        if (comp.workingHours?.workingDays) {
          this.selectedDays.set(comp.workingHours.workingDays);
        }
        this.refreshLiveSlipPreview();
      },
      error: () => {},
    });
  }

  /** Uploads a new company logo image file to Cloudinary. */
  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.logoUploadError.set('Please select a valid image file (PNG, JPG, WebP, SVG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.logoUploadError.set('Logo file size must be less than 2MB');
      return;
    }

    this.isUploadingLogo.set(true);
    this.logoUploadError.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.api.post<{ url: string; publicId: string }>('upload/logo', formData).subscribe({
      next: (res) => {
        this.settingsForm.patchValue({ logoUrl: res.url });
        this.isUploadingLogo.set(false);
      },
      error: (err) => {
        this.isUploadingLogo.set(false);
        this.logoUploadError.set(err?.error?.message || 'Failed to upload logo');
      },
    });
  }

  /** Clears the current company logo from the settings form. */
  removeLogo(): void {
    this.settingsForm.patchValue({ logoUrl: '' });
  }

  /** Selects one of the 3 salary slip layouts. */
  selectSlipLayout(layout: 'MODERN_EXECUTIVE' | 'CLASSIC_CORPORATE' | 'MINIMAL_COMPACT'): void {
    this.settingsForm.get('payrollConfig.templateLayout')?.setValue(layout);
    this.refreshLiveSlipPreview();
  }

  /** Uploads an authorized signature image to Cloudinary for payslips. */
  onSignatureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Please select a valid signature image file (PNG, JPG, WebP)');
      return;
    }

    this.isUploadingSignature.set(true);
    const formData = new FormData();
    formData.append('file', file);

    this.api.post<{ url: string; publicId: string }>('upload/logo', formData).subscribe({
      next: (res) => {
        this.settingsForm.get('payrollConfig.signatureImageUrl')?.setValue(res.url);
        this.isUploadingSignature.set(false);
      },
      error: (err) => {
        this.isUploadingSignature.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to upload signature image');
      },
    });
  }

  /** Opens modal to create a custom salary component. */
  openAddSalaryComponentModal(): void {
    this.editingSalaryCompId.set(null);
    this.compName.set('');
    this.compCode.set('');
    this.compType.set('EARNING');
    this.compCalcType.set('PERCENTAGE_OF_BASE');
    this.compValue.set(10);
    this.compFormula.set('BASE * 0.10');
    this.compIsTaxable.set(true);
    this.compEnabled.set(true);
    this.isSalaryComponentModalOpen.set(true);
  }

  /** Opens modal to edit an existing salary component. */
  openEditSalaryComponentModal(comp: SalaryComponentItem): void {
    this.editingSalaryCompId.set(comp.id);
    this.compName.set(comp.name);
    this.compCode.set(comp.code);
    this.compType.set(comp.type);
    this.compCalcType.set(comp.calculationType);
    this.compValue.set(comp.value);
    this.compFormula.set(comp.formula || 'BASE * 0.10');
    this.compIsTaxable.set(comp.isTaxable);
    this.compEnabled.set(comp.enabled);
    this.isSalaryComponentModalOpen.set(true);
  }

  closeSalaryComponentModal(): void {
    this.isSalaryComponentModalOpen.set(false);
    this.editingSalaryCompId.set(null);
  }

  appendFormulaToken(token: string): void {
    const current = this.compFormula().trim();
    this.compFormula.set(current ? `${current} ${token}` : token);
  }

  saveSalaryComponent(): void {
    const name = this.compName().trim();
    if (!name) return;

    const editingId = this.editingSalaryCompId();
    const id = editingId || name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const code = (this.compCode().trim() || id.slice(0, 6)).toUpperCase();

    const newItem: SalaryComponentItem = {
      id,
      name,
      code,
      type: this.compType(),
      calculationType: this.compCalcType(),
      value: Number(this.compValue()) || 0,
      formula: this.compFormula().trim() || '0',
      isTaxable: this.compIsTaxable(),
      enabled: this.compEnabled(),
    };

    if (editingId) {
      this.salaryComponents.set(
        this.salaryComponents().map((c) => (c.id === editingId ? newItem : c)),
      );
    } else {
      this.salaryComponents.set([...this.salaryComponents(), newItem]);
    }

    this.closeSalaryComponentModal();
  }

  toggleSalaryComponent(id: string): void {
    this.salaryComponents.set(
      this.salaryComponents().map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    );
  }

  removeSalaryComponent(id: string): void {
    this.salaryComponents.set(this.salaryComponents().filter((c) => c.id !== id));
  }

  /** Requests live rendered HTML preview of the current Salary Slip Studio settings. */
  openSlipLivePreview(): void {
    this.isPreviewingSlip.set(true);
    const currentPayrollConfig = {
      ...this.settingsForm.get('payrollConfig')?.value,
      customComponents: this.salaryComponents(),
    };

    this.api
      .post<{ html: string; netSalary: number; netPayInWords: string }>('payroll/preview-html', {
        payrollConfigOverride: currentPayrollConfig,
        templateConfig: currentPayrollConfig,
      })
      .subscribe({
        next: (res) => {
          this.isPreviewingSlip.set(false);
          this.slipPreviewRawHtml.set(res.html || '');
          this.slipPreviewSafeHtml.set(this.sanitizer.bypassSecurityTrustHtml(res.html || ''));
          this.isSlipPreviewModalOpen.set(true);
        },
        error: (err) => {
          this.isPreviewingSlip.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to render live HTML preview');
        },
      });
  }

  openPreviewInNewWindow(): void {
    const html = this.slipPreviewRawHtml();
    if (!html) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  /** Toggles a working day in the company-wide shift schedule. */
  toggleDay(day: number): void {
    const current = this.selectedDays();
    if (current.includes(day)) {
      if (current.length > 1) {
        this.selectedDays.set(current.filter((d) => d !== day));
      }
    } else {
      this.selectedDays.set([...current, day]);
    }
  }

  /** Checks whether a working day is selected. */
  isDaySelected(day: number): boolean {
    return this.selectedDays().includes(day);
  }

  /** Saves company settings and updates the active company state. */
  saveSettings(): void {
    if (this.settingsForm.invalid) return;

    this.isSaving.set(true);
    this.saveSuccess.set(false);
    this.errorMessage.set(null);

    const formVal = this.settingsForm.value;
    const nextVersion =
      this.activeSection() === 'payroll'
        ? (Number(formVal.payrollConfig?.templateVersion) || 1) + 1
        : Number(formVal.payrollConfig?.templateVersion) || 1;

    this.settingsForm.get('payrollConfig.templateVersion')?.setValue(nextVersion);

    const payload = {
      ...formVal,
      workingHours: {
        ...formVal.workingHours,
        workingDays: this.selectedDays(),
      },
      payrollConfig: {
        ...formVal.payrollConfig,
        templateVersion: nextVersion,
        customComponents: this.salaryComponents(),
      },
      leavePolicy: {
        totalYearlyQuota: Number(formVal.leavePolicy?.totalYearlyQuota) || 24,
        monthlyLimit: Number(formVal.leavePolicy?.monthlyLimit) || 2,
        leaveTypes: this.leaveTypes(),
      },
    };

    this.api.patch<CompanySettings>('companies/current', payload).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        this.triggerAutoDismiss();
        if (updated) {
          this.authService.updateCurrentCompany({
            name: updated.name,
            logoUrl: updated.logoUrl,
            timezone: updated.timezone || formVal.timezone,
            currency: updated.currency || formVal.currency,
            companyTimezone: updated.timezone || formVal.timezone,
            companyCurrency: updated.currency || formVal.currency,
          });
          this.authService.loadCurrentUser().subscribe();
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to update company settings');
        this.triggerAutoDismiss();
      },
    });
  }

  openAddLeaveTypeModal(): void {
    this.newLeaveTypeName.set('');
    this.newLeaveTypeQuota.set(7);
    this.newLeaveTypeMonthlyLimit.set(2);
    this.newLeaveTypeIsPaid.set(true);
    this.isAddLeaveTypeModalOpen.set(true);
  }

  closeAddLeaveTypeModal(): void {
    this.isAddLeaveTypeModalOpen.set(false);
  }

  addLeaveType(): void {
    const name = this.newLeaveTypeName().trim();
    if (!name) return;
    const id = name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const current = this.leaveTypes();
    const exists = current.find((t) => t.id === id || t.name.toLowerCase() === name.toLowerCase());
    if (exists) return;

    const newType = {
      id,
      name,
      quota: Number(this.newLeaveTypeQuota()) || 7,
      monthlyLimit: Number(this.newLeaveTypeMonthlyLimit()) || 2,
      isPaid: this.newLeaveTypeIsPaid(),
    };

    this.leaveTypes.set([...current, newType]);
    this.closeAddLeaveTypeModal();
    this.saveSettings();
  }

  removeLeaveType(id: string): void {
    this.leaveTypes.set(this.leaveTypes().filter((t) => t.id !== id));
    this.saveSettings();
  }

  /** Loads company departments from the backend. */
  loadDepartments(): void {
    this.api.get<DepartmentItem[]>('departments').subscribe({
      next: (data) => this.departments.set(data || []),
      error: () => {},
    });
  }

  /** Opens the modal for creating a new department. */
  openAddDeptModal(): void {
    this.newDeptName.set('');
    this.newDeptDesc.set('');
    this.isAddDeptModalOpen.set(true);
  }

  /** Closes the create department modal. */
  closeAddDeptModal(): void {
    this.isAddDeptModalOpen.set(false);
  }

  /** Submits a new department to the backend. */
  createDept(): void {
    const name = this.newDeptName().trim();
    if (!name) return;

    this.isCreatingDept.set(true);
    this.api
      .post<DepartmentItem>('departments', {
        name,
        description: this.newDeptDesc().trim(),
      })
      .subscribe({
        next: (created) => {
          this.departments.set([...this.departments(), created]);
          this.isCreatingDept.set(false);
          this.closeAddDeptModal();
        },
        error: (err) => {
          this.isCreatingDept.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to create department');
        },
      });
  }

  /** Deletes a department by ID. */
  deleteDept(departmentId: string): void {
    if (!confirm('Are you sure you want to delete this department?')) return;

    this.api.delete(`departments/${departmentId}`).subscribe({
      next: () => {
        this.departments.set(this.departments().filter((d) => d.departmentId !== departmentId));
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to delete department');
      },
    });
  }

  /** Retrieves current workspace subscription tier and Stripe status. */
  loadSubscription(): void {
    this.api.get<WorkspaceSubscription>('subscriptions/current').subscribe({
      next: (sub) => this.subscription.set(sub),
      error: () => {},
    });
  }

  /** Initiates Stripe Checkout session for upgrading to Pro or Ultra. */
  upgradePlan(targetPlan: 'PRO' | 'ULTRA'): void {
    this.isUpgrading.set(targetPlan);
    this.errorMessage.set(null);
    this.api
      .post<{ checkoutUrl?: string; redirectUrl?: string; mock?: boolean; status?: string }>(
        'subscriptions/checkout',
        {
          plan: targetPlan,
          successUrl: `${window.location.origin}/settings?billing=success`,
          cancelUrl: `${window.location.origin}/settings?billing=cancelled`,
        },
      )
      .subscribe({
        next: (res) => {
          this.isUpgrading.set(null);
          const targetUrl = res.checkoutUrl || res.redirectUrl;
          if (res.mock || !targetUrl || targetUrl.includes('/settings')) {
            this.loadSubscription();
            this.saveSuccess.set(true);
          } else {
            window.location.href = targetUrl;
          }
        },
        error: (err) => {
          this.isUpgrading.set(null);
          this.errorMessage.set(err?.error?.message || 'Failed to initiate checkout');
        },
      });
  }

  /** Opens Stripe Customer Billing Portal for subscription management. */
  openCustomerPortal(): void {
    this.isManagingBilling.set(true);
    this.errorMessage.set(null);
    this.api.post<{ portalUrl?: string; mock?: boolean }>('subscriptions/portal', {}).subscribe({
      next: (res) => {
        this.isManagingBilling.set(false);
        if (res.portalUrl) {
          window.location.href = res.portalUrl;
        } else {
          this.saveSuccess.set(true);
        }
      },
      error: (err) => {
        this.isManagingBilling.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to access billing portal');
      },
    });
  }

  /** Delegates to openCustomerPortal to launch the billing portal. */
  openBillingPortal(): void {
    this.openCustomerPortal();
  }

  /** Opens company deletion confirmation dialog. */
  openDeleteCompanyModal(): void {
    this.deleteConfirmationText.set('');
    this.isDeleteCompanyModalOpen.set(true);
  }

  /** Closes company deletion confirmation dialog. */
  closeDeleteCompanyModal(): void {
    this.isDeleteCompanyModalOpen.set(false);
    this.deleteConfirmationText.set('');
  }

  /** Permanently deletes the company workspace and logs out. */
  confirmDeleteCompany(): void {
    if (this.deleteConfirmationText().trim() !== 'DELETE') return;
    this.isDeletingCompany.set(true);
    this.errorMessage.set(null);

    this.api.delete<{ success: boolean; message: string }>('companies/current').subscribe({
      next: () => {
        this.isDeletingCompany.set(false);
        this.closeDeleteCompanyModal();
        this.authService.logout();
        window.location.href = '/register';
      },
      error: (err) => {
        this.isDeletingCompany.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to delete workspace');
      },
    });
  }

  /** Toggles password visibility for a social media credential field. */
  toggleSocialPassword(key: string): void {
    this.showSocialPassword.update((curr) => ({
      ...curr,
      [key]: !curr[key],
    }));
  }

  /** Loads company branches from the backend. */
  loadBranches(): void {
    this.api.get<BranchItem[]>('branches').subscribe({
      next: (data) => this.branches.set(data || []),
      error: () => {},
    });
  }

  /** Opens the modal to create a new office branch. */
  openAddBranchModal(): void {
    this.editingBranchId.set(null);
    const comp = this.authService.currentCompany();
    this.branchForm.reset({
      name: '',
      address: '',
      phone: '',
      timezone: comp?.companyTimezone || comp?.timezone || 'Asia/Karachi',
      currency: comp?.companyCurrency || comp?.currency || 'USD',
      workingHours: {
        enabled: true,
        startTime: '09:00',
        endTime: '18:00',
        enforceLoginRestriction: false,
      },
    });
    this.branchSelectedDays.set([1, 2, 3, 4, 5]);
    this.isAddBranchModalOpen.set(true);
  }

  /** Opens the modal to edit an existing office branch. */
  openEditBranchModal(branch: BranchItem): void {
    this.editingBranchId.set(branch.branchId);
    const comp = this.authService.currentCompany();
    this.branchForm.patchValue({
      name: branch.name,
      address: branch.address,
      phone: branch.phone || '',
      timezone: branch.timezone || comp?.companyTimezone || comp?.timezone || 'Asia/Karachi',
      currency: branch.currency || comp?.companyCurrency || comp?.currency || 'USD',
      workingHours: {
        enabled: branch.workingHours?.enabled ?? true,
        startTime: branch.workingHours?.startTime || '09:00',
        endTime: branch.workingHours?.endTime || '18:00',
        enforceLoginRestriction: branch.workingHours?.enforceLoginRestriction ?? false,
      },
    });
    this.branchSelectedDays.set(branch.workingHours?.workingDays || [1, 2, 3, 4, 5]);
    this.isAddBranchModalOpen.set(true);
  }

  /** Closes the add/edit branch modal. */
  closeAddBranchModal(): void {
    this.isAddBranchModalOpen.set(false);
    this.editingBranchId.set(null);
  }

  /** Toggles a working day in the branch shift schedule. */
  toggleBranchDay(day: number): void {
    const current = this.branchSelectedDays();
    if (current.includes(day)) {
      if (current.length > 1) {
        this.branchSelectedDays.set(current.filter((d) => d !== day));
      }
    } else {
      this.branchSelectedDays.set([...current, day]);
    }
  }

  /** Creates or updates an office branch. */
  saveBranch(): void {
    if (this.branchForm.invalid) return;

    this.isSavingBranch.set(true);
    const formVal = this.branchForm.value;
    const comp = this.authService.currentCompany();
    const payload = {
      name: formVal.name,
      address: formVal.address,
      phone: formVal.phone || undefined,
      timezone: formVal.timezone || comp?.companyTimezone || comp?.timezone || 'Asia/Karachi',
      currency: formVal.currency || comp?.companyCurrency || comp?.currency || 'USD',
      workingHours: {
        enabled: formVal.workingHours?.enabled ?? true,
        startTime: formVal.workingHours?.startTime || '09:00',
        endTime: formVal.workingHours?.endTime || '18:00',
        workingDays: this.branchSelectedDays(),
        enforceLoginRestriction: formVal.workingHours?.enforceLoginRestriction ?? false,
      },
    };

    const branchId = this.editingBranchId();
    if (branchId) {
      this.api.patch<BranchItem>(`branches/${branchId}`, payload).subscribe({
        next: (updated) => {
          this.branches.set(this.branches().map((b) => (b.branchId === branchId ? updated : b)));
          this.isSavingBranch.set(false);
          this.closeAddBranchModal();
          this.authService.loadCurrentUser().subscribe();
        },
        error: (err) => {
          this.isSavingBranch.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to update branch');
        },
      });
    } else {
      this.api.post<BranchItem>('branches', payload).subscribe({
        next: (created) => {
          this.branches.set([...this.branches(), created]);
          this.isSavingBranch.set(false);
          this.closeAddBranchModal();
          this.authService.loadCurrentUser().subscribe();
        },
        error: (err) => {
          this.isSavingBranch.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to create branch');
        },
      });
    }
  }

  /** Deletes an office branch by ID. */
  deleteBranch(branchId: string): void {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    this.api.delete<{ success: boolean }>(`branches/${branchId}`).subscribe({
      next: () => {
        this.branches.set(this.branches().filter((b) => b.branchId !== branchId));
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Failed to delete branch');
      },
    });
  }

  /** Formats an array of day numbers into readable short weekday labels. */
  formatWorkingDays(days?: number[]): string {
    if (!days || !days.length) return 'None';
    const dayNames: { [k: number]: string } = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
    };
    return days.map((d) => dayNames[d] || d).join(', ');
  }

  readonly onboardingForms = signal<OnboardingFormItem[]>([]);
  readonly isFormBuilderModalOpen = signal<boolean>(false);
  readonly isSavingForm = signal<boolean>(false);
  editingFormTemplateId: string | null = null;
  formTitle = '';
  formBranchId = '';
  formDepartmentId = '';
  formIsDefault = false;
  formFields: FormFieldItem[] = [];

  /** Loads custom onboarding form templates from the backend. */
  loadOnboardingForms(): void {
    this.api.get<OnboardingFormItem[]>('employees/onboarding-forms').subscribe({
      next: (res) => this.onboardingForms.set(res || []),
      error: () => {},
    });
  }

  /** Opens the modal to create a new custom onboarding form template. */
  openCreateFormModal(): void {
    this.editingFormTemplateId = null;
    this.formTitle = '';
    this.formBranchId = '';
    this.formDepartmentId = '';
    this.formIsDefault = false;
    this.formFields = [
      { id: 'contact_number', label: 'Emergency Contact Number', type: 'text', required: true, placeholder: '+1 ...' },
      { id: 'resume_doc', label: 'Resume / CV', type: 'file', required: true, placeholder: 'Upload PDF' },
    ];
    this.isFormBuilderModalOpen.set(true);
  }

  /** Opens the modal to edit an existing custom onboarding form template. */
  openEditFormModal(form: OnboardingFormItem): void {
    this.editingFormTemplateId = form.templateId;
    this.formTitle = form.title;
    this.formBranchId = form.branchId || '';
    this.formDepartmentId = form.departmentId || '';
    this.formIsDefault = form.isDefault;
    this.formFields = (form.fields || []).map((f) => ({
      ...f,
      optionsStr: f.options ? f.options.join(', ') : '',
    }));
    this.isFormBuilderModalOpen.set(true);
  }

  /** Closes the custom onboarding form builder modal. */
  closeFormBuilderModal(): void {
    this.isFormBuilderModalOpen.set(false);
    this.editingFormTemplateId = null;
  }

  /** Appends a new custom field row to the onboarding form builder. */
  addCustomField(): void {
    const idx = this.formFields.length + 1;
    this.formFields.push({
      id: `custom_field_${Date.now()}_${idx}`,
      label: `Field #${idx}`,
      type: 'text',
      required: false,
      placeholder: '',
      optionsStr: '',
    });
  }

  /** Removes a custom field row from the onboarding form builder by index. */
  removeCustomField(index: number): void {
    this.formFields.splice(index, 1);
  }

  /** Saves a custom onboarding form template to the backend. */
  saveCustomForm(): void {
    if (!this.formTitle.trim()) return;

    this.isSavingForm.set(true);
    const selectedBranch = this.branches().find((b) => b.branchId === this.formBranchId);
    const selectedDept = this.departments().find((d) => d.departmentId === this.formDepartmentId);

    const processedFields = this.formFields.map((f) => {
      const fieldId = f.id || f.label.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      let options: string[] | undefined;
      if (f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') {
        options = (f.optionsStr || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return {
        id: fieldId,
        label: f.label.trim(),
        type: f.type,
        required: !!f.required,
        placeholder: f.placeholder?.trim() || '',
        options,
      };
    });

    const payload = {
      title: this.formTitle.trim(),
      branchId: this.formBranchId || undefined,
      branchName: selectedBranch?.name || undefined,
      departmentId: this.formDepartmentId || undefined,
      departmentName: selectedDept?.name || undefined,
      isDefault: this.formIsDefault,
      fields: processedFields,
    };

    const req$ = this.editingFormTemplateId
      ? this.api.patch(`employees/onboarding-forms/${this.editingFormTemplateId}`, payload)
      : this.api.post('employees/onboarding-forms', payload);

    req$.subscribe({
      next: () => {
        this.isSavingForm.set(false);
        this.closeFormBuilderModal();
        this.loadOnboardingForms();
      },
      error: () => {
        this.isSavingForm.set(false);
      },
    });
  }

  /** Deletes a custom onboarding form template by ID. */
  deleteCustomForm(templateId: string): void {
    if (!confirm('Are you sure you want to delete this custom onboarding form?')) return;
    this.api.delete(`employees/onboarding-forms/${templateId}`).subscribe({
      next: () => this.loadOnboardingForms(),
      error: () => {},
    });
  }
}
