import { Component, OnInit, inject, signal } from '@angular/core';
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
  template: `
    <div class="space-y-6 w-full">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="page-title">Workspace Settings</h1>
      </div>

      @if (saveSuccess()) {
        <div
          class="p-4 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-sm text-emerald-800 dark:text-emerald-300 flex items-center justify-between"
        >
          <span>Settings saved successfully.</span>
          <button
            type="button"
            (click)="saveSuccess.set(false)"
            class="text-emerald-600 hover:text-emerald-800 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      }

      @if (errorMessage()) {
        <div
          class="p-4 rounded-[8px] bg-red-50 dark:bg-red-950/40 border border-red-200 text-sm text-red-800 dark:text-red-300 flex items-center justify-between"
        >
          <span>{{ errorMessage() }}</span>
          <button
            type="button"
            (click)="errorMessage.set(null)"
            class="text-red-600 hover:text-red-800 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      }

      <div class="w-full">
        <app-tabs
          [tabs]="settingsTabs"
          [activeTab]="activeSection()"
          (activeTabChange)="activeSection.set($event)"
        ></app-tabs>
      </div>

      <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="space-y-6 w-full">
        @if (activeSection() === 'all' || activeSection() === 'profile') {
          <div class="card p-6 space-y-5 w-full">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Organization Profile
              </h3>
            </div>

            <div
              class="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-[8px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80"
            >
              <div
                class="relative w-16 h-16 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
              >
                @if (settingsForm.get('logoUrl')?.value) {
                  <img
                    [src]="settingsForm.get('logoUrl')?.value"
                    alt="Company Logo"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-7 h-7 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
              </div>

              <div class="space-y-1.5 flex-1">
                <div class="flex items-center space-x-3">
                  <label
                    class="cursor-pointer inline-flex items-center px-3.5 py-[10px] rounded-[8px] text-xs font-semibold text-white bg-[#2A65F6] hover:bg-blue-600 transition shadow-sm"
                  >
                    @if (isUploadingLogo()) {
                      <svg
                        class="animate-spin -ml-0.5 mr-2 h-3.5 w-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Uploading...</span>
                    } @else {
                      <span>Upload Logo</span>
                    }
                    <input
                      type="file"
                      (change)="onLogoSelected($event)"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      class="hidden"
                      [disabled]="isUploadingLogo()"
                    />
                  </label>

                  @if (settingsForm.get('logoUrl')?.value) {
                    <button
                      type="button"
                      (click)="removeLogo()"
                      class="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-[10px] transition"
                    >
                      Remove
                    </button>
                  }
                </div>
                @if (logoUploadError()) {
                  <p class="text-xs text-red-600 font-medium">{{ logoUploadError() }}</p>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <app-input
                label="Company Legal Name"
                placeholder="Workiv Technologies"
                [required]="true"
                formControlName="name"
              ></app-input>

              <app-input
                label="Contact Phone"
                placeholder="+1 555-0199"
                formControlName="phone"
              ></app-input>

              <app-input
                label="Corporate Website"
                placeholder="https://workivlab.com"
                formControlName="website"
              ></app-input>

              <app-select
                label="Company Size"
                [options]="companySizeOptions"
                formControlName="companySize"
              ></app-select>

              <app-select
                label="Industry Sector"
                [options]="industryOptions"
                formControlName="industry"
              ></app-select>
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'regional') {
          <div class="card p-6 space-y-5 w-full">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Localization & Currency
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <app-select
                label="Primary Timezone"
                [options]="timezoneOptions"
                formControlName="timezone"
              ></app-select>

              <app-select
                label="Operating Currency"
                [options]="currencyOptions"
                formControlName="currency"
              ></app-select>

              <app-input
                label="City"
                placeholder="Karachi"
                formControlName="city"
              ></app-input>

              <app-input
                label="Postal Code"
                placeholder="75500"
                formControlName="postalCode"
              ></app-input>

              <div class="col-span-full">
                <app-input
                  label="Physical Address"
                  placeholder="123 Tech Boulevard, Suite 400"
                  formControlName="address"
                ></app-input>
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'hours') {
          <div class="card p-6 space-y-5 w-full" formGroupName="workingHours">
            <div
              class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between"
            >
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Working Hours & Shift Compliance
              </h3>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" formControlName="enabled" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A65F6]"
                ></div>
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <app-input
                label="Shift Start Time (HH:MM)"
                placeholder="09:00"
                [required]="true"
                formControlName="startTime"
              ></app-input>

              <app-input
                label="Shift End Time (HH:MM)"
                placeholder="18:00"
                [required]="true"
                formControlName="endTime"
              ></app-input>

              <app-input
                label="Late Grace Period (Minutes)"
                placeholder="15"
                type="number"
                [required]="true"
                formControlName="lateGracePeriodMinutes"
              ></app-input>
            </div>

            <div class="pt-1">
              <app-multi-select
                label="Designated Working Days"
                [options]="daysOfWeek"
                [value]="selectedDays()"
                (valueChange)="selectedDays.set($any($event))"
              ></app-multi-select>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label class="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="loginRestriction"
                  class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]"
                />
                <span class="text-xs font-semibold text-slate-900 dark:text-white">
                  Strict Off-Hours Login Restriction
                </span>
              </label>
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'departments') {
          <div class="card p-6 space-y-5 w-full">
            <div
              class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between"
            >
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Departments
              </h3>
              <app-button size="sm" type="button" (click)="openAddDeptModal()">
                + Add Department
              </app-button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              @for (dept of departments(); track dept.departmentId) {
                <div
                  class="p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div>
                    <h4 class="text-sm font-semibold text-slate-900 dark:text-white">
                      {{ dept.name }}
                    </h4>
                    <p class="text-xs text-slate-400 mt-0.5">
                      {{ dept.employeeCount || 0 }} members
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="deleteDept(dept.departmentId)"
                    class="text-xs text-slate-400 hover:text-red-600 transition p-1"
                    title="Delete department"
                  >
                    ✕
                  </button>
                </div>
              } @empty {
                <div class="col-span-full text-center py-6 text-xs text-slate-400">
                  No departments configured yet.
                </div>
              }
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'branches') {
          <div class="card p-6 space-y-5 w-full">
            <div
              class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between"
            >
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Company Branches
              </h3>
              <app-button size="sm" type="button" (click)="openAddBranchModal()">
                + Add Branch
              </app-button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (branch of branches(); track branch.branchId) {
                <div
                  class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ branch.name }}</h4>
                      <p class="text-xs text-slate-400 mt-0.5">{{ branch.address }}</p>
                    </div>
                    <div class="flex items-center space-x-1">
                      <button
                        type="button"
                        (click)="openEditBranchModal(branch)"
                        class="px-2 py-1 text-xs rounded-[8px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        (click)="deleteBranch(branch.branchId)"
                        class="px-2 py-1 text-xs rounded-[8px] border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span class="text-slate-400 block text-[10px] uppercase font-semibold">Timezone</span>
                      <span class="font-medium text-slate-700 dark:text-slate-300 truncate block">{{ branch.timezone }}</span>
                    </div>
                    <div>
                      <span class="text-slate-400 block text-[10px] uppercase font-semibold">Currency</span>
                      <span class="font-medium text-slate-700 dark:text-slate-300">{{ branch.currency || authService.currentCompany()?.currency || 'USD' }}</span>
                    </div>
                    @if (branch.phone) {
                      <div>
                        <span class="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                        <span class="font-medium text-slate-700 dark:text-slate-300 truncate block">{{ branch.phone }}</span>
                      </div>
                    }
                  </div>

                  @if (branch.workingHours) {
                    <div class="bg-white dark:bg-slate-800/80 p-2.5 rounded-[8px] border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-700 dark:text-slate-200">
                          {{ branch.workingHours.startTime }} - {{ branch.workingHours.endTime }}
                        </span>
                        @if (branch.workingHours.enforceLoginRestriction) {
                          <span class="px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-[#2A65F6]/10 text-[#2A65F6]">
                            Strict Shift
                          </span>
                        } @else {
                          <span class="px-2 py-0.5 rounded-[8px] text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Flexible
                          </span>
                        }
                      </div>
                      <div class="text-[11px] text-slate-400">
                        {{ formatWorkingDays(branch.workingHours.workingDays) }}
                      </div>
                    </div>
                  }
                </div>
              } @empty {
                <div class="col-span-full text-center py-6 text-xs text-slate-400">
                  No branches configured yet.
                </div>
              }
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'subscription') {
          <div class="card p-6 space-y-5 w-full">
            <div
              class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between"
            >
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Billing & Plan
              </h3>
              <app-badge variant="primary">{{ subscription()?.plan || 'FREE_TRIAL' }}</app-badge>
            </div>

            @if (subscription()?.stripeCustomerId) {
              <div class="flex justify-end">
                <app-button
                  type="button"
                  variant="secondary"
                  size="sm"
                  [loading]="isManagingBilling()"
                  (click)="openBillingPortal()"
                >
                  Manage Billing Portal
                </app-button>
              </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @if (subscription()?.plan !== 'PRO') {
                <div
                  class="p-5 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 hover:border-[#2A65F6] transition shadow-sm"
                >
                  <div class="flex items-start justify-between">
                    <h4 class="font-bold text-slate-900 dark:text-white">Pro Tier</h4>
                    <span class="text-lg font-bold text-[#2A65F6]">$49<span class="text-xs text-slate-400">/mo</span></span>
                  </div>
                  <ul class="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <li>• Up to 100 employee accounts</li>
                    <li>• AI Executive Report generation</li>
                    <li>• Advanced attendance audits</li>
                  </ul>
                  <app-button
                    type="button"
                    size="sm"
                    variant="primary"
                    [loading]="isUpgrading() === 'PRO'"
                    (click)="upgradePlan('PRO')"
                  >
                    Upgrade to Pro
                  </app-button>
                </div>
              }

              @if (subscription()?.plan !== 'ULTRA') {
                <div
                  class="p-5 rounded-[8px] border border-[#2A65F6]/30 bg-blue-50/20 dark:bg-blue-950/10 space-y-4 shadow-sm"
                >
                  <div class="flex items-start justify-between">
                    <h4 class="font-bold text-slate-900 dark:text-white">Ultra Unlimited</h4>
                    <span class="text-lg font-bold text-[#2A65F6]">$149<span class="text-xs text-slate-400">/mo</span></span>
                  </div>
                  <ul class="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <li>• Unlimited employees and branches</li>
                    <li>• Multi-region data replication</li>
                    <li>• 24/7 dedicated enterprise support</li>
                  </ul>
                  <app-button
                    type="button"
                    size="sm"
                    variant="primary"
                    [loading]="isUpgrading() === 'ULTRA'"
                    (click)="upgradePlan('ULTRA')"
                  >
                    Upgrade to Ultra
                  </app-button>
                </div>
              }
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'onboarding') {
          <div class="card p-6 space-y-5 w-full">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Onboarding Requirements
              </h3>
            </div>

            <div formGroupName="onboardingConfig" class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <label class="flex items-center space-x-3 p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="requireCnic"
                  class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                />
                <span class="text-xs font-semibold text-slate-900 dark:text-white">Require National ID</span>
              </label>

              <label class="flex items-center space-x-3 p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="requireAddress"
                  class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                />
                <span class="text-xs font-semibold text-slate-900 dark:text-white">Require Address</span>
              </label>

              <label class="flex items-center space-x-3 p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="requireBankDetails"
                  class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                />
                <span class="text-xs font-semibold text-slate-900 dark:text-white">Require Bank Details</span>
              </label>

              <label class="flex items-center space-x-3 p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="allowBranchDepartments"
                  class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                />
                <span class="text-xs font-semibold text-slate-900 dark:text-white">Branch Departments</span>
              </label>

              <label class="flex items-center space-x-3 p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="allowBranchCustomForms"
                  class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                />
                <span class="text-xs font-semibold text-slate-900 dark:text-white">Branch Custom Forms</span>
              </label>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                  Custom Onboarding Forms
                </h4>
                <app-button size="sm" type="button" (click)="openCreateFormModal()">
                  + Create Custom Form
                </app-button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (form of onboardingForms(); track form.templateId) {
                  <div class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center space-x-2">
                          <h5 class="text-sm font-bold text-slate-900 dark:text-white">{{ form.title }}</h5>
                          @if (form.isDefault) {
                            <span class="px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-[#2A65F6]/10 text-[#2A65F6]">
                              DEFAULT
                            </span>
                          }
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">
                          {{ form.branchName ? form.branchName : 'All Branches' }}
                          @if (form.departmentName) {
                            • {{ form.departmentName }}
                          }
                        </p>
                      </div>

                      <div class="flex items-center space-x-1">
                        <button
                          type="button"
                          (click)="openEditFormModal(form)"
                          class="px-2 py-1 text-xs rounded-[8px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          (click)="deleteCustomForm(form.templateId)"
                          class="px-2 py-1 text-xs rounded-[8px] border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-1.5 pt-1">
                      @for (f of form.fields; track f.id) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-[8px] text-[11px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                          <span class="font-medium mr-1">{{ f.label }}</span>
                          <span class="text-[10px] text-slate-400">({{ f.type }})</span>
                        </span>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="col-span-full p-6 text-center rounded-[8px] border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                    No custom onboarding forms created yet.
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'payroll') {
          <div class="space-y-6 w-full" formGroupName="payrollConfig">
            <!-- Studio Header Bar -->
            <div class="card p-6 space-y-5 w-full">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div class="flex items-center space-x-2.5">
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">
                      Salary Slip Studio & Payroll Automation
                    </h3>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2A65F6]/10 text-[#2A65F6]">
                      Template v{{ settingsForm.get('payrollConfig.templateVersion')?.value || 1 }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Design company-wide salary slip layouts, custom earnings/deductions formulas, e-Signatures, Cloudinary PDF archiving, and automated email dispatch.
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2.5">
                  <!-- Mode Switcher: Designer vs Actual Slip Preview -->
                  <div class="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                    <button
                      type="button"
                      (click)="setStudioView('designer')"
                      class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
                      [ngClass]="
                        studioView() === 'designer'
                          ? 'bg-white dark:bg-slate-900 text-[#2A65F6] shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      "
                    >
                      <span>⚙️ Designer</span>
                    </button>
                    <button
                      type="button"
                      (click)="setStudioView('preview')"
                      class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5"
                      [ngClass]="
                        studioView() === 'preview'
                          ? 'bg-white dark:bg-slate-900 text-[#2A65F6] shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      "
                    >
                      <span>👁️ Actual Slip Preview</span>
                    </button>
                  </div>

                  <app-button
                    type="button"
                    variant="secondary"
                    size="sm"
                    [loading]="isPreviewingSlip()"
                    (click)="refreshLiveSlipPreview()"
                    title="Reload live preview with latest settings"
                  >
                    🔄 Refresh
                  </app-button>

                  <app-button
                    type="button"
                    variant="secondary"
                    size="sm"
                    (click)="openSlipLivePreview()"
                    title="Open in fullscreen preview modal"
                  >
                    ↗️ Modal View
                  </app-button>
                </div>
              </div>

              <!-- Phase 1 & 4: Core Payroll Rules, Attendance LOP & Email Automation -->
              <div class="space-y-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Phase 1 & 4 • Payroll Rules, Attendance LOP & Email Automation
                </h4>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <app-select
                    label="Late Fine Type"
                    formControlName="lateFineType"
                    [options]="[
                      { label: 'Percentage (%)', value: 'PERCENTAGE' },
                      { label: 'Fixed Amount', value: 'FIXED_AMOUNT' }
                    ]"
                  ></app-select>
                  <app-input
                    label="Late Fine Rate"
                    type="number"
                    formControlName="lateFineValue"
                  ></app-input>
                  <app-input
                    label="Overtime Multiplier"
                    type="number"
                    formControlName="overtimeMultiplier"
                  ></app-input>
                  <app-input
                    label="Standard Working Days"
                    type="number"
                    formControlName="standardWorkingDays"
                  ></app-input>
                  <app-input
                    label="Salary Pay Day (1 - 31)"
                    type="number"
                    formControlName="salaryPayDay"
                  ></app-input>
                  <app-input
                    label="Default Tax (%)"
                    type="number"
                    formControlName="defaultTaxPercentage"
                  ></app-input>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <!-- Auto Generate Slips -->
                  <label class="flex items-start space-x-3 p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer hover:border-[#2A65F6]/50 transition">
                    <input
                      type="checkbox"
                      formControlName="autoSalarySlipEnabled"
                      class="mt-0.5 rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <div>
                      <span class="text-xs font-bold text-slate-900 dark:text-white block">
                        Auto-Generate Monthly Salary Slips on Pay Day
                      </span>
                      <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Automatically calculates attendance, leaves, custom components, and archives PDFs to Cloudinary on Day {{ settingsForm.get('payrollConfig.salaryPayDay')?.value || 1 }} of each month.
                      </span>
                    </div>
                  </label>

                  <!-- Auto Email Dispatch Toggle -->
                  <label class="flex items-start space-x-3 p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer hover:border-[#2A65F6]/50 transition">
                    <input
                      type="checkbox"
                      formControlName="autoSendEmail"
                      class="mt-0.5 rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <div>
                      <span class="text-xs font-bold text-slate-900 dark:text-white block">
                        Auto-Send Salary Slip Emails to Each Employee
                      </span>
                      <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        When enabled, emails are automatically sent on Pay Day. When disabled, you can preview, customize bonuses/fuel, and send slips one-by-one or in bulk from the Payroll page.
                      </span>
                    </div>
                  </label>

                  <!-- Attendance & LOP Integration -->
                  <label class="flex items-start space-x-3 p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer hover:border-[#2A65F6]/50 transition">
                    <input
                      type="checkbox"
                      formControlName="enableLopDeduction"
                      class="mt-0.5 rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <div>
                      <span class="text-xs font-bold text-slate-900 dark:text-white block">
                        Attendance & Leave LOP (Loss of Pay) Integration
                      </span>
                      <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                        Auto-pulls Present Days, Paid Leaves, and Unpaid Leaves from Attendance & Leave modules and deducts per-day LOP automatically.
                      </span>
                    </div>
                  </label>

                  <!-- Password Protect PDF -->
                  <div class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                    <label class="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        formControlName="passwordProtectPdf"
                        class="mt-0.5 rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                      />
                      <div>
                        <span class="text-xs font-bold text-slate-900 dark:text-white block">
                          Password-Protect Salary Slip PDFs
                        </span>
                        <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                          Include security password rules & hints in employee salary slip emails.
                        </span>
                      </div>
                    </label>
                    @if (settingsForm.get('payrollConfig.passwordProtectPdf')?.value) {
                      <app-select
                        label="PDF Password Rule"
                        formControlName="pdfPasswordRule"
                        [options]="[
                          { label: 'Last 4 Characters of Employee ID', value: 'EMP_ID_LAST4' },
                          { label: 'First 4 Letters of Name (CAPS) + Pay Year', value: 'NAME4_YEAR' }
                        ]"
                      ></app-select>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Phase 2: Template Layout Selection & Show/Hide Fields -->
            <div class="card p-6 space-y-5 w-full">
              <div class="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                    Phase 2 • Template Layout Selection & Field Visibility
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose from 3 print-ready HTML/PDF layouts and toggle which fields appear on generated payslips.
                  </p>
                </div>
              </div>

              <!-- 3 Layout Cards -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                @for (layout of slipLayoutOptions; track layout.id) {
                  <div
                    (click)="selectSlipLayout(layout.id)"
                    class="p-4 rounded-[8px] border-2 cursor-pointer transition space-y-2"
                    [ngClass]="
                      settingsForm.get('payrollConfig.templateLayout')?.value === layout.id
                        ? 'border-[#2A65F6] bg-blue-50/30 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    "
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-900 dark:text-white">{{ layout.title }}</span>
                      @if (settingsForm.get('payrollConfig.templateLayout')?.value === layout.id) {
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2A65F6] text-white">ACTIVE</span>
                      }
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{{ layout.desc }}</p>
                  </div>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Brand Color
                  </label>
                  <div class="flex items-center space-x-2">
                    <input
                      type="color"
                      formControlName="primaryColor"
                      class="h-10 w-14 rounded-[8px] border border-slate-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 p-1"
                    />
                    <input
                      type="text"
                      formControlName="primaryColor"
                      class="flex-1 px-3 py-2 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <app-select
                  label="Net Pay in Words Format"
                  formControlName="numberWordsFormat"
                  [options]="[
                    { label: 'Indian / South Asian (Lakhs & Crores)', value: 'INDIAN_SOUTH_ASIAN' },
                    { label: 'International (Thousands & Millions)', value: 'INTERNATIONAL' }
                  ]"
                ></app-select>

                <app-select
                  label="Header Alignment"
                  formControlName="headerAlignment"
                  [options]="[
                    { label: 'Split (Company Left • Period Right)', value: 'SPLIT' },
                    { label: 'Centered Executive Header', value: 'CENTERED' },
                    { label: 'Left Aligned Stack', value: 'LEFT' }
                  ]"
                ></app-select>
              </div>

              <!-- Show / Hide Fields Grid -->
              <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Show / Hide Payslip Columns & Sections
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  @for (toggle of slipFieldToggles; track toggle.control) {
                    <label class="flex items-center space-x-2.5 p-2.5 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition">
                      <input
                        type="checkbox"
                        [formControlName]="toggle.control"
                        class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                      />
                      <span class="text-xs font-medium text-slate-800 dark:text-slate-200">{{ toggle.label }}</span>
                    </label>
                  }
                </div>
              </div>
            </div>

            <!-- Phase 3: Custom Salary Components & Formula Builder -->
            <div class="card p-6 space-y-5 w-full">
              <div class="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                    Phase 3 • Custom Salary Components & Formula Builder
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure auto-calculated Earnings (HRA, Medical, Fuel, Conveyance) and Deductions (PF, EOBI, Insurance) using fixed amounts, % of base, or custom formulas.
                  </p>
                </div>
                <app-button size="sm" type="button" (click)="openAddSalaryComponentModal()">
                  + Add Salary Component
                </app-button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                @for (comp of salaryComponents(); track comp.id) {
                  <div class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center space-x-2">
                          <h5 class="text-xs font-bold text-slate-900 dark:text-white">{{ comp.name }}</h5>
                          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {{ comp.code }}
                          </span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          @if (comp.calculationType === 'FIXED') {
                            Fixed Amount: <strong>{{ comp.value }}</strong>
                          } @else if (comp.calculationType === 'PERCENTAGE_OF_BASE') {
                            <strong>{{ comp.value }}%</strong> of Base Salary
                          } @else {
                            Formula: <code class="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#2A65F6] font-mono">{{ comp.formula }}</code>
                          }
                        </p>
                      </div>

                      <span
                        class="px-2 py-0.5 rounded-[8px] text-[10px] font-bold"
                        [ngClass]="
                          comp.type === 'EARNING'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        "
                      >
                        {{ comp.type }}
                      </span>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                      <label class="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="comp.enabled"
                          (change)="toggleSalaryComponent(comp.id)"
                          class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                        />
                        <span class="text-slate-600 dark:text-slate-400 font-medium">
                          {{ comp.enabled ? 'Enabled' : 'Disabled' }}
                        </span>
                      </label>

                      <div class="flex items-center space-x-2">
                        <button
                          type="button"
                          (click)="openEditSalaryComponentModal(comp)"
                          class="text-[#2A65F6] hover:underline font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          (click)="removeSalaryComponent(comp.id)"
                          class="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="col-span-full p-6 text-center rounded-[8px] border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                    No custom salary components added yet. Click "+ Add Salary Component" to add HRA, Medical, Fuel Allowance, PF, etc.
                  </div>
                }
              </div>
            </div>

            <!-- Phase 5 & 6: Header/Footer Designer, Signature Upload & Digital e-Sign -->
            <div class="card p-6 space-y-5 w-full">
              <div class="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                  Phase 5 & 6 • Header / Footer Customization, Signature Upload & Digital e-Sign
                </h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize header/footer branding, upload an authorized signature image to Cloudinary, and enable cryptographic e-Sign verification stamps.
                </p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <app-input
                  label="Header Title"
                  placeholder="SALARY SLIP"
                  formControlName="headerTitle"
                ></app-input>
                <app-input
                  label="Header Subtitle"
                  placeholder="Official Monthly Compensation Statement"
                  formControlName="headerSubtitle"
                ></app-input>
                <app-input
                  label="Header Custom Notice / Tagline"
                  placeholder="e.g. Strictly Confidential - HR Department"
                  formControlName="headerCustomNote"
                ></app-input>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <app-input
                  label="Footer Primary Text"
                  placeholder="This is a computer-generated salary slip..."
                  formControlName="footerText"
                ></app-input>
                <app-input
                  label="Footer Confidentiality Disclaimer"
                  placeholder="Confidential — For the named recipient only."
                  formControlName="footerDisclaimer"
                ></app-input>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <app-input
                  label="Authorized Signatory Name"
                  placeholder="e.g. Sarah Jenkins"
                  formControlName="signatoryName"
                ></app-input>
                <app-input
                  label="Signatory Designation / Title"
                  placeholder="e.g. Head of People & Finance"
                  formControlName="signatoryTitle"
                ></app-input>

                <div class="flex flex-col justify-end">
                  <label class="flex items-center space-x-2.5 p-3 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer">
                    <input
                      type="checkbox"
                      formControlName="enableESignStamp"
                      class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <span class="text-xs font-bold text-slate-900 dark:text-white">
                      Enable Digital e-Sign Verification Stamp
                    </span>
                  </label>
                </div>
              </div>

              <!-- Signature Upload Box -->
              <div class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center space-x-4">
                  @if (settingsForm.get('payrollConfig.signatureImageUrl')?.value) {
                    <img
                      [src]="settingsForm.get('payrollConfig.signatureImageUrl')?.value"
                      alt="Authorized Signature"
                      class="h-12 max-w-[160px] object-contain rounded border border-slate-200 dark:border-slate-700 bg-white p-1.5"
                    />
                  } @else {
                    <div class="h-12 w-32 rounded border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] text-slate-400">
                      No Signature
                    </div>
                  }
                  <div>
                    <div class="text-xs font-bold text-slate-900 dark:text-white">Authorized Signature Image</div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload a transparent PNG/JPG signature (stored on Cloudinary and embedded in HTML & PDF slips).
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-2">
                  <label class="px-3.5 py-2 rounded-[8px] bg-[#2A65F6] hover:bg-[#2052cb] text-white text-xs font-semibold cursor-pointer transition">
                    <span>{{ isUploadingSignature() ? 'Uploading...' : 'Upload Signature' }}</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      (change)="onSignatureSelected($event)"
                    />
                  </label>
                  @if (settingsForm.get('payrollConfig.signatureImageUrl')?.value) {
                    <button
                      type="button"
                      (click)="settingsForm.get('payrollConfig.signatureImageUrl')?.setValue('')"
                      class="px-3 py-2 rounded-[8px] border border-red-200 dark:border-red-900/40 text-red-600 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      Clear
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Live Salary Slip Preview Card (Always visible so company can see the actual preview) -->
            <div class="card p-6 space-y-4 w-full bg-slate-50/60 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <div class="flex items-center space-x-2">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📄 Live Salary Slip Preview</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2A65F6]/10 text-[#2A65F6]">
                        Actual Output
                      </span>
                    </h4>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    This is the exact layout, colors, components, and format your employees will see in their email and downloaded PDF.
                  </p>
                </div>

                <div class="flex items-center space-x-2">
                  <app-button
                    type="button"
                    variant="secondary"
                    size="sm"
                    [loading]="isPreviewingSlip()"
                    (click)="refreshLiveSlipPreview()"
                  >
                    🔄 Refresh Preview
                  </app-button>
                  <app-button
                    type="button"
                    variant="primary"
                    size="sm"
                    (click)="openPreviewInNewWindow()"
                  >
                    ↗️ Print / Full View
                  </app-button>
                </div>
              </div>

              <!-- Preview Frame Container -->
              <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-2 sm:p-5 overflow-x-auto min-h-[460px] flex justify-center">
                @if (slipPreviewSafeHtml()) {
                  <div class="w-full max-w-4xl bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800" [innerHTML]="slipPreviewSafeHtml()"></div>
                } @else if (isPreviewingSlip()) {
                  <div class="py-24 flex flex-col items-center justify-center space-y-3">
                    <div class="w-8 h-8 border-2 border-[#2A65F6] border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-xs font-semibold text-slate-400">Rendering live salary slip preview...</span>
                  </div>
                } @else {
                  <div class="py-24 text-center space-y-3">
                    <p class="text-xs text-slate-400">Click below to generate and display the actual live preview.</p>
                    <app-button type="button" size="sm" (click)="refreshLiveSlipPreview()">
                      👁️ Load Live Slip Preview
                    </app-button>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'leavePolicy') {
          <div class="card p-6 space-y-5 w-full">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                  Leave & Time-Off Policy
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure company yearly baseline quota, max monthly leave limits, and custom leave types.
                </p>
              </div>
              <app-button size="sm" type="button" (click)="openAddLeaveTypeModal()">
                + Add Custom Leave Type
              </app-button>
            </div>

            <div formGroupName="leavePolicy" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <app-input
                label="Total Yearly Baseline Quota (Days)"
                type="number"
                placeholder="24"
                formControlName="totalYearlyQuota"
              ></app-input>

              <app-input
                label="Max Monthly Allowed Leaves"
                type="number"
                placeholder="2"
                formControlName="monthlyLimit"
              ></app-input>
            </div>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                Configured Leave Types & Allowances
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                @for (type of leaveTypes(); track type.id) {
                  <div class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 relative">
                    <div class="flex items-start justify-between">
                      <div>
                        <h5 class="text-xs font-bold text-slate-900 dark:text-white">{{ type.name }}</h5>
                        <span class="text-[10px] text-slate-400">ID: {{ type.id }}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded-[8px] text-[10px] font-bold"
                            [class]="type.isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'">
                        {{ type.isPaid ? 'PAID' : 'UNPAID' }}
                      </span>
                    </div>

                    <div class="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                      <div class="flex items-center justify-between">
                        <span>Yearly Quota:</span>
                        <span class="font-bold text-slate-900 dark:text-white">{{ type.quota }} days</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span>Monthly Limit:</span>
                        <span class="font-bold text-slate-900 dark:text-white">{{ type.monthlyLimit ?? 2 }} days</span>
                      </div>
                    </div>

                    <div class="pt-2 flex justify-end">
                      <button
                        type="button"
                        (click)="removeLeaveType(type.id)"
                        class="text-[11px] text-red-600 hover:text-red-700 font-semibold"
                      >
                        Delete Type
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'performer') {
          <div class="card p-6 space-y-5 w-full">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Top Performer Leaderboard
              </h3>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="topPerformerEnabled"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A65F6]"
                ></div>
              </label>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <app-input
                label="Evaluation Day of Month (1 - 31)"
                type="number"
                formControlName="topPerformerEvalDay"
              ></app-input>
            </div>
          </div>
        }

        @if (activeSection() === 'all' || activeSection() === 'social') {
          <div class="card p-6 space-y-5 w-full" formGroupName="socialMedia">
            <div class="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                Social Media Credentials
              </h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                formGroupName="linkedin"
                class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-slate-900 dark:text-white">LinkedIn</span>
                  <label class="flex items-center space-x-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      formControlName="connected"
                      class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <span class="text-slate-600 dark:text-slate-400 font-medium">Connected</span>
                  </label>
                </div>
                <div class="space-y-2.5">
                  <app-input label="Company Username" formControlName="username"></app-input>
                  <app-input label="Access Token" type="password" formControlName="password"></app-input>
                  <app-input label="API Key" type="password" formControlName="apiKey"></app-input>
                </div>
              </div>

              <div
                formGroupName="twitter"
                class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-slate-900 dark:text-white">Twitter / X</span>
                  <label class="flex items-center space-x-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      formControlName="connected"
                      class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <span class="text-slate-600 dark:text-slate-400 font-medium">Connected</span>
                  </label>
                </div>
                <div class="space-y-2.5">
                  <app-input label="Handle / Username" formControlName="username"></app-input>
                  <app-input label="Access Token" type="password" formControlName="password"></app-input>
                  <app-input label="Bearer Token" type="password" formControlName="apiKey"></app-input>
                </div>
              </div>

              <div
                formGroupName="facebook"
                class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-slate-900 dark:text-white">Facebook</span>
                  <label class="flex items-center space-x-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      formControlName="connected"
                      class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <span class="text-slate-600 dark:text-slate-400 font-medium">Connected</span>
                  </label>
                </div>
                <div class="space-y-2.5">
                  <app-input label="Page ID" formControlName="username"></app-input>
                  <app-input label="Page Token" type="password" formControlName="password"></app-input>
                  <app-input label="Secret Key" type="password" formControlName="apiKey"></app-input>
                </div>
              </div>

              <div
                formGroupName="instagram"
                class="p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-slate-900 dark:text-white">Instagram</span>
                  <label class="flex items-center space-x-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      formControlName="connected"
                      class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                    />
                    <span class="text-slate-600 dark:text-slate-400 font-medium">Connected</span>
                  </label>
                </div>
                <div class="space-y-2.5">
                  <app-input label="Instagram Handle" formControlName="username"></app-input>
                  <app-input label="Access Token" type="password" formControlName="password"></app-input>
                  <app-input label="Graph API Key" type="password" formControlName="apiKey"></app-input>
                </div>
              </div>
            </div>
          </div>
        }

        @if (['all', 'profile', 'regional', 'hours', 'onboarding', 'payroll', 'leavePolicy', 'performer', 'social'].includes(activeSection())) {
          <div class="flex items-center justify-end space-x-3">
            <app-button type="submit" [loading]="isSaving()"> Save Configuration </app-button>
          </div>
        }
      </form>

      @if ((activeSection() === 'all' || activeSection() === 'danger') && authService.currentUser()?.isOwner) {
        <div
          class="card p-6 border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full"
        >
          <div>
            <h3 class="text-sm font-bold text-red-700 dark:text-red-400">
              Delete Company Workspace
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently delete this workspace and all associated records.
            </p>
          </div>
          <button
            type="button"
            (click)="openDeleteCompanyModal()"
            class="px-4 py-[10px] rounded-[8px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            Delete Workspace
          </button>
        </div>
      }

      <app-modal
        [isOpen]="isDeleteCompanyModalOpen()"
        title="Delete Company Workspace"
        (closed)="closeDeleteCompanyModal()"
      >
        <div class="space-y-4">
          <div
            class="p-3.5 rounded-[8px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 leading-relaxed"
          >
            You are about to permanently delete
            <strong>{{ authService.currentCompany()?.name || 'this workspace' }}</strong
            >. This action cannot be undone.
          </div>

          <app-input
            label="Type DELETE to confirm"
            [value]="deleteConfirmationText()"
            (input)="deleteConfirmationText.set($any($event.target).value)"
          ></app-input>

          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800"
          >
            <app-button variant="secondary" type="button" (click)="closeDeleteCompanyModal()"
              >Cancel</app-button
            >
            <app-button
              type="button"
              variant="danger"
              [loading]="isDeletingCompany()"
              [disabled]="deleteConfirmationText().trim() !== 'DELETE'"
              (click)="confirmDeleteCompany()"
            >
              Permanently Delete Workspace
            </app-button>
          </div>
        </div>
      </app-modal>

      <app-modal
        [isOpen]="isAddDeptModalOpen()"
        title="Create New Department"
        size="md"
        [showFooter]="true"
        primaryLabel="Save Department"
        secondaryLabel="Cancel"
        [primaryLoading]="isCreatingDept()"
        (primaryAction)="createDept()"
        (secondaryAction)="closeAddDeptModal()"
        (closed)="closeAddDeptModal()"
      >
        <div class="space-y-4 py-1">
          <app-input
            label="Department Name"
            placeholder="e.g. Product Engineering"
            [value]="newDeptName()"
            (input)="newDeptName.set($any($event.target).value)"
          ></app-input>
          <app-input
            label="Department Description"
            placeholder="e.g. Core software design, frontend, and API architecture"
            [value]="newDeptDesc()"
            (input)="newDeptDesc.set($any($event.target).value)"
          ></app-input>
        </div>
      </app-modal>

      <app-modal
        [isOpen]="isAddBranchModalOpen()"
        [title]="editingBranchId() ? 'Edit Office Branch' : 'Add New Office Branch'"
        size="lg"
        [showFooter]="true"
        [primaryLabel]="editingBranchId() ? 'Update Branch' : 'Create Branch'"
        secondaryLabel="Cancel"
        [primaryLoading]="isSavingBranch()"
        (primaryAction)="saveBranch()"
        (secondaryAction)="closeAddBranchModal()"
        (closed)="closeAddBranchModal()"
      >
        <form [formGroup]="branchForm" (ngSubmit)="saveBranch()" class="space-y-4 py-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <app-input
              label="Branch Name"
              placeholder="e.g. New York Regional HQ"
              formControlName="name"
            ></app-input>
            <app-input
              label="Contact Phone"
              placeholder="e.g. +1 (212) 555-0199"
              formControlName="phone"
            ></app-input>
          </div>
          <app-input
            label="Full Physical Address"
            placeholder="e.g. 350 Fifth Ave, Suite 4800, New York, NY 10118"
            formControlName="address"
          ></app-input>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <app-select
              label="Branch Timezone"
              formControlName="timezone"
              [options]="timezoneOptions"
            ></app-select>
            <app-select
              label="Branch Currency"
              formControlName="currency"
              [options]="currencyOptions"
            ></app-select>
          </div>

          <div
            formGroupName="workingHours"
            class="p-4 rounded-[8px] border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Shift Schedule
              </span>
              <app-checkbox
                [checked]="branchForm.get('workingHours.enabled')?.value"
                (checkedChange)="branchForm.get('workingHours.enabled')?.setValue($event)"
                label="Shift Active"
              ></app-checkbox>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <app-input label="Start Time" formControlName="startTime"></app-input>
              <app-input label="End Time" formControlName="endTime"></app-input>
            </div>

            <app-multi-select
              label="Operational Working Days"
              [options]="daysOfWeek"
              [value]="branchSelectedDays()"
              (valueChange)="branchSelectedDays.set($any($event))"
            ></app-multi-select>

            <div class="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <app-checkbox
                [checked]="branchForm.get('workingHours.enforceLoginRestriction')?.value"
                (checkedChange)="branchForm.get('workingHours.enforceLoginRestriction')?.setValue($event)"
                label="Enforce strict login restriction during off-shift hours"
              ></app-checkbox>
            </div>
          </div>
        </form>
      </app-modal>

      <app-modal
        [isOpen]="isFormBuilderModalOpen()"
        [title]="editingFormTemplateId ? 'Edit Onboarding Form' : 'Create Custom Onboarding Form'"
        [showFooter]="true"
        [primaryLabel]="editingFormTemplateId ? 'Save Changes' : 'Create Form'"
        secondaryLabel="Cancel"
        [primaryLoading]="isSavingForm()"
        [primaryDisabled]="!formTitle.trim()"
        (primaryAction)="saveCustomForm()"
        (secondaryAction)="closeFormBuilderModal()"
        (closed)="closeFormBuilderModal()"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <app-input
              label="Form Title"
              [value]="formTitle"
              (input)="formTitle = $any($event.target).value"
            ></app-input>
            <app-select
              label="Branch Scope"
              [(ngModel)]="formBranchId"
              [options]="branchScopeOptions()"
            ></app-select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <app-select
              label="Department Scope"
              [(ngModel)]="formDepartmentId"
              [options]="departmentScopeOptions()"
            ></app-select>
            <div class="flex items-center pt-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="formIsDefault"
                  class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                />
                <span class="text-xs font-semibold text-slate-900 dark:text-white">Default Form</span>
              </label>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-500">Custom Fields</label>
              <button
                type="button"
                (click)="addCustomField()"
                class="text-xs text-[#2A65F6] hover:underline font-semibold"
              >
                + Add Field
              </button>
            </div>

            <div class="space-y-3">
              @for (field of formFields; track $index) {
                <div class="p-3.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Field #{{ $index + 1 }}</span>
                    <button
                      type="button"
                      (click)="removeCustomField($index)"
                      class="text-red-500 hover:text-red-700 text-xs font-semibold"
                    >
                      ✕ Remove
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="sm:col-span-2">
                      <app-input
                        label="Field Label"
                        [value]="field.label"
                        (input)="field.label = $any($event.target).value"
                      ></app-input>
                    </div>
                    <div>
                      <app-select
                        label="Field Type"
                        [(ngModel)]="field.type"
                        [options]="[
                          { label: 'Text Input', value: 'text' },
                          { label: 'Numeric', value: 'number' },
                          { label: 'Multi-line Text', value: 'textarea' },
                          { label: 'Dropdown Select', value: 'select' },
                          { label: 'Radio Options', value: 'radio' },
                          { label: 'Checkbox Toggle', value: 'checkbox' },
                          { label: 'Date Picker', value: 'date' },
                          { label: 'File Upload', value: 'file' }
                        ]"
                      ></app-select>
                    </div>
                  </div>

                  @if (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') {
                    <app-input
                      label="Options (comma-separated)"
                      [value]="field.optionsStr || ''"
                      (input)="field.optionsStr = $any($event.target).value"
                    ></app-input>
                  }

                  <div class="flex items-center justify-between pt-1 gap-4">
                    <div class="flex-1">
                      <app-input
                        label="Placeholder"
                        [value]="field.placeholder || ''"
                        (input)="field.placeholder = $any($event.target).value"
                      ></app-input>
                    </div>

                    <label class="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="field.required"
                        class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
                      />
                      <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Required</span>
                    </label>
                  </div>
                </div>
              } @empty {
                <div class="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-[8px]">
                  No custom fields added yet.
                </div>
              }
            </div>
          </div>
        </div>
      </app-modal>

      <app-modal
        [isOpen]="isAddLeaveTypeModalOpen()"
        title="Add Custom Leave Type"
        [showFooter]="true"
        primaryLabel="Add Leave Type"
        secondaryLabel="Cancel"
        [primaryDisabled]="!newLeaveTypeName().trim()"
        (primaryAction)="addLeaveType()"
        (secondaryAction)="closeAddLeaveTypeModal()"
        (closed)="closeAddLeaveTypeModal()"
      >
        <div class="space-y-4">
          <app-input
            label="Leave Type Name"
            placeholder="e.g. Maternity Leave, Bereavement Leave, Paternity Leave"
            [value]="newLeaveTypeName()"
            (input)="newLeaveTypeName.set($any($event.target).value)"
          ></app-input>

          <div class="grid grid-cols-2 gap-4">
            <app-input
              label="Yearly Quota (Days)"
              type="number"
              [value]="newLeaveTypeQuota()"
              (input)="newLeaveTypeQuota.set($any($event.target).value)"
            ></app-input>

            <app-input
              label="Monthly Limit (Days)"
              type="number"
              [value]="newLeaveTypeMonthlyLimit()"
              (input)="newLeaveTypeMonthlyLimit.set($any($event.target).value)"
            ></app-input>
          </div>

          <div class="pt-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                [checked]="newLeaveTypeIsPaid()"
                (change)="newLeaveTypeIsPaid.set($any($event.target).checked)"
                class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
              />
              <span class="text-xs font-semibold text-slate-900 dark:text-white">Paid Leave</span>
            </label>
          </div>
        </div>
      </app-modal>

      <!-- Phase 3: Add / Edit Custom Salary Component & Formula Builder Modal -->
      <app-modal
        [isOpen]="isSalaryComponentModalOpen()"
        [title]="editingSalaryCompId() ? 'Edit Salary Component & Formula' : 'Add Custom Salary Component'"
        size="lg"
        [showFooter]="true"
        [primaryLabel]="editingSalaryCompId() ? 'Update Component' : 'Add Component'"
        secondaryLabel="Cancel"
        [primaryDisabled]="!compName().trim()"
        (primaryAction)="saveSalaryComponent()"
        (secondaryAction)="closeSalaryComponentModal()"
        (closed)="closeSalaryComponentModal()"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <app-input
                label="Component Name"
                placeholder="e.g. House Rent Allowance, Fuel Allowance, Provident Fund"
                [value]="compName()"
                (input)="compName.set($any($event.target).value)"
              ></app-input>
            </div>
            <app-input
              label="Short Code"
              placeholder="e.g. HRA, FUEL, PF"
              [value]="compCode()"
              (input)="compCode.set($any($event.target).value)"
            ></app-input>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <app-select
              label="Component Type"
              [ngModel]="compType()"
              (ngModelChange)="compType.set($event)"
              [options]="[
                { label: 'Earning (+ Adds to Gross Pay)', value: 'EARNING' },
                { label: 'Deduction (- Subtracts from Pay)', value: 'DEDUCTION' }
              ]"
            ></app-select>

            <app-select
              label="Calculation Method"
              [ngModel]="compCalcType()"
              (ngModelChange)="compCalcType.set($event)"
              [options]="[
                { label: 'Percentage of Base Salary (%)', value: 'PERCENTAGE_OF_BASE' },
                { label: 'Fixed Monthly Amount', value: 'FIXED' },
                { label: 'Dynamic Formula Expression', value: 'FORMULA' }
              ]"
            ></app-select>
          </div>

          @if (compCalcType() === 'FIXED' || compCalcType() === 'PERCENTAGE_OF_BASE') {
            <app-input
              [label]="compCalcType() === 'PERCENTAGE_OF_BASE' ? 'Percentage of Base Salary (%)' : 'Fixed Monthly Amount'"
              type="number"
              [value]="compValue()"
              (input)="compValue.set($any($event.target).value)"
            ></app-input>
          } @else {
            <div class="space-y-2.5 p-4 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
              <app-input
                label="Formula Expression"
                placeholder="e.g. BASE * 0.15 + PRESENT_DAYS * 10"
                [value]="compFormula()"
                (input)="compFormula.set($any($event.target).value)"
              ></app-input>
              <div>
                <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                  Click a variable or operator to insert into your formula:
                </span>
                <div class="flex flex-wrap gap-1.5">
                  @for (token of formulaVariables; track token) {
                    <button
                      type="button"
                      (click)="appendFormulaToken(token)"
                      class="px-2 py-1 rounded text-[11px] font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#2A65F6] hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                    >
                      {{ token }}
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          <div class="flex items-center space-x-6 pt-2">
            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                [checked]="compIsTaxable()"
                (change)="compIsTaxable.set($any($event.target).checked)"
                class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
              />
              <span class="text-xs font-semibold text-slate-900 dark:text-white">Taxable Component</span>
            </label>

            <label class="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                [checked]="compEnabled()"
                (change)="compEnabled.set($any($event.target).checked)"
                class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]/20"
              />
              <span class="text-xs font-semibold text-slate-900 dark:text-white">Active on Payslips</span>
            </label>
          </div>
        </div>
      </app-modal>

      <!-- Live Salary Slip HTML Preview Modal -->
      <app-modal
        [isOpen]="isSlipPreviewModalOpen()"
        title="Live Salary Slip Studio Preview (HTML → PDF Engine)"
        size="xl"
        [showFooter]="true"
        primaryLabel="Open Printable View"
        secondaryLabel="Close Preview"
        (primaryAction)="openPreviewInNewWindow()"
        (secondaryAction)="isSlipPreviewModalOpen.set(false)"
        (closed)="isSlipPreviewModalOpen.set(false)"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-[8px]">
            <span>
              Rendered as live HTML first using your current studio configuration before PDF conversion.
            </span>
            <span class="font-bold text-[#2A65F6]">
              Layout: {{ settingsForm.get('payrollConfig.templateLayout')?.value || 'MODERN_EXECUTIVE' }}
            </span>
          </div>
          <div class="border border-slate-200 dark:border-slate-700 rounded-[8px] overflow-hidden bg-slate-100 dark:bg-slate-950 max-h-[68vh] overflow-y-auto p-3">
            @if (slipPreviewSafeHtml()) {
              <div class="bg-white rounded shadow-sm overflow-hidden" [innerHTML]="slipPreviewSafeHtml()"></div>
            } @else {
              <div class="py-12 text-center text-xs text-slate-400">Generating live HTML preview...</div>
            }
          </div>
        </div>
      </app-modal>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

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
  readonly isAddBranchModalOpen = signal<boolean>(false);
  readonly editingBranchId = signal<string | null>(null);
  readonly isSavingBranch = signal<boolean>(false);
  readonly branchSelectedDays = signal<number[]>([1, 2, 3, 4, 5]);
  readonly showSocialPassword = signal<{ [key: string]: boolean }>({});

  readonly subscription = signal<WorkspaceSubscription | null>(null);
  readonly isUpgrading = signal<string | null>(null);
  readonly isManagingBilling = signal<boolean>(false);

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
      allowBranchDepartments: [true],
      allowBranchCustomForms: [true],
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
            allowBranchDepartments: comp.onboardingConfig?.allowBranchDepartments ?? true,
            allowBranchCustomForms: comp.onboardingConfig?.allowBranchCustomForms ?? true,
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
