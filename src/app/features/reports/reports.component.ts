import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AppTabsComponent, TabItem } from '../../shared/components/tabs/tabs.component';
import { AppDatePickerComponent, DateRange } from '../../shared/components/date-picker/date-picker.component';

export interface EmployeeTaskItem {
  taskId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  totalTimeSpentMinutes?: number;
}

export interface EmployeeAttendanceItem {
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours: number;
  status: string;
  isLate: boolean;
  minutesLate: number;
}

interface FilteredAnalytics {
  period: string;
  startDate?: string;
  endDate?: string;
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  attendanceTotal: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRate: number;
  totalMinutesLate: number;
  averageMinutesLate: number;
  lateRecords: Array<{
    employeeName: string;
    date: string;
    clockInTime: string;
    minutesLate: number;
  }>;
  openTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  departmentsSummary: Array<{
    departmentId: string;
    name: string;
    employeeCount: number;
  }>;
  employeeDetail?: {
    employeeId: string;
    name: string;
    email?: string;
    departmentName?: string;
    designation?: string;
  };
  employeeTasks?: EmployeeTaskItem[];
  attendanceHistory?: EmployeeAttendanceItem[];
}

interface DepartmentItem {
  departmentId: string;
  name: string;
}

interface EmployeeItem {
  employeeId: string;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppBadgeComponent,
    AppButtonComponent,
    AppSelectComponent,
    AppTabsComponent,
    AppDatePickerComponent,
  ],
  templateUrl: "./reports.component.html",
  styleUrl: "./reports.component.scss",
})
export class ReportsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);

  readonly currentTab = signal<'overview' | 'attendance' | 'tasks' | 'ai'>('overview');
  readonly selectedPeriod = signal<string>('month');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');

  readonly reportTabs: TabItem[] = [
    { id: 'overview', label: 'Workforce & Overview' },
    { id: 'attendance', label: 'Attendance & Late Arrivals' },
    { id: 'tasks', label: 'Task Velocity' },
    { id: 'ai', label: 'Gemini AI Synthesis' },
  ];

  readonly customRangeValue = computed(() => ({
    start: this.startDate() ? new Date(this.startDate()) : null,
    end: this.endDate() ? new Date(this.endDate()) : null,
  }));

  onRangeChange(range: DateRange): void {
    if (range.start) {
      const s = new Date(range.start);
      const year = s.getFullYear();
      const month = String(s.getMonth() + 1).padStart(2, '0');
      const day = String(s.getDate()).padStart(2, '0');
      this.startDate.set(`${year}-${month}-${day}`);
    }
    if (range.end) {
      const e = new Date(range.end);
      const year = e.getFullYear();
      const month = String(e.getMonth() + 1).padStart(2, '0');
      const day = String(e.getDate()).padStart(2, '0');
      this.endDate.set(`${year}-${month}-${day}`);
    }
  }

  readonly selectedDepartmentId = signal<string>('');
  readonly selectedEmployeeId = signal<string>('');

  readonly analytics = signal<FilteredAnalytics | null>(null);
  readonly departments = signal<DepartmentItem[]>([]);
  readonly departmentOptions = signal<SelectOption[]>([]);
  readonly employees = signal<EmployeeItem[]>([]);
  readonly employeeOptions = signal<SelectOption[]>([]);

  readonly isGeneratingAi = signal<boolean>(false);
  readonly aiReportText = signal<string>('');
  readonly aiReportModel = signal<string>('Google Gemini AI');
  readonly aiReportTimestamp = signal<string>('');

  readonly periodOptions: SelectOption[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month (Default)', value: 'month' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Custom Date Range', value: 'custom' },
    { label: 'All Time History', value: 'all' },
  ];

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadAnalytics();
  }

  loadFilterOptions(): void {
    this.api.get<DepartmentItem[]>('departments').subscribe({
      next: (depts) => {
        this.departments.set(depts || []);
        const opts: SelectOption[] = [
          { label: 'All Departments', value: '' },
          ...(depts || []).map((d) => ({ label: d.name, value: d.departmentId })),
        ];
        this.departmentOptions.set(opts);
      },
      error: () => {},
    });

    this.api.get<{ data: EmployeeItem[] }>('employees', { limit: 200 }).subscribe({
      next: (res) => {
        const emps = res.data || [];
        this.employees.set(emps);
        const opts: SelectOption[] = [
          { label: 'All Employees', value: '' },
          ...emps.map((e) => ({ label: `${e.firstName} ${e.lastName}`, value: e.employeeId })),
        ];
        this.employeeOptions.set(opts);
      },
      error: () => {},
    });
  }

  loadAnalytics(): void {
    const params: Record<string, string> = {
      period: this.selectedPeriod(),
    };
    if (this.selectedPeriod() === 'custom') {
      if (this.startDate()) params['startDate'] = this.startDate();
      if (this.endDate()) params['endDate'] = this.endDate();
    }
    if (this.selectedDepartmentId()) {
      params['departmentId'] = this.selectedDepartmentId();
    }
    if (this.selectedEmployeeId()) {
      params['employeeId'] = this.selectedEmployeeId();
    }

    this.api.get<FilteredAnalytics>('reports/analytics', params).subscribe({
      next: (res) => this.analytics.set(res),
      error: () => {},
    });
  }

  onPeriodChange(val: string): void {
    this.selectedPeriod.set(val);
    if (val !== 'custom') {
      this.loadAnalytics();
    }
  }

  onStartDateChange(val: string): void {
    this.startDate.set(val);
    if (this.selectedPeriod() === 'custom' && this.startDate() && this.endDate()) {
      this.loadAnalytics();
    }
  }

  onEndDateChange(val: string): void {
    this.endDate.set(val);
    if (this.selectedPeriod() === 'custom' && this.startDate() && this.endDate()) {
      this.loadAnalytics();
    }
  }

  onDepartmentChange(val: string): void {
    this.selectedDepartmentId.set(val);
    this.loadAnalytics();
  }

  onEmployeeChange(val: string): void {
    this.selectedEmployeeId.set(val);
    this.loadAnalytics();
  }

  generateAiReport(): void {
    this.isGeneratingAi.set(true);
    const body: { period?: string; departmentId?: string; startDate?: string; endDate?: string } = {
      period: this.selectedPeriod(),
    };
    if (this.selectedPeriod() === 'custom') {
      if (this.startDate()) body.startDate = this.startDate();
      if (this.endDate()) body.endDate = this.endDate();
    }
    if (this.selectedDepartmentId()) {
      body.departmentId = this.selectedDepartmentId();
    }

    this.api
      .post<{ report: string; generatedAt: string; model: string }>('reports/generate-ai', body)
      .subscribe({
        next: (res) => {
          this.isGeneratingAi.set(false);
          this.aiReportText.set(res.report);
          this.aiReportModel.set(res.model || 'Google Gemini AI');
          this.aiReportTimestamp.set(res.generatedAt || new Date().toISOString());
        },
        error: () => {
          this.isGeneratingAi.set(false);
        },
      });
  }

  exportReport(): void {
    const a = this.analytics();
    const csvContent =
      `data:text/csv;charset=utf-8,` +
      `Metric,Value\n` +
      `Period,${this.selectedPeriod()}\n` +
      `Total Employees,${a?.totalEmployees ?? 0}\n` +
      `Active Employees,${a?.activeEmployees ?? 0}\n` +
      `Total Departments,${a?.totalDepartments ?? 0}\n` +
      `Total Attendance Punches,${a?.attendanceTotal ?? 0}\n` +
      `On-Time Count,${a?.onTimeCount ?? 0}\n` +
      `Late Count,${a?.lateCount ?? 0}\n` +
      `On-Time Compliance Rate,${a?.onTimeRate ?? 0}%\n` +
      `Total Minutes Late,${a?.totalMinutesLate ?? 0}\n` +
      `Average Minutes Late,${a?.averageMinutesLate ?? 0}\n` +
      `Open Tasks,${a?.openTasks ?? 0}\n` +
      `Completed Tasks,${a?.completedTasks ?? 0}\n` +
      `Task Completion Rate,${a?.taskCompletionRate ?? 0}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `workivlab_telemetry_${this.selectedPeriod()}_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
