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
  templateUrl: "./leave.component.html",
  styleUrl: "./leave.component.scss",
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
