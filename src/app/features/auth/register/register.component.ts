import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { AppInputComponent } from '../../../shared/components/input/input.component';
import {
  AppSelectComponent,
  SelectOption,
} from '../../../shared/components/select/select.component';
import { AppButtonComponent } from '../../../shared/components/button/button.component';
import { AppBadgeComponent } from '../../../shared/components/badge/badge.component';
import { AppAuthSliderComponent } from '../../../shared/components/auth-slider/auth-slider.component';
import { AppOtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';

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
  selector: 'app-register',
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
      <!-- Left Side: Interactive Auth Slider with Brand Linear Gradient -->
      <app-auth-slider
        class="hidden lg:flex lg:w-1/2 bg-[#2A65F6] min-h-screen min-h-[100dvh]"
        [isInvitation]="isEmployeeInvitation()"
        [companyName]="invitationDetails()?.companyName"
      ></app-auth-slider>

      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto min-h-screen min-h-[100dvh]">
        <div class="w-full max-w-xl space-y-8 my-auto">
          @if (isEmployeeInvitation()) {
            @if (invitationLoading()) {
              <div class="py-16 text-center space-y-3">
                <div
                  class="animate-spin w-10 h-10 border-4 border-[#2A65F6] border-t-transparent rounded-full mx-auto"
                ></div>
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Verifying your invitation link...
                </p>
                <p class="text-xs text-slate-400">Connecting to corporate workspace directory</p>
              </div>
            } @else if (invitationError()) {
              <div
                class="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 space-y-4 text-center"
              >
                <div
                  class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 flex items-center justify-center mx-auto text-xl font-bold"
                >
                  ✕
                </div>
                <div>
                  <h3 class="text-base font-semibold text-red-900 dark:text-red-200">
                    Invitation Expired or Invalid
                  </h3>
                  <p class="text-xs text-red-700 dark:text-red-300 mt-1">
                    {{ invitationError() }}
                  </p>
                </div>
                <div class="pt-2">
                  <a
                    routerLink="/auth/login"
                    class="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2A65F6] hover:bg-blue-600 transition"
                  >
                    Go to Sign In
                  </a>
                </div>
              </div>
            } @else if (invitationDetails()) {
              <div>
                <div class="mb-6">
                  <app-badge variant="primary">Team Invitation</app-badge>
                  <h2 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    Accept Invitation & Activate Account
                  </h2>
                  <p class="text-sm text-slate-500 mt-1">
                    You have been invited by
                    <strong class="text-slate-800 dark:text-slate-200">{{
                      invitationDetails()!.companyName
                    }}</strong
                    >.
                  </p>
                </div>

                <div
                  class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 mb-6 flex items-center justify-between"
                >
                  <div>
                    <span class="text-xs text-slate-400">Assigned Designation</span>
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">
                      {{ invitationDetails()!.designation }}
                    </p>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-slate-400">Department</span>
                    <p class="text-sm font-semibold text-slate-900 dark:text-white">
                      {{ invitationDetails()!.departmentName }}
                    </p>
                  </div>
                </div>

                @if (employeeErrorMessage()) {
                  <div
                    class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-800 dark:text-red-300 mb-5"
                  >
                    {{ employeeErrorMessage() }}
                  </div>
                }

                <form
                  [formGroup]="employeeForm"
                  (ngSubmit)="submitEmployeeActivation()"
                  class="space-y-5"
                >
                  <div>
                    <label
                      class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Corporate Email (Assigned)
                    </label>
                    <input
                      type="text"
                      [value]="invitationDetails()!.email"
                      disabled
                      class="input-control bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-80"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <app-input
                      label="First Name"
                      placeholder="Alex"
                      [required]="true"
                      formControlName="firstName"
                    ></app-input>

                    <app-input
                      label="Last Name"
                      placeholder="Smith"
                      [required]="true"
                      formControlName="lastName"
                    ></app-input>
                  </div>

                  <app-input
                    label="Date of Birth"
                    type="date"
                    placeholder="YYYY-MM-DD"
                    [required]="false"
                    formControlName="dateOfBirth"
                  ></app-input>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <app-input
                      label="National ID / CNIC"
                      placeholder="42101-1234567-1"
                      [required]="invitationDetails()?.onboardingConfig?.requireCnic || false"
                      formControlName="cnic"
                    ></app-input>

                    <app-input
                      label="Residential Address"
                      placeholder="Street, City, Postal Code"
                      [required]="invitationDetails()?.onboardingConfig?.requireAddress || false"
                      formControlName="address"
                    ></app-input>
                  </div>

                  <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-900 dark:text-white">Bank Account Details</span>
                      @if (invitationDetails()?.onboardingConfig?.requireBankDetails) {
                        <span class="text-[10px] font-bold text-red-500 uppercase tracking-wider">Required by Company</span>
                      } @else {
                        <span class="text-[10px] text-slate-400">Optional</span>
                      }
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <app-input
                        label="Bank Name"
                        placeholder="e.g. Standard Chartered"
                        formControlName="bankName"
                      ></app-input>
                      <app-input
                        label="Account Title"
                        placeholder="Name on account"
                        formControlName="accountTitle"
                      ></app-input>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <app-input
                        label="Account Number"
                        placeholder="0123456789"
                        formControlName="accountNumber"
                      ></app-input>
                      <app-input
                        label="IBAN"
                        placeholder="PK36SCBL0000..."
                        formControlName="iban"
                      ></app-input>
                    </div>
                  </div>

                  <app-select
                    label="Your Physical Country / Region"
                    formControlName="userLocationRegion"
                    [options]="countryOptions"
                    [required]="true"
                    helperText="Your profile and activity logs reflect your physical location within the company workspace"
                  ></app-select>

                  @if (invitationDetails()?.customFieldsTemplate && invitationDetails()!.customFieldsTemplate!.length > 0) {
                    <div class="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span>📋</span>
                          <span>Company Required Onboarding Information</span>
                        </span>
                        <span class="text-[10px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">Custom Form</span>
                      </div>

                      @for (field of invitationDetails()!.customFieldsTemplate!; track (field.id || $index)) {
                        <div class="space-y-1">
                          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {{ field.label }}
                            @if (field.required) {
                              <span class="text-red-500">*</span>
                            }
                          </label>

                          @if (field.type === 'text') {
                            <input
                              type="text"
                              [placeholder]="field.placeholder || ''"
                              [value]="customFieldValues()[field.id] || ''"
                              (input)="onCustomFieldChange(field.id, $any($event.target).value)"
                              class="input-control"
                            />
                          } @else if (field.type === 'number') {
                            <input
                              type="number"
                              [placeholder]="field.placeholder || ''"
                              [value]="customFieldValues()[field.id] || ''"
                              (input)="onCustomFieldChange(field.id, $any($event.target).value)"
                              class="input-control"
                            />
                          } @else if (field.type === 'date') {
                            <input
                              type="date"
                              [value]="customFieldValues()[field.id] || ''"
                              (input)="onCustomFieldChange(field.id, $any($event.target).value)"
                              class="input-control"
                            />
                          } @else if (field.type === 'textarea') {
                            <textarea
                              rows="3"
                              [placeholder]="field.placeholder || ''"
                              [value]="customFieldValues()[field.id] || ''"
                              (input)="onCustomFieldChange(field.id, $any($event.target).value)"
                              class="input-control resize-none"
                            ></textarea>
                          } @else if (field.type === 'select') {
                            <select
                              [value]="customFieldValues()[field.id] || ''"
                              (change)="onCustomFieldChange(field.id, $any($event.target).value)"
                              class="input-control"
                            >
                              <option value="">Select an option...</option>
                              @for (opt of field.options; track opt) {
                                <option [value]="opt">{{ opt }}</option>
                              }
                            </select>
                          } @else if (field.type === 'radio') {
                            <div class="flex flex-wrap gap-4 pt-1">
                              @for (opt of field.options; track opt) {
                                <label class="inline-flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                  <input
                                    type="radio"
                                    [name]="field.id"
                                    [value]="opt"
                                    [checked]="customFieldValues()[field.id] === opt"
                                    (change)="onCustomFieldChange(field.id, opt)"
                                    class="text-[#2A65F6] focus:ring-[#2A65F6]"
                                  />
                                  <span>{{ opt }}</span>
                                </label>
                              }
                            </div>
                          } @else if (field.type === 'checkbox') {
                            <div class="space-y-2 pt-1">
                              @for (opt of field.options; track opt) {
                                <label class="inline-flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    [checked]="isCheckboxOptionSelected(field.id, opt)"
                                    (change)="toggleCheckboxOption(field.id, opt)"
                                    class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]"
                                  />
                                  <span>{{ opt }}</span>
                                </label>
                              }
                            </div>
                          } @else if (field.type === 'file') {
                            <div class="space-y-2">
                              <label class="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#2A65F6] rounded-xl cursor-pointer bg-white dark:bg-slate-800 transition">
                                <span class="text-xs text-slate-500 dark:text-slate-400">
                                  @if (uploadingFieldId() === field.id) {
                                    Uploading attachment...
                                  } @else {
                                    Click to choose or drop document
                                  }
                                </span>
                                <input
                                  type="file"
                                  class="hidden"
                                  (change)="onFileUpload(field.id, $event)"
                                />
                              </label>

                              @for (doc of getUploadedDocsForField(field.id); track doc.url) {
                                <div class="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200">
                                  <span class="truncate max-w-[200px]">📄 {{ doc.name }}</span>
                                  <span class="text-[10px] font-semibold text-emerald-600">Attached</span>
                                </div>
                              }
                            </div>
                          } @else {
                            <input
                              type="text"
                              [placeholder]="field.placeholder || ''"
                              [value]="customFieldValues()[field.id] || ''"
                              (input)="onCustomFieldChange(field.id, $any($event.target).value)"
                              class="input-control"
                            />
                          }

                          @if (field.helperText) {
                            <p class="text-[11px] text-slate-400">{{ field.helperText }}</p>
                          }
                        </div>
                      }
                    </div>
                  }

                  <app-input
                    label="Create Account Password"
                    type="password"
                    placeholder="At least 8 characters"
                    [required]="true"
                    formControlName="password"
                  ></app-input>

                  <app-input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat your password"
                    [required]="true"
                    formControlName="confirmPassword"
                  ></app-input>

                  <div class="pt-2">
                    <app-button
                      type="submit"
                      [loading]="isSubmittingEmployee()"
                      [disabled]="employeeForm.invalid"
                      class="w-full"
                    >
                      <span>Activate Account & Enter Workspace</span>
                      <span class="ml-1.5">&rarr;</span>
                    </app-button>
                  </div>
                </form>
              </div>
            }
          } @else if (isVerifying()) {
            <div class="space-y-6 text-center">
              <div
                class="w-12 h-12 rounded-2xl bg-blue-50 text-[#2A65F6] flex items-center justify-center mx-auto text-xl"
              >
                ✉️
              </div>
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">
                  Verify Your Corporate Email
                </h2>
                <p class="text-sm text-slate-500 mt-1">
                  We've dispatched a 6-digit confirmation code to
                  <strong class="text-slate-800 dark:text-slate-200">{{
                    verificationEmail()
                  }}</strong
                  >.
                </p>
              </div>

              @if (verificationError()) {
                <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {{ verificationError() }}
                </div>
              }

              @if (verificationSuccess()) {
                <div
                  class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700"
                >
                  {{ verificationSuccess() }}
                </div>
              }

              <div class="my-6">
                <app-otp-input
                  [length]="6"
                  [value]="verificationCodeInput()"
                  (valueChange)="verificationCodeInput.set($event)"
                  (completed)="submitVerification()"
                ></app-otp-input>
              </div>

              <app-button
                type="button"
                (click)="submitVerification()"
                [loading]="isSubmittingVerification()"
                [disabled]="verificationCodeInput().length !== 6"
                class="w-full"
              >
                Confirm & Launch Workspace &rarr;
              </app-button>

              <div class="pt-2">
                <button
                  type="button"
                  (click)="resendCode()"
                  [disabled]="resendCooldown() > 0"
                  class="text-xs text-[#2A65F6] hover:underline font-semibold disabled:text-slate-400"
                >
                  {{
                    resendCooldown() > 0
                      ? 'Resend code in ' + resendCooldown() + 's'
                      : 'Resend Code'
                  }}
                </button>
              </div>
            </div>
          } @else {
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-[#2A65F6] uppercase tracking-wider"
                  >Step {{ currentStep() }} of 5</span
                >
                <span class="text-xs text-slate-400">{{ getProgressPercent() }}% completed</span>
              </div>
              <div
                class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-6 overflow-hidden"
              >
                <div
                  class="bg-[#2A65F6] h-1.5 rounded-full transition-all duration-300"
                  [style.width.%]="getProgressPercent()"
                ></div>
              </div>
            </div>

            @if (errorMessage()) {
              <div
                class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-800 dark:text-red-300"
              >
                {{ errorMessage() }}
              </div>
            }

            <form [formGroup]="form" class="space-y-6">
              @if (currentStep() === 1) {
                <div class="space-y-5">
                  <div class="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                      Organization &amp; Administrator Account
                    </h3>
                    <p class="text-xs text-slate-500">
                      Configure your company identity and root owner credentials.
                    </p>
                  </div>

                  <div
                    class="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200"
                  >
                    <div
                      class="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0"
                    >
                      @if (uploadedLogoUrl()) {
                        <img [src]="uploadedLogoUrl()" class="w-full h-full object-cover" />
                      } @else {
                        <span class="text-2xl">🏢</span>
                      }
                    </div>
                    <div class="flex-1 text-xs">
                      <label
                        class="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2A65F6] hover:bg-blue-600 transition"
                      >
                        @if (isUploadingLogo()) {
                          <span>Uploading...</span>
                        } @else {
                          <span>Upload Workspace Logo</span>
                        }
                        <input
                          type="file"
                          (change)="onLogoFileSelected($event)"
                          accept="image/*"
                          class="hidden"
                          [disabled]="isUploadingLogo()"
                        />
                      </label>
                      <p class="text-slate-400 mt-1">Optional. PNG, SVG, or JPG (max 5MB).</p>
                    </div>
                  </div>

                  <app-input
                    label="Company Legal Name"
                    placeholder="Workiv Technologies"
                    [required]="true"
                    formControlName="companyName"
                  ></app-input>

                  <div class="grid grid-cols-2 gap-4">
                    <app-input
                      label="Admin First Name"
                      placeholder="Marcus"
                      [required]="true"
                      formControlName="firstName"
                    ></app-input>

                    <app-input
                      label="Admin Last Name"
                      placeholder="Vance"
                      [required]="true"
                      formControlName="lastName"
                    ></app-input>
                  </div>

                  <app-input
                    label="Corporate Email"
                    type="email"
                    placeholder="marcus@workivlab.com"
                    [required]="true"
                    formControlName="email"
                  ></app-input>

                  <app-input
                    label="Root Password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    [required]="true"
                    formControlName="password"
                  ></app-input>
                </div>
              }

              @if (currentStep() === 2) {
                <div class="space-y-5">
                  <div class="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                      Physical Address
                    </h3>
                    <p class="text-xs text-slate-500">
                      Corporate location and registration details.
                    </p>
                  </div>

                  <app-select
                    label="Country"
                    [options]="countryOptions"
                    [required]="true"
                    formControlName="country"
                  ></app-select>

                  <div class="grid grid-cols-2 gap-4">
                    <app-input
                      label="City"
                      placeholder="Karachi"
                      [showOptional]="true"
                      formControlName="city"
                    ></app-input>
                    <app-input
                      label="Postal Code"
                      placeholder="75500"
                      [showOptional]="true"
                      formControlName="postalCode"
                    ></app-input>
                  </div>

                  <app-input
                    label="Address"
                    placeholder="Suite 400, Tech Park"
                    [showOptional]="true"
                    formControlName="address"
                  ></app-input>
                </div>
              }

              @if (currentStep() === 3) {
                <div class="space-y-5">
                  <div class="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                      Preferences &amp; Localization
                    </h3>
                    <p class="text-xs text-slate-500">Timezone and fiscal currency baseline.</p>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <app-select
                      label="Timezone"
                      [options]="timezoneOptions"
                      [required]="true"
                      formControlName="timezone"
                    ></app-select>
                    <app-select
                      label="Currency"
                      [options]="currencyOptions"
                      [required]="true"
                      formControlName="currency"
                    ></app-select>
                  </div>
                </div>
              }

              @if (currentStep() === 4) {
                <div class="space-y-5">
                  <div class="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                      Select Workspace Plan
                    </h3>
                    <p class="text-xs text-slate-500">
                      Choose a plan. Paid plans integrate with secure Stripe billing.
                    </p>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div
                      (click)="setPlan('FREE_TRIAL')"
                      [class]="
                        selectedPlan() === 'FREE_TRIAL'
                          ? 'border-[#2A65F6] bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      "
                      class="p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between"
                    >
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs font-semibold text-slate-500">Trial</span>
                          @if (selectedPlan() === 'FREE_TRIAL') {
                            <span class="w-2.5 h-2.5 rounded-full bg-[#2A65F6]"></span>
                          }
                        </div>
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">Free Trial</h4>
                        <div class="mt-2">
                          <span class="text-2xl font-extrabold text-slate-900 dark:text-white"
                            >$0</span
                          >
                          <span class="text-[11px] text-slate-500">/ 14 days</span>
                        </div>
                        <ul class="text-[11px] text-slate-500 mt-3 space-y-1">
                          <li>• Up to 10 employees</li>
                          <li>• Tasks &amp; Attendance</li>
                          <li>• No card required</li>
                        </ul>
                      </div>
                    </div>

                    <div
                      (click)="setPlan('PRO')"
                      [class]="
                        selectedPlan() === 'PRO'
                          ? 'border-[#2A65F6] bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      "
                      class="p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between relative"
                    >
                      <span
                        class="absolute -top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2A65F6] text-white"
                      >
                        Popular
                      </span>
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs font-semibold text-blue-600">Pro Team</span>
                          @if (selectedPlan() === 'PRO') {
                            <span class="w-2.5 h-2.5 rounded-full bg-[#2A65F6]"></span>
                          }
                        </div>
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">Pro Plan</h4>
                        <div class="mt-2">
                          <span class="text-2xl font-extrabold text-slate-900 dark:text-white"
                            >$29</span
                          >
                          <span class="text-[11px] text-slate-500">/ month</span>
                        </div>
                        <ul class="text-[11px] text-slate-500 mt-3 space-y-1">
                          <li>• Up to 50 employees</li>
                          <li>• Granular Permissions</li>
                          <li>• Email Broadcasts</li>
                          <li>• Stripe Checkout</li>
                        </ul>
                      </div>
                    </div>

                    <div
                      (click)="setPlan('ULTRA')"
                      [class]="
                        selectedPlan() === 'ULTRA'
                          ? 'border-[#2A65F6] bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      "
                      class="p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between"
                    >
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-xs font-semibold text-indigo-600">Enterprise</span>
                          @if (selectedPlan() === 'ULTRA') {
                            <span class="w-2.5 h-2.5 rounded-full bg-[#2A65F6]"></span>
                          }
                        </div>
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white">
                          Ultra Enterprise
                        </h4>
                        <div class="mt-2">
                          <span class="text-2xl font-extrabold text-slate-900 dark:text-white"
                            >$99</span
                          >
                          <span class="text-[11px] text-slate-500">/ month</span>
                        </div>
                        <ul class="text-[11px] text-slate-500 mt-3 space-y-1">
                          <li>• Unlimited members</li>
                          <li>• Gemini AI reports</li>
                          <li>• Dedicated database shard</li>
                          <li>• Stripe Checkout</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  @if (selectedPlan() !== 'FREE_TRIAL') {
                    <div
                      class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 text-xs text-blue-800 dark:text-blue-300 flex items-center space-x-2"
                    >
                      <span>💳</span>
                      <span
                        >Stripe Payment: You will be redirected to secure Stripe Checkout upon
                        completing email verification.</span
                      >
                    </div>
                  }
                </div>
              }

              @if (currentStep() === 5) {
                <div class="space-y-5">
                  <div class="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white">
                      Review &amp; Confirm
                    </h3>
                    <p class="text-xs text-slate-500">
                      Verify details before generating workspace cluster.
                    </p>
                  </div>

                  <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 text-xs">
                    <div class="flex justify-between">
                      <span class="text-slate-500">Company Name:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200">{{
                        form.get('companyName')?.value
                      }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500">Admin Email:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200">{{
                        form.get('email')?.value
                      }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500">Country:</span>
                      <span class="font-semibold text-slate-800 dark:text-slate-200"
                        >{{ getSelectedCountryLabel() }}</span
                      >
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500">Database Shard:</span>
                      <span class="font-semibold text-[#2A65F6]"
                        >{{ form.get('region')?.value }} Regional Shard</span
                      >
                    </div>
                    <div class="flex justify-between pt-2 border-t border-slate-200/60">
                      <span class="text-slate-500">Selected Plan:</span>
                      <span class="font-semibold text-[#2A65F6]">
                        {{
                          selectedPlan() === 'FREE_TRIAL'
                            ? '14-Day Free Trial ($0)'
                            : selectedPlan() === 'PRO'
                              ? 'Pro Team ($29/month via Stripe)'
                              : 'Ultra Enterprise ($99/month via Stripe)'
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              }

              <div
                class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800"
              >
                @if (currentStep() > 1) {
                  <button
                    type="button"
                    (click)="prevStep()"
                    class="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 transition"
                  >
                    &larr; Back
                  </button>
                } @else {
                  <div></div>
                }

                @if (currentStep() < 5) {
                  <app-button
                    type="button"
                    (click)="nextStep()"
                    [disabled]="!isStepValid(currentStep())"
                  >
                    <span>{{ getNextStepButtonLabel() }}</span>
                    <span class="ml-1.5">&rarr;</span>
                  </app-button>
                } @else {
                  <app-button
                    type="button"
                    (click)="submitRegistration()"
                    [loading]="isSubmitting()"
                  >
                    Launch Workspace &rarr;
                  </app-button>
                }
              </div>
            </form>

            <div class="text-center mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p class="text-sm text-slate-500">
                Already have an account?
                <a
                  routerLink="/auth/login"
                  class="text-[#2A65F6] hover:underline font-semibold ml-1"
                  >Sign in</a
                >
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

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
  private invitationToken = '';

  // Subscription plan choice
  readonly selectedPlan = signal<'FREE_TRIAL' | 'PRO' | 'ULTRA'>('FREE_TRIAL');
  readonly isStripeRedirecting = signal<boolean>(false);

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

  setPlan(plan: 'FREE_TRIAL' | 'PRO' | 'ULTRA'): void {
    this.selectedPlan.set(plan);
  }

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

        // If a paid Stripe plan was selected, redirect to Stripe checkout session
        if (this.selectedPlan() !== 'FREE_TRIAL') {
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
