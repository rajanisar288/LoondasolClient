import { Component, OnInit, OnDestroy, inject, signal, computed, TemplateRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { SharedTableComponent, SharedTableColumn } from '../../shared/components/table/table.component';
import { AppTabsComponent, TabItem } from '../../shared/components/tabs/tabs.component';
import { AppDatePickerComponent, DateRange } from '../../shared/components/date-picker/date-picker.component';
import { WorkspaceDatePipe } from '../../shared/pipes/workspace-locale.pipes';

export interface UpcomingMeetingItem {
  meetingId: string;
  title: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  hostName: string;
  roomId: string;
  status: string;
}

export interface UpcomingBirthdayItem {
  employeeId: string;
  name: string;
  departmentName?: string;
  jobTitle?: string;
  dateOfBirth: string;
  daysUntil: number;
}

export interface UpcomingHolidayItem {
  name: string;
  date: string;
  dayOfWeek: string;
  type: string;
  daysUntil: number;
}

export interface TodayLateEmployeeItem {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  scheduledStartTime?: string;
  clockInTime: string;
  minutesLate: number;
  status: string;
}

export interface AiPredefinedPromptCard {
  id: string;
  icon: 'growth' | 'attendance' | 'performance';
  title: string;
  description: string;
  buttonLabel: string;
  prompt: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string;
  isStreaming?: boolean;
  warning?: string;
  records?: Array<{ type: string; title: string; subtitle?: string; link: string }>;
  timestamp: Date;
}

interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  employeesOnLeave: number;
  totalDepartments: number;
  pendingLeaves: number;
  openTasks: number;
  completedTasks: number;
  todayPresentCount?: number;
  todayAbsentCount?: number;
  todayLateCount?: number;
  subscription: {
    plan: string;
    status: string;
    trialEndsAt?: string;
  };
  aiUsage?: {
    used: number;
    limit: number;
    plan: string;
  };
  seatUsage?: {
    purchasedSeats: number;
    totalActiveSeats: number;
    availableSeats: number;
  };
  upcomingMeetings?: UpcomingMeetingItem[];
  upcomingBirthdays?: UpcomingBirthdayItem[];
  upcomingHolidays?: UpcomingHolidayItem[];
  lateEmployees?: TodayLateEmployeeItem[];
  isPersonalView?: boolean;
  myTasksCount?: number;
  myCompletedTasksCount?: number;
  myPendingLeavesCount?: number;
  myHoursLoggedThisMonth?: number;
}

export const AI_PREDEFINED_PROMPTS: AiPredefinedPromptCard[] = [
  {
    id: 'company_growth',
    icon: 'growth',
    title: "How's company growth?",
    description:
      "Get a quick overview of your company's growth, active workforce, and operational velocity.",
    buttonLabel: 'View Report',
    prompt:
      'Analyze our company growth, active headcount, department coverage, and operational task velocity.',
  },
  {
    id: 'attendance_insights',
    icon: 'attendance',
    title: 'Any attendance issues?',
    description:
      'Identify late arrival spikes or absences in daily attendance and get suggestions to optimize schedules.',
    buttonLabel: 'Analyze Attendance',
    prompt:
      'Analyze today attendance, late arrivals, and pending leave requests and suggest improvements.',
  },
  {
    id: 'team_performance',
    icon: 'performance',
    title: 'Which teams work best?',
    description:
      'See the top-performing staff based on completed tasks, sprint deliverables, and punctuality.',
    buttonLabel: 'View Insights',
    prompt:
      'Show me our top-performing employees and teams based on completed tasks and punctuality rate.',
  },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AppButtonComponent,
    AppBadgeComponent,
    AppInputComponent,
    AppModalComponent,
    SharedTableComponent,
    AppTabsComponent,
    AppDatePickerComponent,
    WorkspaceDatePipe,
  ],
  templateUrl: "./dashboard.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly Math = Math;

  @ViewChild('lateEmployeeCell') lateEmployeeCell?: TemplateRef<any>;
  @ViewChild('clockInCell') clockInCell?: TemplateRef<any>;
  @ViewChild('delayCell') delayCell?: TemplateRef<any>;

  readonly predefinedPrompts = AI_PREDEFINED_PROMPTS;
  readonly isAiWindowOpen = signal<boolean>(false);
  readonly isAiThinking = signal<boolean>(false);
  readonly chatMessages = signal<AiChatMessage[]>([]);
  aiPromptInput = '';
  private streamTimer: ReturnType<typeof setInterval> | null = null;

  /** Returns the column definitions for the late arrivals table. */
  get lateEmployeeColumns(): SharedTableColumn<TodayLateEmployeeItem>[] {
    return [
      {
        key: 'employeeName',
        header: 'Employee',
        template: this.lateEmployeeCell,
      },
      {
        key: 'departmentName',
        header: 'Department',
        formatter: (val) => String(val || 'General Staff'),
      },
      {
        key: 'scheduledStartTime',
        header: 'Shift Expected',
        emptyValue: '—',
      },
      {
        key: 'clockInTime',
        header: 'Clock-In',
        template: this.clockInCell,
      },
      {
        key: 'minutesLate',
        header: 'Delay',
        align: 'right',
        template: this.delayCell,
      },
    ];
  }

  readonly metrics = signal<DashboardMetrics | null>(null);
  readonly todayAttendance = signal<{ clockInTime?: string; clockOutTime?: string } | null>(null);
  readonly isClocking = signal<boolean>(false);
  readonly topPerformers = signal<any[]>([]);
  readonly leaveBalances = signal<any>(null);

  readonly selectedPeriod = signal<'today' | 'weekly' | 'monthly' | 'custom'>('today');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');

  readonly periodTabs: TabItem[] = [
    { id: 'today', label: 'Today' },
    { id: 'weekly', label: 'This Week' },
    { id: 'monthly', label: 'This Month' },
    { id: 'custom', label: 'Custom Range' },
  ];

  readonly customRangeValue = computed(() => {
    return {
      start: this.startDate() ? new Date(this.startDate()) : null,
      end: this.endDate() ? new Date(this.endDate()) : null,
    };
  });

  /** Computes a time-of-day greeting for the AI assistant header. */
  readonly timeGreeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  /** Updates custom date range filters and reloads dashboard metrics. */
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
    if (this.selectedPeriod() === 'custom') {
      this.loadMetrics();
    }
  }

  /** Loads initial dashboard metrics, attendance status, top performers, and leave balances. */
  ngOnInit(): void {
    if (this.authService.isSuperAdmin()) {
      this.router.navigate(['/superadmin']);
      return;
    }
    this.loadMetrics();
    this.loadTodayAttendance();
    this.loadTopPerformers();
    this.loadLeaveBalances();
  }

  loadLeaveBalances(): void {
    this.api.get<any>('leave/balances').subscribe({
      next: (res) => this.leaveBalances.set(res),
      error: () => {},
    });
  }

  /** Cleans up any active streaming timer on destroy. */
  ngOnDestroy(): void {
    this.clearStreamTimer();
  }

  /** Opens the full-window AI assistant modal. */
  openAiWorkspace(): void {
    this.isAiWindowOpen.set(true);
  }

  /** Closes the full-window AI assistant modal. */
  closeAiWorkspace(): void {
    this.clearStreamTimer();
    this.isAiWindowOpen.set(false);
  }

  /** Clears conversation history and returns to the predefined prompt cards view. */
  resetAiChat(): void {
    this.clearStreamTimer();
    this.chatMessages.set([]);
    this.isAiThinking.set(false);
  }

  /** Triggers an AI analysis from one of the predefined prompt cards. */
  runPredefinedPrompt(card: AiPredefinedPromptCard): void {
    this.aiPromptInput = card.prompt;
    this.submitAiPrompt();
  }

  /** Submits the current prompt to the workspace AI intelligence and streams the response. */
  submitAiPrompt(): void {
    const query = this.aiPromptInput.trim();
    if (!query || this.isAiThinking()) return;
    this.aiPromptInput = '';

    const userMsg: AiChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    this.chatMessages.update((list) => [...list, userMsg]);
    this.isAiThinking.set(true);

    const lower = query.toLowerCase();
    const isOwner = this.authService.currentUser()?.isOwner;
    const perms = this.authService.currentUser()?.permissions || [];

    if (lower.includes('salary') && !isOwner && !perms.includes('salary.view') && !perms.includes('employees.salary.view')) {
      this.isAiThinking.set(false);
      this.streamAssistantMessage(
        'Access Restricted: Your current role does not hold permission to query payroll or salary data.',
        [],
        'Role-Based Access Control prevented access to restricted payroll records.',
      );
      return;
    }

    const fallbackInsight = this.buildContextualInsight(lower);

    this.api.post<{ answer: string; modelUsed: string }>('ai/ask', { prompt: query }).subscribe({
      next: (aiRes) => {
        const answerText = aiRes?.answer || fallbackInsight;
        this.fetchSmartSearchRecords(query, answerText);
      },
      error: () => {
        this.fetchSmartSearchRecords(query, fallbackInsight);
      },
    });
  }

  /** Queries smart-search records and initiates streaming of the AI response. */
  private fetchSmartSearchRecords(query: string, answerText: string): void {
    this.api
      .post<{ results: Array<{ type: string; title: string; subtitle?: string; link: string }> }>(
        'ai/smart-search',
        { query },
      )
      .subscribe({
        next: (res) => {
          this.isAiThinking.set(false);
          this.streamAssistantMessage(answerText, res?.results || []);
        },
        error: () => {
          this.isAiThinking.set(false);
          this.streamAssistantMessage(answerText, []);
        },
      });
  }

  /** Formats raw Markdown responses (tables, headers, bold, bullet lists) into clean ChatGPT/DeepSeek style HTML. */
  renderMarkdown(content: string): string {
    if (!content) return '';

    // 1. Pre-clean garbled/corrupted asterisk noise or invalid repeating patterns
    let text = content
      .replace(/\*{4,}/g, '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 2. Parse Markdown Tables (| col1 | col2 |)
    const lines = text.split('\n');
    let inTable = false;
    let tableHtml = '';
    const processedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        // Skip markdown separator lines like |---|---| or |:---:|
        if (/^\|[\s\-:]+(\|[\s\-:]+)+\|$/.test(line)) {
          continue;
        }

        const cells = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

        if (!inTable) {
          inTable = true;
          tableHtml = `<div class="overflow-x-auto my-3 rounded-[8px] border border-slate-200 dark:border-slate-800 shadow-2xs"><table class="w-full text-left text-xs border-collapse"><thead><tr class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">`;
          cells.forEach((cell) => {
            tableHtml += `<th class="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 font-semibold">${cell}</th>`;
          });
          tableHtml += `</tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">`;
        } else {
          tableHtml += `<tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">`;
          cells.forEach((cell) => {
            tableHtml += `<td class="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">${cell}</td>`;
          });
          tableHtml += `</tr>`;
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += `</tbody></table></div>`;
          processedLines.push(tableHtml);
          tableHtml = '';
        }
        processedLines.push(lines[i]);
      }
    }

    if (inTable) {
      tableHtml += `</tbody></table></div>`;
      processedLines.push(tableHtml);
    }

    text = processedLines.join('\n');

    // 3. Format Headers
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1">$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-slate-900 dark:text-white mt-4 mb-1.5">$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">$1</h1>');

    // 4. Format Bold & Italics
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800 dark:text-slate-200">$1</em>');

    // 5. Format Inline Code
    text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-xs">$1</code>');

    // 6. Format Bullet Points (- or *)
    text = text.replace(/^\s*[\-\*]\s+(.*$)/gim, '<div class="flex items-start space-x-2 my-1 pl-1"><span class="text-[#2A65F6] font-bold text-xs mt-0.5">•</span><span class="text-slate-700 dark:text-slate-300 text-xs">$1</span></div>');

    // 7. Format Paragraph Breaks
    text = text.replace(/\n{2,}/g, '<div class="h-2"></div>');
    text = text.replace(/\n/g, '<br/>');

    return text;
  }

  /** Builds a data-backed workspace summary using live dashboard metrics. */
  private buildContextualInsight(lowerQuery: string): string {
    const m = this.metrics();
    const performers = this.topPerformers();
    if (lowerQuery.includes('growth') || lowerQuery.includes('headcount') || lowerQuery.includes('velocity')) {
      return `### Workspace Growth & Velocity Report
- **Total Headcount:** ${m?.totalEmployees ?? 0} team members (${m?.activeEmployees ?? 0} active)
- **Sprint Delivery:** ${m?.openTasks ?? 0} in progress, ${m?.completedTasks ?? 0} completed
- **Subscription Tier:** ${m?.subscription?.plan || 'Free Trial'} (${m?.subscription?.status || 'Active'})`;
    }
    if (lowerQuery.includes('attendance') || lowerQuery.includes('late') || lowerQuery.includes('leave')) {
      const lateItems = m?.lateEmployees || [];
      let lateTable = '';
      if (lateItems.length > 0) {
        lateTable = `\n| Employee | Department | Clock-In | Delay |\n| --- | --- | --- | --- |\n` +
          lateItems.map((e: any) => `| ${e.employeeName} | ${e.departmentName || 'Staff'} | ${e.clockInTime} | ${e.minutesLate}m late |`).join('\n');
      }

      return `### Today's Attendance & Schedule Overview
- **Present Today:** ${m?.todayPresentCount ?? m?.activeEmployees ?? 0} team members
- **On Approved Leave:** ${m?.employeesOnLeave ?? 0} (${m?.pendingLeaves ?? 0} pending)
- **Late Arrivals Today:** ${m?.todayLateCount ?? lateItems.length ?? 0} recorded${lateTable}`;
    }
    if (lowerQuery.includes('perform') || lowerQuery.includes('best') || lowerQuery.includes('team')) {
      if (performers.length > 0) {
        const tableRows = performers
          .slice(0, 5)
          .map((p, idx) => `| #${idx + 1} ${p.name} | ${p.departmentName || 'General'} | ${p.completedTasksCount} tasks | ${p.punctualityRate}% |`)
          .join('\n');
        return `### Top Performing Team Members
| Rank & Name | Department | Deliverables | Punctuality |
| --- | --- | --- | --- |
${tableRows}`;
      }
      return `### Team Performance Insights
- **Completed Tasks:** ${m?.completedTasks ?? 0} deliverables
- **Active Task Backlog:** ${m?.openTasks ?? 0} open tasks across ${m?.activeEmployees ?? 0} team members`;
    }
    return `### Workspace Intelligence Summary
- **Active Team Members:** ${m?.activeEmployees ?? 0} of ${m?.totalEmployees ?? 0} employees
- **Sprint Backlog:** ${m?.completedTasks ?? 0} completed, ${m?.openTasks ?? 0} open
- **Today Attendance:** ${m?.todayPresentCount ?? m?.activeEmployees ?? 0} present, ${m?.employeesOnLeave ?? 0} on leave`;
  }

  /** Streams assistant text smoothly word-by-word for an industry-grade AI experience. */
  private streamAssistantMessage(
    fullText: string,
    records: Array<{ type: string; title: string; subtitle?: string; link: string }>,
    warning?: string,
  ): void {
    this.clearStreamTimer();
    const msgId = `a-${Date.now()}`;
    const tokens = fullText.split(/(?=[ \n])/);
    let index = 0;

    const assistantMsg: AiChatMessage = {
      id: msgId,
      role: 'assistant',
      content: fullText,
      displayedContent: '',
      isStreaming: true,
      warning,
      records,
      timestamp: new Date(),
    };
    this.chatMessages.update((list) => [...list, assistantMsg]);

    this.streamTimer = setInterval(() => {
      const step = Math.min(index + 2, tokens.length);
      const currentText = tokens.slice(0, step).join('');
      index = step;
      const done = index >= tokens.length;

      this.chatMessages.update((list) =>
        list.map((item) =>
          item.id === msgId
            ? { ...item, displayedContent: currentText, isStreaming: !done }
            : item,
        ),
      );

      if (done) {
        this.clearStreamTimer();
      }
    }, 24);
  }

  /** Stops the active streaming interval timer if running. */
  private clearStreamTimer(): void {
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
  }

  /** Closes the AI overlay and navigates to a matched workspace record. */
  navigateFromAi(link: string): void {
    this.closeAiWorkspace();
    this.router.navigate([link]);
  }

  /** Sets the active telemetry period tab and reloads metrics. */
  setPeriod(period: 'today' | 'weekly' | 'monthly' | 'custom'): void {
    this.selectedPeriod.set(period);
    this.loadMetrics();
  }

  readonly isTopPerformerEnabled = computed(() => {
    const comp = this.authService.currentCompany();
    return comp ? comp.topPerformerEnabled !== false : true;
  });

  /** Loads the AI top-performers leaderboard. */
  private loadTopPerformers(): void {
    if (!this.isTopPerformerEnabled()) {
      this.topPerformers.set([]);
      return;
    }
    this.api.get<any[]>('ai/top-performers').subscribe({
      next: (data) => this.topPerformers.set(data || []),
      error: () => {},
    });
  }

  /** Fetches dashboard telemetry metrics from the backend. */
  loadMetrics(): void {
    const params: Record<string, string> = {
      period: this.selectedPeriod(),
    };
    if (this.selectedPeriod() === 'custom') {
      if (this.startDate()) params['startDate'] = this.startDate();
      if (this.endDate()) params['endDate'] = this.endDate();
    }
    this.api.get<DashboardMetrics>('reports/dashboard', params).subscribe({
      next: (data) => this.metrics.set(data),
      error: () => {},
    });
  }

  /** Loads today's attendance clock-in/clock-out state for the current user. */
  private loadTodayAttendance(): void {
    this.api.get<{ clockInTime?: string; clockOutTime?: string }>('attendance/today').subscribe({
      next: (record) => this.todayAttendance.set(record),
      error: () => {},
    });
  }

  /** Clocks the current user in for today's shift. */
  clockIn(): void {
    this.isClocking.set(true);
    this.api.post('attendance/clock-in', {}).subscribe({
      next: (record) => {
        this.todayAttendance.set(record as { clockInTime?: string });
        this.isClocking.set(false);
      },
      error: () => this.isClocking.set(false),
    });
  }

  readonly isManualPunchModalOpen = signal(false);
  readonly manualDateStr = signal('');
  readonly manualDateObj = signal<Date | null>(null);
  readonly manualClockInTime = signal('09:00');
  readonly manualClockOutTime = signal('18:00');
  readonly manualNotes = signal('');
  readonly isSubmittingManual = signal(false);

  /** Opens the manual attendance punch modal with default times. */
  openManualPunchModal(): void {
    const now = new Date();
    this.manualDateObj.set(now);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.manualDateStr.set(`${year}-${month}-${day}`);
    this.manualClockInTime.set('09:00');
    this.manualClockOutTime.set('18:00');
    this.manualNotes.set('');
    this.isManualPunchModalOpen.set(true);
  }

  /** Closes the manual attendance punch modal. */
  closeManualPunchModal(): void {
    this.isManualPunchModalOpen.set(false);
  }

  /** Handles date selection in the manual punch datepicker. */
  onManualDateSelected(d: Date | null): void {
    this.manualDateObj.set(d);
    if (!d) {
      this.manualDateStr.set('');
      return;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.manualDateStr.set(`${year}-${month}-${day}`);
  }

  /** Submits a manual attendance punch record to the API. */
  submitManualPunch(): void {
    if (!this.manualDateStr() || !this.manualClockInTime()) return;
    this.isSubmittingManual.set(true);
    this.api
      .post('attendance/manual', {
        date: this.manualDateStr(),
        clockInTime: this.manualClockInTime(),
        clockOutTime: this.manualClockOutTime() || undefined,
        notes: this.manualNotes() || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmittingManual.set(false);
          this.closeManualPunchModal();
          this.loadTodayAttendance();
          this.loadMetrics();
        },
        error: () => this.isSubmittingManual.set(false),
      });
  }

  /** Clocks the current user out from today's shift. */
  clockOut(): void {
    this.isClocking.set(true);
    this.api.post('attendance/clock-out', {}).subscribe({
      next: (record) => {
        this.todayAttendance.set(record as { clockInTime?: string; clockOutTime?: string });
        this.isClocking.set(false);
      },
      error: () => this.isClocking.set(false),
    });
  }
}
