import { Component, OnInit, OnDestroy, inject, signal, computed, TemplateRef, ViewChild } from '@angular/core';
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
  template: `
    <div class="space-y-6 pb-16">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="page-title">Dashboard</h1>

        <div class="flex items-center space-x-2.5">
          @if (todayAttendance()) {
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
              In at {{ todayAttendance()?.clockInTime | date: 'shortTime' }}
            </span>
            @if (!todayAttendance()?.clockOutTime) {
              <app-button
                variant="secondary"
                size="sm"
                (click)="clockOut()"
                [loading]="isClocking()"
              >
                Clock Out
              </app-button>
            } @else {
              <app-badge variant="primary">Shift Complete</app-badge>
            }
          } @else {
            <app-button size="sm" (click)="clockIn()" [loading]="isClocking()">
              Clock In Now
            </app-button>
          }
          <app-button variant="secondary" size="sm" (click)="openManualPunchModal()">
            + Manual Punch
          </app-button>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4">
        <app-tabs
          [tabs]="periodTabs"
          [activeTab]="selectedPeriod()"
          (activeTabChange)="setPeriod($any($event))"
        ></app-tabs>

        @if (selectedPeriod() === 'custom') {
          <div class="w-full sm:w-80">
            <app-date-picker
              mode="range"
              align="right"
              placeholder="Select custom date range"
              [value]="customRangeValue()"
              (rangeChange)="onRangeChange($event)"
            ></app-date-picker>
          </div>
        }
      </div>

      @if (metrics()?.isPersonalView) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-5 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Assigned Tasks
              </span>
              <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {{ metrics()?.myTasksCount ?? 0 }}
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <div class="card p-5 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Completed Tasks
              </span>
              <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {{ metrics()?.myCompletedTasksCount ?? 0 }}
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div class="card p-5 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Pending Leaves
              </span>
              <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {{ metrics()?.myPendingLeavesCount ?? 0 }}
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div class="rounded-[8px] p-5 bg-[#2A65F6] text-white shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-blue-100 block">
                Hours Logged
              </span>
              <h3 class="text-2xl font-bold text-white mt-2">
                {{ metrics()?.myHoursLoggedThisMonth ?? 0 }}h
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-white/15 text-white flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-[8px] p-5 bg-[#2A65F6] text-white shadow-sm flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-blue-100 block">
                Total Employees
              </span>
              <h3 class="text-2xl font-bold text-white mt-2">
                {{ metrics()?.totalEmployees ?? 0 }}
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-white/15 text-white flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div class="card p-5 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Active Employees
              </span>
              <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {{ metrics()?.activeEmployees ?? 0 }}
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div class="card p-5 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Open Tasks
              </span>
              <h3 class="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                {{ metrics()?.openTasks ?? 0 }}
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>

          <div class="card p-5 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Subscription Plan
              </span>
              <h3 class="text-xl font-bold text-[#2A65F6] mt-2">
                {{ metrics()?.subscription?.plan || 'Free Trial' }}
              </h3>
            </div>
            <div class="w-11 h-11 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
      }

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="card p-4 flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Present</span>
            <span class="text-xl font-bold text-slate-900 dark:text-white">{{ metrics()?.todayPresentCount ?? metrics()?.activeEmployees ?? 0 }}</span>
          </div>
        </div>

        <div class="card p-4 flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Absent</span>
            <span class="text-xl font-bold text-slate-900 dark:text-white">{{ metrics()?.todayAbsentCount ?? 0 }}</span>
          </div>
        </div>

        <div class="card p-4 flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">On Leave</span>
            <span class="text-xl font-bold text-slate-900 dark:text-white">{{ metrics()?.employeesOnLeave ?? 0 }}</span>
          </div>
        </div>

        <div class="card p-4 flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Late Arrivals</span>
            <span class="text-xl font-bold text-slate-900 dark:text-white">{{ metrics()?.todayLateCount ?? metrics()?.lateEmployees?.length ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- My Leave Balances Widget -->
      @if (leaveBalances(); as bal) {
        <div class="card p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-bold text-slate-900 dark:text-white">My Leave Balances</span>
              <span class="text-xs text-slate-400 font-medium">({{ bal.remainingYearly }} of {{ bal.totalYearlyQuota }} days remaining)</span>
            </div>
            <a routerLink="/leave" class="text-xs font-semibold text-[#2A65F6] hover:underline flex items-center">
              Apply Leave &rarr;
            </a>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
            <div class="p-3 rounded-[8px] bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-0.5">
              <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Remaining</span>
              <span class="text-lg font-bold text-[#2A65F6]">{{ bal.remainingYearly }}d</span>
            </div>
            <div class="p-3 rounded-[8px] bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-0.5">
              <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Monthly Left</span>
              <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ bal.remainingThisMonth }}d</span>
            </div>
            @for (t of bal.types; track t.id) {
              <div class="p-3 rounded-[8px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-0.5">
                <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">{{ t.name }}</span>
                <span class="text-base font-bold text-slate-900 dark:text-white">{{ t.remainingYearly }}d <span class="text-[10px] font-normal text-slate-400">/ {{ t.quota }}d</span></span>
              </div>
            }
          </div>
        </div>
      }

      @if (!metrics()?.isPersonalView) {
        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                Today's Late Arrivals
              </h3>
            </div>
            <app-badge [variant]="(metrics()?.lateEmployees?.length || 0) > 0 ? 'warning' : 'primary'">
              {{ metrics()?.lateEmployees?.length || 0 }} Late
            </app-badge>
          </div>

          <ng-template #lateEmployeeCell let-ctx>
            <div class="flex items-center space-x-2.5">
              <div
                class="w-7 h-7 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center font-bold text-xs"
              >
                {{ ctx.row.employeeName[0] }}
              </div>
              <span class="font-semibold text-slate-900 dark:text-white">{{ ctx.row.employeeName }}</span>
            </div>
          </ng-template>

          <ng-template #clockInCell let-ctx>
            <span class="text-xs font-mono text-slate-900 dark:text-slate-200">
              {{ ctx.row.clockInTime | date: 'shortTime' }}
            </span>
          </ng-template>

          <ng-template #delayCell let-ctx>
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-[8px] text-xs font-semibold bg-[#2A65F6]/10 text-[#2A65F6]"
            >
              +{{ ctx.row.minutesLate }}m
            </span>
          </ng-template>

          @if (metrics()?.lateEmployees && metrics()!.lateEmployees!.length > 0) {
            <theme-table
              [rows]="metrics()?.lateEmployees || []"
              [columns]="lateEmployeeColumns"
              [searchable]="false"
              [showFilterButton]="false"
              [showFooter]="false"
              [compact]="true"
            ></theme-table>
          } @else {
            <div class="py-6 text-center rounded-[8px] bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400">
                All team members clocked in on time today.
              </p>
            </div>
          }
        </div>
      }

      @if (topPerformers().length > 0) {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Top Performers</h3>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (p of topPerformers(); track p.employeeId) {
              <div class="card p-5 space-y-3">
                <div class="flex items-start justify-between">
                  <div class="space-y-0.5">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white">{{ p.name }}</h4>
                    <p class="text-xs text-slate-400">{{ p.departmentName || 'General Staff' }}</p>
                  </div>
                  <div class="w-9 h-9 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center font-bold text-sm">
                    #{{ p.rank }}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span class="text-slate-400 block text-[10px] uppercase font-semibold">Tasks Done</span>
                    <span class="font-bold text-slate-900 dark:text-white">{{ p.completedTasksCount }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px] uppercase font-semibold">Punctuality</span>
                    <span class="font-bold text-[#2A65F6]">{{ p.punctualityRate }}%</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Upcoming Meetings</h3>
            </div>
            <a routerLink="/meetings" class="text-xs text-[#2A65F6] hover:underline font-medium">View all</a>
          </div>

          @if (metrics()?.upcomingMeetings && metrics()!.upcomingMeetings!.length > 0) {
            <div class="space-y-2.5">
              @for (meeting of metrics()!.upcomingMeetings!; track meeting.meetingId) {
                <div class="p-3 rounded-[8px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">{{ meeting.title }}</span>
                    <app-badge variant="primary">{{ meeting.meetingType }}</app-badge>
                  </div>
                  <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{{ meeting.startTime | date: 'MMM d, h:mm a' }}</span>
                    <a routerLink="/meetings" class="text-[#2A65F6] hover:underline font-medium">Join</a>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="py-8 text-center text-xs text-slate-400">
              No upcoming meetings.
            </div>
          }
        </div>

        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Upcoming Birthdays</h3>
            </div>
            <a routerLink="/employees" class="text-xs text-[#2A65F6] hover:underline font-medium">Directory</a>
          </div>

          @if (metrics()?.upcomingBirthdays && metrics()!.upcomingBirthdays!.length > 0) {
            <div class="space-y-2.5">
              @for (bday of metrics()!.upcomingBirthdays!; track bday.employeeId) {
                <div class="p-3 rounded-[8px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center font-bold text-xs">
                      {{ bday.name[0] }}
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-900 dark:text-white">{{ bday.name }}</h4>
                      <p class="text-[11px] text-slate-400">{{ bday.departmentName }}</p>
                    </div>
                  </div>
                  <div>
                    @if (bday.daysUntil === 0) {
                      <span class="px-2 py-0.5 rounded-[8px] text-[11px] font-bold bg-[#2A65F6]/10 text-[#2A65F6]">Today</span>
                    } @else {
                      <span class="text-xs font-medium text-slate-500 dark:text-slate-400">in {{ bday.daysUntil }}d</span>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="py-8 text-center text-xs text-slate-400">
              No upcoming birthdays.
            </div>
          }
        </div>

        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-[8px] bg-[#2A65F6]/10 text-[#2A65F6] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Upcoming Holidays</h3>
            </div>
          </div>

          @if (metrics()?.upcomingHolidays && metrics()!.upcomingHolidays!.length > 0) {
            <div class="space-y-2.5">
              @for (holiday of metrics()!.upcomingHolidays!; track holiday.name) {
                <div class="p-3 rounded-[8px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white">{{ holiday.name }}</h4>
                    <p class="text-[11px] text-slate-400">{{ holiday.date }} ({{ holiday.dayOfWeek }})</p>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-[8px] text-[10px] font-semibold bg-[#2A65F6]/10 text-[#2A65F6]">
                    {{ holiday.type }}
                  </span>
                </div>
              }
            </div>
          } @else {
            <div class="py-8 text-center text-xs text-slate-400">No upcoming holidays.</div>
          }
        </div>
      </div>
    <app-modal
      [isOpen]="isManualPunchModalOpen()"
      title="Manual Attendance Punch"
      size="md"
      [showFooter]="true"
      primaryLabel="Save Attendance"
      secondaryLabel="Cancel"
      [primaryLoading]="isSubmittingManual()"
      [primaryDisabled]="!manualDateStr() || !manualClockInTime()"
      (closed)="closeManualPunchModal()"
      (secondaryAction)="closeManualPunchModal()"
      (primaryAction)="submitManualPunch()"
    >
      <div class="space-y-5 py-2">
        <div class="w-full">
          <app-date-picker
            mode="single"
            align="left"
            label="Attendance Date"
            placeholder="Select date"
            [required]="true"
            [value]="manualDateObj()"
            (dateChange)="onManualDateSelected($event)"
          ></app-date-picker>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <app-input
            label="Clock In Time"
            type="time"
            [required]="true"
            [value]="manualClockInTime()"
            (input)="manualClockInTime.set($any($event.target).value)"
          ></app-input>

          <app-input
            label="Clock Out Time"
            type="time"
            [value]="manualClockOutTime()"
            (input)="manualClockOutTime.set($any($event.target).value)"
          ></app-input>
        </div>

        <app-input
          label="Note / Reason"
          placeholder="e.g. Forgot to clock in on shift start"
          [value]="manualNotes()"
          (input)="manualNotes.set($any($event.target).value)"
        ></app-input>
      </div>
    </app-modal>

    <button
      type="button"
      (click)="openAiWorkspace()"
      class="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-[10px] rounded-[8px] bg-[#2A65F6] hover:bg-[#1e53d8] text-white shadow-[0_10px_28px_-4px_rgba(42,101,246,0.55)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
      aria-label="Open AI Workspace Assistant"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
      <span class="text-sm font-semibold">Ask AI</span>
    </button>

    @if (isAiWindowOpen()) {
      <div
        class="fixed inset-0 z-[99999] w-screen h-screen min-h-screen bg-[#f8f9fb] dark:bg-[#14161a] flex flex-col justify-between overflow-hidden animate-fade-in"
      >
        <div class="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-[8px] bg-[#2A65F6] text-white flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span class="text-sm font-bold text-slate-900 dark:text-white">
              {{ authService.currentCompany()?.name || 'WorkivLab' }} AI
            </span>
          </div>

          <div class="flex items-center space-x-2">
            @if (chatMessages().length > 0) {
              <button
                type="button"
                (click)="resetAiChat()"
                class="px-3 py-[10px] rounded-[8px] text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2A65F6] hover:text-[#2A65F6] transition"
              >
                New Chat
              </button>
            }
            <button
              type="button"
              (click)="closeAiWorkspace()"
              class="w-9 h-9 rounded-[8px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition shadow-sm"
              aria-label="Close AI Window"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 sm:px-8 flex flex-col">
          @if (chatMessages().length === 0) {
            <div class="my-auto max-w-4xl w-full mx-auto py-8 flex flex-col items-center">
              <div class="w-14 h-14 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_28px_-4px_rgba(0,0,0,0.08)] flex items-center justify-center text-slate-800 dark:text-white mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>

              <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-center">
                {{ timeGreeting() }},
                <span class="text-slate-500 dark:text-slate-400 font-medium">
                  {{ authService.currentUser()?.firstName || 'Team' }}
                </span>
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
                Hey there! What can I do for your workspace today?
              </p>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-10">
                @for (card of predefinedPrompts; track card.id) {
                  <div
                    class="rounded-[8px] bg-[#f2f4f7]/90 dark:bg-slate-900/90 border border-white dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col justify-between transition hover:shadow-md"
                  >
                    <div>
                      <div class="w-9 h-9 rounded-[8px] bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center mb-5 shadow-sm">
                        @if (card.icon === 'growth') {
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        } @else if (card.icon === 'attendance') {
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        } @else {
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        }
                      </div>

                      <h3 class="text-base font-bold text-slate-900 dark:text-white">
                        {{ card.title }}
                      </h3>
                      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                        {{ card.description }}
                      </p>
                    </div>

                    <button
                      type="button"
                      (click)="runPredefinedPrompt(card)"
                      class="mt-6 w-full py-[10px] px-4 rounded-[8px] bg-white dark:bg-slate-800 hover:bg-[#2A65F6] hover:text-white text-slate-900 dark:text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      {{ card.buttonLabel }}
                    </button>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="max-w-3xl w-full mx-auto py-6 space-y-6">
              @for (msg of chatMessages(); track msg.id) {
                @if (msg.role === 'user') {
                  <div class="flex justify-end">
                    <div class="max-w-xl px-4 py-3 rounded-[8px] bg-[#2A65F6] text-white text-sm shadow-sm">
                      {{ msg.content }}
                    </div>
                  </div>
                } @else {
                  <div class="flex items-start space-x-3.5">
                    <div class="w-8 h-8 rounded-[8px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#2A65F6] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div class="flex-1 space-y-3">
                      <div class="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-sm text-slate-800 dark:text-slate-200 leading-relaxed overflow-hidden">
                        <div [innerHTML]="renderMarkdown(msg.displayedContent || msg.content)"></div>
                        @if (msg.isStreaming) {
                          <span class="inline-block w-1.5 h-4 ml-1 align-middle bg-[#2A65F6] animate-pulse"></span>
                        }
                      </div>

                      @if (msg.warning) {
                        <div class="p-3 rounded-[8px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200">
                          {{ msg.warning }}
                        </div>
                      }

                      @if (msg.records && msg.records.length > 0 && !msg.isStreaming) {
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          @for (rec of msg.records; track rec.title) {
                            <div
                              (click)="navigateFromAi(rec.link)"
                              class="p-3 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2A65F6] cursor-pointer flex items-center justify-between transition"
                            >
                              <div class="min-w-0 pr-2">
                                <div class="text-xs font-bold text-slate-900 dark:text-white truncate">{{ rec.title }}</div>
                                <div class="text-[11px] text-slate-400 truncate">{{ rec.subtitle }}</div>
                              </div>
                              <span class="px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-[#2A65F6]/10 text-[#2A65F6] flex-shrink-0">
                                {{ rec.type }}
                              </span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              }

              @if (isAiThinking()) {
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-[8px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#2A65F6] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span class="text-xs font-medium text-slate-400 animate-pulse">
                    Analyzing workspace telemetry...
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <div class="px-4 sm:px-8 pb-8 pt-3 flex-shrink-0">
          <div
            class="max-w-3xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.07)] rounded-[8px] px-3 py-2 flex items-center gap-2.5"
          >
            <button
              type="button"
              (click)="resetAiChat()"
              title="New conversation"
              class="w-8 h-8 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <input
              type="text"
              [(ngModel)]="aiPromptInput"
              (keyup.enter)="submitAiPrompt()"
              placeholder="Write a message here..."
              class="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none py-1.5"
            />

            <button
              type="button"
              (click)="submitAiPrompt()"
              [disabled]="!aiPromptInput.trim() || isAiThinking()"
              class="w-9 h-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 hover:bg-[#2A65F6] hover:text-white disabled:opacity-40 text-slate-700 dark:text-slate-200 flex items-center justify-center transition flex-shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

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

  /** Loads the AI top-performers leaderboard. */
  private loadTopPerformers(): void {
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
