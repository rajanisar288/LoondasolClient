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
  templateUrl: "./payroll.component.html",
  styleUrl: "./payroll.component.scss",
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
