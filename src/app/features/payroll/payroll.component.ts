import { Component, OnInit, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TokenService } from '../../core/services/token.service';
import { AppDrawerComponent } from '../../shared/components/drawer/drawer.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import {
  SharedTableComponent,
  SharedTableColumn,
  SharedTableAction,
  SharedTableActionEvent,
} from '../../shared/components/table/table.component';

export interface SlipBreakdownLine {
  code: string;
  label: string;
  type: 'EARNING' | 'DEDUCTION';
  amount: number;
  formulaUsed?: string;
}

export interface PayrollSlip {
  slipId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  designation?: string;
  departmentName?: string;
  branchName?: string;
  month: string;
  baseSalary: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  lopDays?: number;
  absentDays: number;
  lateDays: number;
  overtimeHours: number;
  lateDeductions: number;
  lopDeductions?: number;
  overtimeBonus: number;
  customBonus?: number;
  fuelAllowance?: number;
  otherAllowances?: number;
  otherDeductions?: number;
  taxDeductions?: number;
  grossEarnings?: number;
  totalDeductions?: number;
  netSalary: number;
  netPayInWords?: string;
  earningsBreakdown?: SlipBreakdownLine[];
  deductionsBreakdown?: SlipBreakdownLine[];
  templateVersion?: number;
  pdfUrl?: string;
  isPasswordProtected?: boolean;
  pdfPasswordHint?: string;
  eSignHash?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  notes?: string;
  status: 'GENERATED' | 'PAID' | 'CANCELLED';
  paidAt?: string;
}

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedTableComponent, AppDrawerComponent, AppModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Top Header & Bulk Actions -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Payroll & Automated Salary Slips
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bulk-generate monthly salary slips with Attendance & Leave LOP integration, customize individual employee bonuses/fuel, archive PDFs to Cloudinary, and dispatch emails.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <input
            type="month"
            [(ngModel)]="selectedMonth"
            (change)="fetchSlips()"
            class="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-white"
          />

          @if (canManagePayroll()) {
            <button
              type="button"
              (click)="generatePayroll(false)"
              [disabled]="isGenerating()"
              class="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#2A65F6] hover:bg-[#2052cb] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <span>{{ isGenerating() ? 'Generating Slips & PDFs...' : '⚡ Bulk Generate All Slips' }}</span>
            </button>

            @if (slips().length > 0) {
              <button
                type="button"
                (click)="sendBulkEmails()"
                [disabled]="isBulkEmailing()"
                class="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                <span>{{ isBulkEmailing() ? 'Sending Emails...' : '✉️ Email All Employees' }}</span>
              </button>
            }
          }
        </div>
      </div>

      <!-- Status Toast Banner -->
      @if (feedbackBanner()) {
        <div
          class="p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between"
          [ngClass]="
            feedbackBanner()!.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          "
        >
          <span>{{ feedbackBanner()!.message }}</span>
          <button
            type="button"
            (click)="feedbackBanner.set(null)"
            class="text-xs font-bold opacity-75 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      }

      <!-- Summary KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Slips</div>
          <div class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{{ slips().length }}</div>
          <div class="text-[11px] text-slate-400 mt-1">
            {{ emailedCount() }} of {{ slips().length }} emailed
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Net Payroll Disbursed</div>
          <div class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {{ formatCurrency(totalNetSalary()) }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">Gross: {{ formatCurrency(totalGrossSalary()) }}</div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-red-500 uppercase tracking-wider">Late & LOP Deductions</div>
          <div class="text-2xl font-extrabold text-red-500 mt-1">
            -{{ formatCurrency(totalLateAndLopDeductions()) }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">Auto-pulled from Attendance & Leaves</div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-blue-500 uppercase tracking-wider">Overtime & Bonuses</div>
          <div class="text-2xl font-extrabold text-[#2A65F6] mt-1">
            +{{ formatCurrency(totalBonusesAndAllowances()) }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">Includes Overtime, Bonus & Fuel</div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-purple-500 uppercase tracking-wider">Cloudinary PDF Archive</div>
          <div class="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {{ cloudArchivedCount() }}/{{ slips().length }}
          </div>
          <div class="text-[11px] text-slate-400 mt-1">Versioned HTML → PDF snapshots</div>
        </div>
      </div>

      <!-- Custom Cell Templates for Shared Table -->
      <ng-template #employeeCell let-ctx>
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-900 dark:text-white">{{ ctx.row.employeeName }}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
              v{{ ctx.row.templateVersion || 1 }}
            </span>
          </div>
          <div class="text-xs text-slate-400">
            {{ ctx.row.designation || 'Staff' }} • {{ ctx.row.departmentName || 'General' }}
          </div>
        </div>
      </ng-template>

      <ng-template #attendanceCell let-ctx>
        <div class="text-xs space-y-0.5">
          <div class="text-slate-700 dark:text-slate-300 font-semibold">
            {{ ctx.row.presentDays }}/{{ ctx.row.workingDays }} Present
            @if (ctx.row.paidLeaveDays) {
              <span class="text-emerald-600"> • {{ ctx.row.paidLeaveDays }} Paid Lv</span>
            }
          </div>
          <div class="text-slate-400">
            {{ ctx.row.lateDays }} Late
            @if (ctx.row.lopDays) {
              <span class="text-red-500 font-semibold"> • {{ ctx.row.lopDays }} LOP</span>
            }
          </div>
        </div>
      </ng-template>

      <ng-template #deductionsCell let-ctx>
        <div class="text-xs">
          <span class="text-sm font-semibold text-red-500 block">
            -{{ formatCurrency(ctx.row.totalDeductions ?? (ctx.row.lateDeductions + (ctx.row.lopDeductions || 0) + (ctx.row.taxDeductions || 0) + (ctx.row.otherDeductions || 0))) }}
          </span>
          @if (ctx.row.lopDeductions) {
            <span class="text-[10px] text-slate-400">LOP: -{{ formatCurrency(ctx.row.lopDeductions) }}</span>
          }
        </div>
      </ng-template>

      <ng-template #additionsCell let-ctx>
        <div class="text-xs">
          <span class="text-sm font-semibold text-emerald-600 block">
            +{{ formatCurrency((ctx.row.overtimeBonus || 0) + (ctx.row.customBonus || 0) + (ctx.row.fuelAllowance || 0) + (ctx.row.otherAllowances || 0)) }}
          </span>
          <span class="text-[10px] text-slate-400">
            OT: {{ ctx.row.overtimeHours }}h
            @if (ctx.row.customBonus) {
              • Bonus: {{ formatCurrency(ctx.row.customBonus) }}
            }
            @if (ctx.row.fuelAllowance) {
              • Fuel: {{ formatCurrency(ctx.row.fuelAllowance) }}
            }
          </span>
        </div>
      </ng-template>

      <ng-template #netSalaryCell let-ctx>
        <div>
          <span class="text-base font-extrabold text-[#2A65F6] block">
            {{ formatCurrency(ctx.row.netSalary) }}
          </span>
          @if (ctx.row.pdfUrl) {
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">☁️ Cloud PDF Ready</span>
          }
        </div>
      </ng-template>

      <ng-template #statusCell let-ctx>
        <div class="flex flex-col items-start gap-1">
          <span
            class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
            [ngClass]="
              ctx.row.status === 'PAID'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                : 'bg-blue-50 text-[#2A65F6] dark:bg-blue-950/50'
            "
          >
            {{ ctx.row.status }}
          </span>
          @if (ctx.row.emailSent) {
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              ✉️ Email Sent
            </span>
          } @else {
            <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400">
              Not Emailed
            </span>
          }
        </div>
      </ng-template>

      <!-- Reusable SaaS Shared Table -->
      <theme-table
        [rows]="slips()"
        [columns]="payrollColumns"
        [actions]="payrollActions"
        [loading]="isLoading()"
        loadingMessage="Loading payroll slips..."
        [searchable]="true"
        [clientSideSearch]="true"
        searchPlaceholder="Search salary slips by employee name, department, or designation..."
        [showFilterButton]="false"
        [clientSidePagination]="true"
        [pageSize]="10"
        [showPageSizeSelector]="true"
        (rowClick)="openSlipDetails($event)"
        (actionClick)="onPayrollAction($event)"
        emptyTitle="No salary slips generated for this month"
        [emptyMessage]="'Click Bulk Generate All Slips to calculate attendance, LOP, custom formulas, and archive PDFs for ' + selectedMonth + '.'"
      ></theme-table>

      <!-- Slip Details, Customization & Live HTML Preview Drawer -->
      <app-drawer
        [isOpen]="isDetailsDrawerOpen()"
        title="Salary Slip Studio & Employee Customization"
        [subtitle]="(selectedSlip()?.employeeName || '') + ' • ' + selectedMonth + ' (Template v' + (selectedSlip()?.templateVersion || 1) + ')'"
        size="xl"
        position="right"
        [showFooter]="true"
        [showDefaultFooterActions]="false"
        (closed)="closeSlipDetails()"
      >
        @if (selectedSlip(); as slip) {
          <div class="space-y-5">
            <!-- Drawer Mode Switcher: Breakdown & Customize vs Live HTML Preview -->
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div class="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  (click)="drawerTab.set('breakdown')"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                  [ngClass]="
                    drawerTab() === 'breakdown'
                      ? 'bg-white dark:bg-slate-900 text-[#2A65F6] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  "
                >
                  📊 Breakdown & Customize
                </button>
                <button
                  type="button"
                  (click)="switchToHtmlPreview()"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition"
                  [ngClass]="
                    drawerTab() === 'preview'
                      ? 'bg-white dark:bg-slate-900 text-[#2A65F6] shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  "
                >
                  👁️ Live HTML Payslip Preview
                </button>
              </div>

              <div class="flex items-center space-x-2">
                <button
                  type="button"
                  (click)="openSlipPreview(slip)"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                  title="Expand preview in full modal"
                >
                  ↗️ Full Preview
                </button>
                @if (slip.emailSent) {
                  <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                    ✉️ Emailed
                  </span>
                }
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold"
                  [ngClass]="
                    slip.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                      : 'bg-blue-50 text-[#2A65F6] dark:bg-blue-950/50'
                  "
                >
                  {{ slip.status }}
                </span>
              </div>
            </div>

            @if (drawerTab() === 'breakdown') {
              <!-- Employee Header Card -->
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 class="text-base font-bold text-slate-900 dark:text-white">{{ slip.employeeName }}</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ slip.designation || 'Staff' }} • {{ slip.departmentName || 'General' }} • {{ slip.branchName || 'HQ' }}
                  </p>
                  <p class="text-xs text-slate-400 mt-0.5">
                    ID: {{ slip.employeeId }} • {{ slip.employeeEmail }}
                  </p>
                </div>

                <div class="text-right">
                  @if (slip.isPasswordProtected) {
                    <span class="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      🔒 Password Hint: {{ slip.pdfPasswordHint }}
                    </span>
                  }
                  @if (slip.eSignHash) {
                    <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                      ✓ e-Signed: {{ slip.eSignHash }}
                    </div>
                  }
                </div>
              </div>

              <!-- Attendance & Leave Integration Stats Grid -->
              <div>
                <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Attendance & Leave Integration Summary
                </h5>
                <div class="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] text-slate-400 font-medium">Working Days</span>
                    <div class="text-base font-bold text-slate-900 dark:text-white mt-0.5">{{ slip.workingDays }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Present Days</span>
                    <div class="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{{ slip.presentDays }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Paid Leaves</span>
                    <div class="text-base font-bold text-teal-600 dark:text-teal-400 mt-0.5">{{ slip.paidLeaveDays || 0 }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] text-red-500 font-medium">LOP (Unpaid)</span>
                    <div class="text-base font-bold text-red-500 mt-0.5">{{ slip.lopDays || 0 }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] text-amber-500 font-medium">Late Arrivals</span>
                    <div class="text-base font-bold text-amber-500 mt-0.5">{{ slip.lateDays }}</div>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span class="text-[11px] text-blue-500 font-medium">Overtime</span>
                    <div class="text-base font-bold text-blue-500 mt-0.5">{{ slip.overtimeHours }}h</div>
                  </div>
                </div>
              </div>

              <!-- Per-Employee Customization Form (Bonus, Fuel, Allowances, Deductions, Notes) -->
              @if (canManagePayroll()) {
                <div class="p-4 rounded-xl border border-[#2A65F6]/30 bg-blue-50/20 dark:bg-blue-950/10 space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h5 class="text-xs font-extrabold uppercase tracking-wider text-[#2A65F6]">
                        Customize Employee Compensation (Bonus • Fuel • Adjustments)
                      </h5>
                      <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Adjust individual bonus, fuel allowance, or deductions before sending this salary slip email. Saving automatically updates Net Pay in Words and re-archives the Cloudinary PDF.
                      </p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Performance / Custom Bonus (+)
                      </label>
                      <input
                        type="number"
                        [(ngModel)]="editCustomBonus"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fuel / Conveyance Allowance (+)
                      </label>
                      <input
                        type="number"
                        [(ngModel)]="editFuelAllowance"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Other Allowances (+)
                      </label>
                      <input
                        type="number"
                        [(ngModel)]="editOtherAllowances"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Late Fine Deduction (-)
                      </label>
                      <input
                        type="number"
                        [(ngModel)]="editLateDeductions"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-red-600"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        LOP (Unpaid Leave) Deduction (-)
                      </label>
                      <input
                        type="number"
                        [(ngModel)]="editLopDeductions"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-red-600"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Other Deductions (-)
                      </label>
                      <input
                        type="number"
                        [(ngModel)]="editOtherDeductions"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-red-600"
                      />
                    </div>
                  </div>

                  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div class="flex-1">
                      <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        HR Remarks / Payslip Note (Printed on Slip)
                      </label>
                      <input
                        type="text"
                        [(ngModel)]="editNotes"
                        placeholder="e.g. Includes Q3 Spot Bonus & Fuel Reimbursement"
                        class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      (click)="saveSlipCustomization()"
                      [disabled]="isSavingCustomization()"
                      class="px-4 py-2 bg-[#2A65F6] hover:bg-[#2052cb] text-white text-xs font-bold rounded-lg shadow-sm transition whitespace-nowrap disabled:opacity-50"
                    >
                      {{ isSavingCustomization() ? 'Recalculating & Archiving PDF...' : '💾 Save Changes & Update PDF' }}
                    </button>
                  </div>
                </div>
              }

              <!-- Earnings & Deductions Breakdown -->
              <div>
                <h5 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Full Earnings & Deductions Statement
                </h5>
                <div class="space-y-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 bg-white dark:bg-slate-900">
                  @if (slip.earningsBreakdown && slip.earningsBreakdown.length > 0) {
                    <div class="text-[11px] font-bold uppercase text-emerald-600 pb-1">Earnings (+)</div>
                    @for (item of slip.earningsBreakdown; track item.code) {
                      <div class="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span class="text-slate-700 dark:text-slate-300 font-medium">
                          {{ item.label }}
                          @if (item.formulaUsed) {
                            <span class="text-[10px] text-slate-400 ml-1">({{ item.formulaUsed }})</span>
                          }
                        </span>
                        <span class="font-bold text-emerald-600 dark:text-emerald-400">+{{ formatCurrency(item.amount) }}</span>
                      </div>
                    }
                  } @else {
                    <div class="flex items-center justify-between text-sm py-1">
                      <span class="text-slate-600 dark:text-slate-300">Base Salary</span>
                      <span class="font-bold text-slate-900 dark:text-white">{{ formatCurrency(slip.baseSalary) }}</span>
                    </div>
                  }

                  @if (slip.deductionsBreakdown && slip.deductionsBreakdown.length > 0) {
                    <div class="text-[11px] font-bold uppercase text-red-500 pt-2 pb-1">Deductions (-)</div>
                    @for (item of slip.deductionsBreakdown; track item.code) {
                      <div class="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span class="text-slate-700 dark:text-slate-300 font-medium">
                          {{ item.label }}
                          @if (item.formulaUsed) {
                            <span class="text-[10px] text-slate-400 ml-1">({{ item.formulaUsed }})</span>
                          }
                        </span>
                        <span class="font-bold text-red-500">-{{ formatCurrency(item.amount) }}</span>
                      </div>
                    }
                  }

                  <div class="flex items-center justify-between text-base py-3 mt-2 border-t-2 border-slate-200 dark:border-slate-700 bg-blue-50/60 dark:bg-blue-950/30 px-3.5 rounded-lg">
                    <div>
                      <span class="font-extrabold text-[#2A65F6] block">Net Payable Salary</span>
                      @if (slip.netPayInWords) {
                        <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                          In Words: <strong>{{ slip.netPayInWords }}</strong>
                        </span>
                      }
                    </div>
                    <span class="font-black text-xl text-[#2A65F6]">{{ formatCurrency(slip.netSalary) }}</span>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Live HTML Payslip Preview Tab -->
              <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-3 max-h-[68vh] overflow-y-auto">
                @if (drawerPreviewHtml()) {
                  <div class="bg-white rounded shadow-sm overflow-hidden" [innerHTML]="drawerPreviewHtml()"></div>
                } @else {
                  <div class="py-12 text-center text-xs text-slate-400">Loading live HTML salary slip...</div>
                }
              </div>
            }
          </div>
        }

        <div drawer-footer class="flex flex-wrap items-center justify-between gap-2 w-full">
          <div class="flex items-center space-x-2">
            @if (selectedSlip()?.status !== 'PAID' && canManagePayroll()) {
              <button
                type="button"
                (click)="markAsPaid(selectedSlip()!.slipId)"
                class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
              >
                ✅ Mark as Paid
              </button>
            }

            @if (canManagePayroll() && selectedSlip()) {
              <button
                type="button"
                (click)="sendSingleEmail(selectedSlip()!.slipId)"
                [disabled]="isSendingSingleEmail()"
                class="px-3.5 py-2 bg-[#2A65F6] hover:bg-[#2052cb] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
              >
                {{ isSendingSingleEmail() ? 'Sending Email...' : '✉️ Send Email to Employee' }}
              </button>
            }
          </div>

          <div class="flex items-center space-x-2">
            @if (selectedSlip()?.pdfUrl) {
              <a
                [href]="selectedSlip()!.pdfUrl"
                target="_blank"
                rel="noopener"
                class="px-3.5 py-2 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-xs font-bold rounded-lg text-purple-700 dark:text-purple-300 transition"
              >
                ☁️ Cloud PDF
              </a>
            }
            <button
              type="button"
              (click)="printSlip(selectedSlip()!.slipId)"
              class="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 transition"
            >
              🖨️ Print / PDF
            </button>
            <button
              type="button"
              (click)="closeSlipDetails()"
              class="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </app-drawer>

      <!-- High-Fidelity Salary Slip Preview Modal -->
      <app-modal
        [isOpen]="isPreviewModalOpen()"
        [title]="'Actual Salary Slip Preview • ' + (previewSlipData()?.employeeName || '') + ' (' + selectedMonth + ')'"
        size="xl"
        [showFooter]="true"
        primaryLabel="Print / PDF"
        secondaryLabel="Close"
        (primaryAction)="printSlip(previewSlipData()!.slipId)"
        (secondaryAction)="closeSlipPreviewModal()"
        (closed)="closeSlipPreviewModal()"
      >
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span class="font-bold text-slate-900 dark:text-white">{{ previewSlipData()?.employeeName }}</span>
              <span class="text-slate-400"> • {{ previewSlipData()?.designation || 'Staff' }} • Net Pay: </span>
              <span class="font-extrabold text-[#2A65F6]">{{ formatCurrency(previewSlipData()?.netSalary || 0) }}</span>
            </div>

            <div class="flex items-center space-x-2">
              @if (previewSlipData()?.pdfUrl) {
                <a
                  [href]="previewSlipData()!.pdfUrl"
                  target="_blank"
                  rel="noopener"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
                >
                  ☁️ Cloud PDF
                </a>
              }
              @if (canManagePayroll() && previewSlipData()) {
                <button
                  type="button"
                  (click)="sendSingleEmail(previewSlipData()!.slipId)"
                  [disabled]="isSendingSingleEmail()"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2A65F6] text-white hover:bg-[#2052cb] transition disabled:opacity-50"
                >
                  {{ isSendingSingleEmail() ? 'Sending...' : '✉️ Email Employee' }}
                </button>
              }
            </div>
          </div>

          <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 max-h-[72vh] overflow-y-auto p-2 sm:p-4 flex justify-center">
            @if (modalPreviewHtml()) {
              <div class="w-full max-w-4xl bg-white rounded-lg shadow-sm overflow-hidden" [innerHTML]="modalPreviewHtml()"></div>
            } @else {
              <div class="py-24 text-center space-y-2">
                <div class="w-8 h-8 border-2 border-[#2A65F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div class="text-xs text-slate-400">Loading actual salary slip preview...</div>
              </div>
            }
          </div>
        </div>
      </app-modal>
    </div>
  `,
})
export class PayrollComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('employeeCell') employeeCell?: TemplateRef<any>;
  @ViewChild('attendanceCell') attendanceCell?: TemplateRef<any>;
  @ViewChild('deductionsCell') deductionsCell?: TemplateRef<any>;
  @ViewChild('additionsCell') additionsCell?: TemplateRef<any>;
  @ViewChild('netSalaryCell') netSalaryCell?: TemplateRef<any>;
  @ViewChild('statusCell') statusCell?: TemplateRef<any>;

  get payrollColumns(): SharedTableColumn<PayrollSlip>[] {
    return [
      {
        key: 'employeeName',
        header: 'Employee',
        sortable: true,
        template: this.employeeCell,
      },
      {
        key: 'baseSalary',
        header: 'Base Salary',
        sortable: true,
        formatter: (val) => this.formatCurrency(Number(val)),
      },
      {
        key: 'attendance',
        header: 'Attendance & LOP',
        template: this.attendanceCell,
      },
      {
        key: 'lateDeductions',
        header: 'Deductions',
        template: this.deductionsCell,
      },
      {
        key: 'overtimeBonus',
        header: 'Additions / Bonus',
        template: this.additionsCell,
      },
      {
        key: 'netSalary',
        header: 'Net Salary',
        sortable: true,
        template: this.netSalaryCell,
      },
      {
        key: 'status',
        header: 'Status & Email',
        sortable: true,
        template: this.statusCell,
      },
    ];
  }

  get payrollActions(): SharedTableAction<PayrollSlip>[] {
    return [
      {
        id: 'preview',
        label: 'Preview Slip',
        icon: '👁️',
      },
      {
        id: 'customize',
        label: 'Customize / Edit',
        icon: '⚙️',
      },
      {
        id: 'send-email',
        label: 'Send Email',
        icon: '✉️',
        visible: () => this.canManagePayroll(),
      },
      {
        id: 'print',
        label: 'Print / PDF',
        icon: '📄',
      },
      {
        id: 'mark-paid',
        label: 'Mark Paid',
        icon: '✅',
        visible: (slip) => slip.status !== 'PAID' && this.canManagePayroll(),
      },
    ];
  }

  onPayrollAction(event: SharedTableActionEvent<PayrollSlip>): void {
    if (event.action.id === 'preview') {
      this.openSlipPreview(event.row);
    } else if (event.action.id === 'customize') {
      this.openSlipDetails(event.row);
    } else if (event.action.id === 'send-email') {
      this.sendSingleEmail(event.row.slipId);
    } else if (event.action.id === 'print') {
      this.printSlip(event.row.slipId);
    } else if (event.action.id === 'mark-paid') {
      this.markAsPaid(event.row.slipId);
    }
  }

  readonly slips = signal<PayrollSlip[]>([]);
  readonly isLoading = signal(true);
  readonly isGenerating = signal(false);
  readonly isBulkEmailing = signal(false);
  readonly isSendingSingleEmail = signal(false);
  readonly isSavingCustomization = signal(false);
  readonly selectedSlip = signal<PayrollSlip | null>(null);
  readonly isDetailsDrawerOpen = signal(false);
  readonly drawerTab = signal<'breakdown' | 'preview'>('breakdown');
  readonly drawerPreviewHtml = signal<SafeHtml | null>(null);
  readonly feedbackBanner = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dedicated Salary Slip Preview Modal State
  readonly isPreviewModalOpen = signal(false);
  readonly previewSlipData = signal<PayrollSlip | null>(null);
  readonly modalPreviewHtml = signal<SafeHtml | null>(null);

  openSlipPreview(slip: PayrollSlip): void {
    this.previewSlipData.set(slip);
    this.modalPreviewHtml.set(null);
    this.isPreviewModalOpen.set(true);

    this.api.getText(`payroll/slips/${slip.slipId}/html`).subscribe({
      next: (html) => {
        this.modalPreviewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
      },
      error: (err) => {
        console.error('Failed to load slip html preview:', err);
      },
    });
  }

  closeSlipPreviewModal(): void {
    this.isPreviewModalOpen.set(false);
    this.previewSlipData.set(null);
  }

  // Per-employee editable fields inside drawer
  editCustomBonus = 0;
  editFuelAllowance = 0;
  editOtherAllowances = 0;
  editOtherDeductions = 0;
  editLateDeductions = 0;
  editLopDeductions = 0;
  editNotes = '';

  selectedMonth = new Date().toISOString().slice(0, 7);

  ngOnInit(): void {
    this.fetchSlips();
  }

  canManagePayroll(): boolean {
    return Boolean(
      this.authService.hasAnyPermission(['payroll.generate', 'payroll.update', 'company.settings.update']) ||
        this.authService.currentUser()?.isOwner,
    );
  }

  openSlipDetails(slip: PayrollSlip): void {
    this.selectedSlip.set(slip);
    this.drawerTab.set('breakdown');
    this.drawerPreviewHtml.set(null);
    this.editCustomBonus = slip.customBonus || 0;
    this.editFuelAllowance = slip.fuelAllowance || 0;
    this.editOtherAllowances = slip.otherAllowances || 0;
    this.editOtherDeductions = slip.otherDeductions || 0;
    this.editLateDeductions = slip.lateDeductions || 0;
    this.editLopDeductions = slip.lopDeductions || 0;
    this.editNotes = slip.notes || '';
    this.isDetailsDrawerOpen.set(true);
  }

  switchToHtmlPreview(): void {
    this.drawerTab.set('preview');
    const slip = this.selectedSlip();
    if (!slip) return;
    this.drawerPreviewHtml.set(null);
    this.api.getText(`payroll/slips/${slip.slipId}/html`).subscribe({
      next: (html) => {
        this.drawerPreviewHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
      },
      error: (err) => {
        console.error('Failed to load slip html', err);
      },
    });
  }

  closeSlipDetails(): void {
    this.isDetailsDrawerOpen.set(false);
  }

  fetchSlips(): void {
    this.isLoading.set(true);
    this.api
      .get<PayrollSlip[]>('payroll/slips', { month: this.selectedMonth })
      .subscribe({
        next: (res) => {
          this.slips.set(res || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  generatePayroll(sendEmails = false): void {
    this.isGenerating.set(true);
    this.feedbackBanner.set(null);
    this.api
      .post<{ generated: number; emailed: number; slips: PayrollSlip[] }>('payroll/generate', {
        month: this.selectedMonth,
        sendEmails,
      })
      .subscribe({
        next: (res) => {
          this.slips.set(res.slips || []);
          this.isGenerating.set(false);
          this.feedbackBanner.set({
            type: 'success',
            message: `Generated ${res.generated} salary slips for ${this.selectedMonth}${res.emailed ? ` and dispatched ${res.emailed} emails` : ''}.`,
          });
          this.fetchSlips();
        },
        error: (err) => {
          this.isGenerating.set(false);
          this.feedbackBanner.set({
            type: 'error',
            message: err?.error?.message || 'Failed to generate payroll slips.',
          });
        },
      });
  }

  saveSlipCustomization(): void {
    const slip = this.selectedSlip();
    if (!slip) return;

    this.isSavingCustomization.set(true);
    this.api
      .patch<PayrollSlip>(`payroll/slips/${slip.slipId}/customize`, {
        customBonus: Number(this.editCustomBonus) || 0,
        fuelAllowance: Number(this.editFuelAllowance) || 0,
        otherAllowances: Number(this.editOtherAllowances) || 0,
        otherDeductions: Number(this.editOtherDeductions) || 0,
        lateDeductions: Number(this.editLateDeductions) || 0,
        lopDeductions: Number(this.editLopDeductions) || 0,
        notes: this.editNotes,
      })
      .subscribe({
        next: (updated) => {
          this.isSavingCustomization.set(false);
          this.selectedSlip.set(updated);
          this.slips.update((list) => list.map((s) => (s.slipId === updated.slipId ? updated : s)));
          this.feedbackBanner.set({
            type: 'success',
            message: `Updated ${updated.employeeName}'s salary slip (${this.formatCurrency(updated.netSalary)}) and re-archived PDF to Cloudinary.`,
          });
        },
        error: (err) => {
          this.isSavingCustomization.set(false);
          this.feedbackBanner.set({
            type: 'error',
            message: err?.error?.message || 'Failed to customize salary slip.',
          });
        },
      });
  }

  sendSingleEmail(slipId: string): void {
    this.isSendingSingleEmail.set(true);
    this.api
      .post<{ sent: boolean; email: string; slipId: string; pdfUrl?: string }>(
        `payroll/slips/${slipId}/send-email`,
        {},
      )
      .subscribe({
        next: (res) => {
          this.isSendingSingleEmail.set(false);
          this.slips.update((list) =>
            list.map((s) =>
              s.slipId === slipId
                ? { ...s, emailSent: true, emailSentAt: new Date().toISOString(), pdfUrl: res.pdfUrl || s.pdfUrl }
                : s,
            ),
          );
          if (this.selectedSlip()?.slipId === slipId) {
            this.selectedSlip.update((curr) =>
              curr ? { ...curr, emailSent: true, emailSentAt: new Date().toISOString() } : null,
            );
          }
          this.feedbackBanner.set({
            type: 'success',
            message: `Salary slip email dispatched to ${res.email}.`,
          });
        },
        error: (err) => {
          this.isSendingSingleEmail.set(false);
          this.feedbackBanner.set({
            type: 'error',
            message: err?.error?.message || 'Failed to send salary slip email.',
          });
        },
      });
  }

  sendBulkEmails(): void {
    this.isBulkEmailing.set(true);
    this.feedbackBanner.set(null);
    this.api
      .post<{ total: number; sent: number; failed: number }>('payroll/send-bulk-email', {
        month: this.selectedMonth,
      })
      .subscribe({
        next: (res) => {
          this.isBulkEmailing.set(false);
          this.feedbackBanner.set({
            type: 'success',
            message: `Bulk email complete: ${res.sent} of ${res.total} salary slips emailed to employees.`,
          });
          this.fetchSlips();
        },
        error: (err) => {
          this.isBulkEmailing.set(false);
          this.feedbackBanner.set({
            type: 'error',
            message: err?.error?.message || 'Failed to send bulk salary slip emails.',
          });
        },
      });
  }

  markAsPaid(slipId: string): void {
    this.api
      .patch<PayrollSlip>(`payroll/slips/${slipId}/status`, {
        status: 'PAID',
      })
      .subscribe({
        next: (updated) => {
          this.slips.update((list) => list.map((s) => (s.slipId === slipId ? updated : s)));
          if (this.selectedSlip()?.slipId === slipId) {
            this.selectedSlip.set(updated);
          }
        },
      });
  }

  printSlip(slipId: string): void {
    const token = this.tokenService.getAccessToken();
    const printUrl = `http://localhost:4000/api/v1/payroll/slips/${slipId}/html${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    window.open(printUrl, '_blank');
  }

  totalNetSalary(): number {
    return this.slips().reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
  }

  totalGrossSalary(): number {
    return this.slips().reduce((acc, curr) => acc + (curr.grossEarnings || curr.baseSalary || 0), 0);
  }

  totalLateAndLopDeductions(): number {
    return this.slips().reduce(
      (acc, curr) => acc + (curr.lateDeductions || 0) + (curr.lopDeductions || 0),
      0,
    );
  }

  totalBonusesAndAllowances(): number {
    return this.slips().reduce(
      (acc, curr) =>
        acc +
        (curr.overtimeBonus || 0) +
        (curr.customBonus || 0) +
        (curr.fuelAllowance || 0) +
        (curr.otherAllowances || 0),
      0,
    );
  }

  emailedCount(): number {
    return this.slips().filter((s) => s.emailSent).length;
  }

  cloudArchivedCount(): number {
    return this.slips().filter((s) => Boolean(s.pdfUrl)).length;
  }

  formatCurrency(amount: number): string {
    return this.authService.formatCurrency(amount);
  }
}
