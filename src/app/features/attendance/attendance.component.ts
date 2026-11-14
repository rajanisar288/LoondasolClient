import { Component, OnInit, inject, signal, computed, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AppDatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { AppAvatarComponent } from '../../shared/components/avatar/avatar.component';
import { SharedTableComponent, SharedTableColumn } from '../../shared/components/table/table.component';
import { WorkspaceDatePipe } from '../../shared/pipes/workspace-locale.pipes';

interface AttendanceRecord {
  employeeName: string;
  avatarUrl?: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  status: string;
  notes?: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppBadgeComponent,
    AppModalComponent,
    AppInputComponent,
    AppSelectComponent,
    AppDatePickerComponent,
    AppAvatarComponent,
    SharedTableComponent,
    WorkspaceDatePipe,
  ],
  templateUrl: "./attendance.component.html",
  styleUrl: "./attendance.component.scss",
})
export class AttendanceComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);

  @ViewChild('employeeCell') employeeCell?: TemplateRef<any>;
  @ViewChild('clockInCell') clockInCell?: TemplateRef<any>;
  @ViewChild('clockOutCell') clockOutCell?: TemplateRef<any>;
  @ViewChild('hoursCell') hoursCell?: TemplateRef<any>;
  @ViewChild('statusCell') statusCell?: TemplateRef<any>;

  readonly statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Present', value: 'PRESENT' },
    { label: 'Late', value: 'LATE' },
    { label: 'Half Day', value: 'HALF_DAY' },
    { label: 'Absent', value: 'ABSENT' },
  ];
  selectedStatusFilter = '';

  /** Returns the column configuration for the attendance table. */
  get attendanceColumns(): SharedTableColumn<AttendanceRecord>[] {
    return [
      {
        key: 'employeeName',
        header: 'Employee',
        sortable: true,
        template: this.employeeCell,
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
      },
      {
        key: 'clockInTime',
        header: 'Clock In',
        template: this.clockInCell,
      },
      {
        key: 'clockOutTime',
        header: 'Clock Out',
        template: this.clockOutCell,
      },
      {
        key: 'totalHours',
        header: 'Hours',
        template: this.hoursCell,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        template: this.statusCell,
      },
    ];
  }

  readonly records = signal<AttendanceRecord[]>([]);
  readonly todayRecord = signal<AttendanceRecord | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly actionError = signal<string | null>(null);
  readonly actionSuccess = signal<string | null>(null);

  readonly searchQuery = signal<string>('');
  readonly filterStatus = signal<string>('');
  readonly filterDate = signal<string>('');
  readonly filterDateObj = signal<Date | null>(null);
  readonly isFilterModalOpen = signal<boolean>(false);

  readonly isManualPunchModalOpen = signal<boolean>(false);
  readonly isSubmittingManual = signal<boolean>(false);
  readonly manualDateObj = signal<Date>(new Date());
  readonly manualDateStr = signal<string>(this.formatDateToYmd(new Date()));
  readonly manualClockInTime = signal<string>('09:00');
  readonly manualClockOutTime = signal<string>('18:00');
  readonly manualNotes = signal<string>('');

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  /** Computes the filtered list of attendance records. */
  readonly filteredRecords = computed(() => {
    let list = this.records();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter((r) => r.employeeName.toLowerCase().includes(q));
    }
    if (this.filterStatus()) {
      list = list.filter((r) => r.status === this.filterStatus());
    }
    if (this.filterDate()) {
      list = list.filter((r) => r.date === this.filterDate());
    }
    return list;
  });

  /** Loads today's attendance status and full attendance history on init. */
  ngOnInit(): void {
    this.loadToday();
    this.loadAll();
  }

  /** Formats a Date object as YYYY-MM-DD. */
  private formatDateToYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Filters attendance logs when a date is picked from the header date picker. */
  onFilterDateChange(date: Date | null): void {
    this.filterDateObj.set(date);
    this.filterDate.set(date ? this.formatDateToYmd(date) : '');
    this.currentPage.set(1);
  }

  /** Clears the active date filter. */
  clearDateFilter(): void {
    this.filterDateObj.set(null);
    this.filterDate.set('');
    this.currentPage.set(1);
  }

  /** Resets all search and status filters. */
  resetFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('');
    this.selectedStatusFilter = '';
    this.clearDateFilter();
    this.isFilterModalOpen.set(false);
  }

  /** Exports current filtered attendance records to a CSV file. */
  exportAttendanceCsv(): void {
    const recordsToExport = this.filteredRecords();
    if (!recordsToExport || recordsToExport.length === 0) {
      this.actionError.set('No attendance records available to export.');
      return;
    }

    const headers = ['Employee Name', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status', 'Notes'];
    const rows = recordsToExport.map((r) => [
      `"${(r.employeeName || '').replace(/"/g, '""')}"`,
      `"${(r.date || '').replace(/"/g, '""')}"`,
      `"${(r.clockInTime || '').replace(/"/g, '""')}"`,
      `"${(r.clockOutTime || '').replace(/"/g, '""')}"`,
      `"${r.totalHours != null ? r.totalHours : ''}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_export_${this.formatDateToYmd(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.actionSuccess.set(`Exported ${recordsToExport.length} attendance records to CSV.`);
  }

  /** Opens the manual attendance punch modal with default shift times. */
  openManualPunchModal(): void {
    const now = new Date();
    this.manualDateObj.set(now);
    this.manualDateStr.set(this.formatDateToYmd(now));
    this.manualClockInTime.set('09:00');
    this.manualClockOutTime.set('18:00');
    this.manualNotes.set('');
    this.actionError.set(null);
    this.isManualPunchModalOpen.set(true);
  }

  /** Closes the manual attendance punch modal. */
  closeManualPunchModal(): void {
    this.isManualPunchModalOpen.set(false);
  }

  /** Updates the manual punch date when selected in the dashboard date picker. */
  onManualDateSelected(date: Date | null): void {
    if (!date) return;
    this.manualDateObj.set(date);
    this.manualDateStr.set(this.formatDateToYmd(date));
  }

  /** Syncs start and end times chosen inside the date picker popover. */
  onManualTimeRangeSelected(range: { startTime: string; endTime: string }): void {
    if (range.startTime) {
      this.manualClockInTime.set(range.startTime);
    }
    if (range.endTime) {
      this.manualClockOutTime.set(range.endTime);
    }
  }

  /** Submits the manual attendance punch for the selected date and times. */
  submitManualPunch(): void {
    const date = this.manualDateStr();
    const clockInTime = this.manualClockInTime();
    if (!date || !clockInTime) return;

    this.isSubmittingManual.set(true);
    this.actionError.set(null);
    this.actionSuccess.set(null);

    const payload: Record<string, string> = {
      date,
      clockInTime,
    };
    if (this.manualClockOutTime()) {
      payload['clockOutTime'] = this.manualClockOutTime();
    }
    if (this.manualNotes().trim()) {
      payload['notes'] = this.manualNotes().trim();
    }

    this.api.post<AttendanceRecord>('attendance/manual', payload).subscribe({
      next: () => {
        this.isSubmittingManual.set(false);
        this.closeManualPunchModal();
        this.actionSuccess.set(`Attendance recorded for ${date}.`);
        this.loadToday();
        this.loadAll();
      },
      error: (err) => {
        this.isSubmittingManual.set(false);
        this.actionError.set(err?.error?.message || 'Failed to save manual attendance punch');
      },
    });
  }

  /** Maps attendance status to badge color variant. */
  getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'PRESENT':
      case 'COMPLETED':
        return 'success';
      case 'LATE':
      case 'HALF_DAY':
        return 'warning';
      case 'ABSENT':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  /** Loads today's attendance record for the current user. */
  loadToday(): void {
    this.api.get<AttendanceRecord>('attendance/today').subscribe({
      next: (res) => this.todayRecord.set(res),
      error: () => {},
    });
  }

  /** Loads all attendance records from the backend. */
  loadAll(): void {
    this.api.get<AttendanceRecord[]>('attendance').subscribe({
      next: (res) => this.records.set(res || []),
      error: () => {},
    });
  }

  /** Clocks in the current user for today. */
  clockIn(): void {
    this.isLoading.set(true);
    this.actionError.set(null);
    this.api.post<AttendanceRecord>('attendance/clock-in', {}).subscribe({
      next: (res) => {
        this.todayRecord.set(res);
        this.isLoading.set(false);
        this.loadAll();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.actionError.set(err?.error?.message || 'Unable to clock in');
      },
    });
  }

  /** Clocks out the current user for today. */
  clockOut(): void {
    this.isLoading.set(true);
    this.actionError.set(null);
    this.api.post<AttendanceRecord>('attendance/clock-out', {}).subscribe({
      next: (res) => {
        this.todayRecord.set(res);
        this.isLoading.set(false);
        this.loadAll();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.actionError.set(err?.error?.message || 'Unable to clock out');
      },
    });
  }
}
