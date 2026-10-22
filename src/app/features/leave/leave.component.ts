import { Component, OnInit, inject, signal, computed, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppDrawerComponent } from '../../shared/components/drawer/drawer.component';
import {
  SharedTableComponent,
  SharedTableColumn,
  SharedTableAction,
  SharedTableActionEvent,
} from '../../shared/components/table/table.component';

export interface LeaveTypeBalance {
  id: string;
  name: string;
  quota: number;
  monthlyLimit: number;
  usedYearly: number;
  remainingYearly: number;
  usedThisMonth: number;
  remainingThisMonth: number;
  isPaid: boolean;
}

export interface LeaveBalances {
  totalYearlyQuota: number;
  totalUsedYearly: number;
  remainingYearly: number;
  monthlyLimit: number;
  totalUsedThisMonth: number;
  remainingThisMonth: number;
  types: LeaveTypeBalance[];
}

interface LeaveRecord {
  leaveId: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewerNotes?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppBadgeComponent,
    AppDrawerComponent,
    SharedTableComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="page-title">Leave & Time Off</h1>
          <p class="page-description">
            Request personal, annual, or medical leave and manage team absence approvals.
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <app-button (click)="openApplyModal()">
            <span class="mr-1.5">+</span>
            <span>Apply for Leave</span>
          </app-button>
        </div>
      </div>

      <!-- Leave Balance Summary Cards -->
      @if (leaveBalances(); as bal) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-4 space-y-1">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Yearly Balance Remaining</span>
            <div class="flex items-baseline justify-between">
              <span class="text-2xl font-bold text-slate-900 dark:text-white">{{ bal.remainingYearly }} <span class="text-xs font-normal text-slate-400">/ {{ bal.totalYearlyQuota }} days</span></span>
              <span class="text-xs px-2 py-0.5 rounded-[8px] font-semibold bg-blue-50 text-[#2A65F6] dark:bg-blue-950/50">Yearly</span>
            </div>
          </div>

          <div class="card p-4 space-y-1">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Limit Remaining</span>
            <div class="flex items-baseline justify-between">
              <span class="text-2xl font-bold text-slate-900 dark:text-white">{{ bal.remainingThisMonth }} <span class="text-xs font-normal text-slate-400">/ {{ bal.monthlyLimit }} days</span></span>
              <span class="text-xs px-2 py-0.5 rounded-[8px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">This Month</span>
            </div>
          </div>

          @for (t of bal.types; track t.id) {
            <div class="card p-4 space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ t.name }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      [class]="t.isPaid ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'">
                  {{ t.isPaid ? 'Paid' : 'Unpaid' }}
                </span>
              </div>
              <div class="flex items-baseline justify-between pt-1">
                <span class="text-lg font-bold text-slate-900 dark:text-white">{{ t.remainingYearly }} <span class="text-xs font-normal text-slate-400">/ {{ t.quota }} days left</span></span>
                <span class="text-[11px] text-slate-400">({{ t.remainingThisMonth }}d max/mo)</span>
              </div>
            </div>
          }
        </div>
      }

      <div class="border-b border-slate-200 dark:border-slate-800 flex space-x-8">
        <button
          type="button"
          (click)="activeTab.set('my')"
          [class]="
            activeTab() === 'my'
              ? 'border-[#2A65F6] text-[#2A65F6] font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
          "
          class="pb-3 border-b-2 text-sm transition"
        >
          My Applications ({{ myLeaves().length }})
        </button>

        @if (authService.hasPermission('leave.approve') || authService.currentUser()?.isOwner) {
          <button
            type="button"
            (click)="activeTab.set('all')"
            [class]="
              activeTab() === 'all'
                ? 'border-[#2A65F6] text-[#2A65F6] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
            "
            class="pb-3 border-b-2 text-sm transition"
          >
            Company Review Queue ({{ allLeaves().length }})
          </button>
        }
      </div>

      <!-- Custom Cell Templates for Shared Table -->
      <ng-template #durationCell let-ctx>
        <span class="text-xs text-slate-500">
          {{ ctx.row.startDate }} &rarr; {{ ctx.row.endDate }}
        </span>
      </ng-template>

      <ng-template #daysCell let-ctx>
        <span class="font-medium">
          {{ ctx.row.daysCount }} day{{ ctx.row.daysCount > 1 ? 's' : '' }}
        </span>
      </ng-template>

      <ng-template #reasonCell let-ctx>
        <span class="max-w-xs truncate block">{{ ctx.row.reason }}</span>
      </ng-template>

      <ng-template #statusCell let-ctx>
        <app-badge [variant]="getStatusVariant(ctx.row.status)">
          {{ ctx.row.status }}
        </app-badge>
      </ng-template>

      @if (activeTab() === 'my') {
        <div class="space-y-3">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            My Leave History
          </h3>
          <theme-table
            [rows]="myLeaves()"
            [columns]="myLeaveColumns"
            [searchable]="true"
            [clientSideSearch]="true"
            searchPlaceholder="Search my leave history..."
            [showFilterButton]="false"
            [clientSidePagination]="true"
            [pageSize]="10"
            [showPageSizeSelector]="true"
            emptyTitle="No leave applications found"
            emptyMessage="You have not submitted any leave applications yet."
          ></theme-table>
        </div>
      } @else {
        <div class="space-y-3">
          <h3 class="text-base font-semibold text-slate-900 dark:text-white">
            Team Requests Requiring Review
          </h3>
          <theme-table
            [rows]="allLeaves()"
            [columns]="teamLeaveColumns"
            [actions]="teamLeaveActions"
            (actionClick)="onTeamLeaveAction($event)"
            [searchable]="true"
            [clientSideSearch]="true"
            searchPlaceholder="Search team leave requests..."
            [showFilterButton]="false"
            [clientSidePagination]="true"
            [pageSize]="10"
            [showPageSizeSelector]="true"
            emptyTitle="No team requests"
            emptyMessage="No employee leave applications currently awaiting review."
          ></theme-table>
        </div>
      }

      <app-drawer
        [isOpen]="isApplyModalOpen()"
        title="Apply for Leave"
        subtitle="Submit time off request for management approval"
        size="lg"
        position="right"
        (closed)="closeApplyModal()"
      >
        <form [formGroup]="applyForm" (ngSubmit)="submitApplication()" class="space-y-4">
          <app-select
            label="Leave Type"
            [required]="true"
            [options]="leaveTypeOptions()"
            formControlName="leaveType"
          ></app-select>

          @if (selectedTypeBalance(); as selType) {
            <div class="p-3 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between">
              <div class="space-y-0.5">
                <span class="font-bold text-slate-900 dark:text-white block">{{ selType.name }} Balance</span>
                <span class="text-slate-600 dark:text-slate-300">
                  {{ selType.remainingYearly }} days remaining this year ({{ selType.usedYearly }} used out of {{ selType.quota }}d)
                </span>
              </div>
              <span class="px-2.5 py-1 rounded-[8px] text-[11px] font-bold bg-[#2A65F6] text-white">
                Max {{ selType.remainingThisMonth }}d left this mo
              </span>
            </div>
          }

          <div class="grid grid-cols-2 gap-4">
            <app-input
              label="Start Date"
              type="date"
              [required]="true"
              formControlName="startDate"
            ></app-input>

            <app-input
              label="End Date"
              type="date"
              [required]="true"
              formControlName="endDate"
            ></app-input>
          </div>

          <app-input
            label="Total Days Count"
            type="number"
            placeholder="1"
            [required]="true"
            formControlName="daysCount"
          ></app-input>

          <app-input
            label="Reason for Absence"
            placeholder="Attending medical appointment or annual family leave"
            [required]="true"
            formControlName="reason"
          ></app-input>

          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800"
          >
            <app-button variant="secondary" type="button" (click)="closeApplyModal()"
              >Cancel</app-button
            >
            <app-button type="submit" [loading]="isSubmitting()">Submit Application</app-button>
          </div>
        </form>
      </app-drawer>

      <app-drawer
        [isOpen]="isReviewModalOpen()"
        [title]="isApproveAction() ? 'Approve Leave Request' : 'Reject Leave Request'"
        subtitle="Review employee leave request details and notes"
        size="md"
        position="right"
        (closed)="closeReviewModal()"
      >
        <div class="space-y-4">
          <p class="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to {{ isApproveAction() ? 'approve' : 'reject' }} the leave
            application for
            <span class="font-semibold text-slate-900 dark:text-white">{{
              selectedLeave()?.employeeName
            }}</span
            >?
          </p>

          <app-input
            label="Reviewer Notes"
            placeholder="Optional comment or instructions"
            [showOptional]="true"
            [formControl]="reviewNotesControl"
          ></app-input>

          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800"
          >
            <app-button variant="secondary" type="button" (click)="closeReviewModal()"
              >Cancel</app-button
            >
            <app-button
              [variant]="isApproveAction() ? 'primary' : 'danger'"
              [loading]="isSubmitting()"
              (click)="confirmReview()"
            >
              Confirm {{ isApproveAction() ? 'Approval' : 'Rejection' }}
            </app-button>
          </div>
        </div>
      </app-drawer>
    </div>
  `,
})
export class LeaveComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  @ViewChild('durationCell') durationCell?: TemplateRef<any>;
  @ViewChild('daysCell') daysCell?: TemplateRef<any>;
  @ViewChild('reasonCell') reasonCell?: TemplateRef<any>;
  @ViewChild('statusCell') statusCell?: TemplateRef<any>;

  get myLeaveColumns(): SharedTableColumn<LeaveRecord>[] {
    return [
      {
        key: 'leaveType',
        header: 'Type',
        sortable: true,
      },
      {
        key: 'startDate',
        header: 'Duration',
        sortable: true,
        template: this.durationCell,
      },
      {
        key: 'daysCount',
        header: 'Days',
        sortable: true,
        template: this.daysCell,
      },
      {
        key: 'reason',
        header: 'Reason',
        template: this.reasonCell,
      },
      {
        key: 'reviewerNotes',
        header: 'Reviewer Notes',
        emptyValue: '—',
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        template: this.statusCell,
      },
    ];
  }

  get teamLeaveColumns(): SharedTableColumn<LeaveRecord>[] {
    return [
      {
        key: 'employeeName',
        header: 'Applicant',
        sortable: true,
      },
      {
        key: 'leaveType',
        header: 'Type',
        sortable: true,
      },
      {
        key: 'startDate',
        header: 'Dates',
        sortable: true,
        template: this.durationCell,
      },
      {
        key: 'daysCount',
        header: 'Days',
        sortable: true,
        template: this.daysCell,
      },
      {
        key: 'reason',
        header: 'Reason',
        template: this.reasonCell,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        template: this.statusCell,
      },
    ];
  }

  get teamLeaveActions(): SharedTableAction<LeaveRecord>[] {
    return [
      {
        id: 'approve',
        label: 'Approve',
        icon: '✅',
        visible: (record) => record.status === 'PENDING',
      },
      {
        id: 'reject',
        label: 'Reject',
        icon: '❌',
        danger: true,
        visible: (record) => record.status === 'PENDING',
      },
    ];
  }

  onTeamLeaveAction(event: SharedTableActionEvent<LeaveRecord>): void {
    if (event.action.id === 'approve') {
      this.openReviewModal(event.row, true);
    } else if (event.action.id === 'reject') {
      this.openReviewModal(event.row, false);
    }
  }

  readonly activeTab = signal<'my' | 'all'>('my');
  readonly myLeaves = signal<LeaveRecord[]>([]);
  readonly allLeaves = signal<LeaveRecord[]>([]);
  readonly isApplyModalOpen = signal<boolean>(false);
  readonly isReviewModalOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  readonly selectedLeave = signal<LeaveRecord | null>(null);
  readonly isApproveAction = signal<boolean>(true);
  readonly reviewNotesControl = new FormControl('');

  readonly leaveBalances = signal<LeaveBalances | null>(null);

  readonly leaveTypeOptions = signal<SelectOption[]>([
    { label: 'Annual Leave', value: 'ANNUAL' },
    { label: 'Sick Leave', value: 'SICK' },
    { label: 'Casual Leave', value: 'CASUAL' },
    { label: 'Maternity Leave', value: 'MATERNITY' },
    { label: 'Paternity Leave', value: 'PATERNITY' },
    { label: 'Unpaid Leave', value: 'UNPAID' },
  ]);

  readonly applyForm: FormGroup = this.fb.group({
    leaveType: ['ANNUAL', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    daysCount: [1, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
  });

  readonly selectedTypeBalance = computed(() => {
    const bal = this.leaveBalances();
    if (!bal) return null;
    const selectedId = this.applyForm.get('leaveType')?.value;
    return bal.types.find((t) => t.id === selectedId) || null;
  });

  ngOnInit(): void {
    this.loadLeaveBalances();
    this.loadMyLeaves();
    if (this.authService.hasPermission('leave.view') || this.authService.currentUser()?.isOwner) {
      this.loadAllLeaves();
    }
  }

  loadLeaveBalances(): void {
    this.api.get<LeaveBalances>('leave/balances').subscribe({
      next: (res) => {
        this.leaveBalances.set(res);
        if (res?.types && res.types.length > 0) {
          this.leaveTypeOptions.set(
            res.types.map((t) => ({
              label: `${t.name} (${t.remainingYearly}d remaining)`,
              value: t.id,
            }))
          );
        }
      },
      error: () => {},
    });
  }

  loadMyLeaves(): void {
    this.api.get<LeaveRecord[]>('leave/my').subscribe({
      next: (res) => this.myLeaves.set(res),
      error: () => {},
    });
  }

  loadAllLeaves(): void {
    this.api.get<LeaveRecord[]>('leave').subscribe({
      next: (res) => this.allLeaves.set(res),
      error: () => {},
    });
  }

  openApplyModal(): void {
    this.applyForm.reset({
      leaveType: 'ANNUAL',
      daysCount: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
    this.isApplyModalOpen.set(true);
  }

  closeApplyModal(): void {
    this.isApplyModalOpen.set(false);
  }

  submitApplication(): void {
    if (this.applyForm.invalid) return;

    this.isSubmitting.set(true);
    this.api.post<LeaveRecord>('leave/apply', this.applyForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeApplyModal();
        this.loadLeaveBalances();
        this.loadMyLeaves();
        if (this.authService.hasPermission('leave.view')) {
          this.loadAllLeaves();
        }
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  openReviewModal(leave: LeaveRecord, isApprove: boolean): void {
    this.selectedLeave.set(leave);
    this.isApproveAction.set(isApprove);
    this.reviewNotesControl.setValue('');
    this.isReviewModalOpen.set(true);
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.selectedLeave.set(null);
  }

  confirmReview(): void {
    const leave = this.selectedLeave();
    if (!leave) return;

    this.isSubmitting.set(true);
    const endpoint = this.isApproveAction()
      ? `leave/${leave.leaveId}/approve`
      : `leave/${leave.leaveId}/reject`;

    this.api.patch(endpoint, { notes: this.reviewNotesControl.value || '' }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeReviewModal();
        this.loadLeaveBalances();
        this.loadAllLeaves();
        this.loadMyLeaves();
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  getStatusVariant(status: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
