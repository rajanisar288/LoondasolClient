import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { AppCheckboxComponent } from '../checkbox/checkbox.component';

export interface PermissionItem {
  code: string;
  label: string;
  iconType?: 'view' | 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'send' | 'other';
}

export interface PermissionModule {
  id: string;
  name: string;
  iconSvg: string;
  iconBg: string;
  iconColor: string;
  permissions: PermissionItem[];
}

export const SYSTEM_PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'users',
    name: 'Users',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    permissions: [
      { code: 'users.view', label: 'View', iconType: 'view' },
      { code: 'users.create', label: 'Create', iconType: 'create' },
      { code: 'users.update', label: 'Update', iconType: 'update' },
      { code: 'users.delete', label: 'Delete', iconType: 'delete' },
      { code: 'users.activate', label: 'Activate', iconType: 'approve' },
      { code: 'users.deactivate', label: 'Deactivate', iconType: 'reject' },
    ],
  },
  {
    id: 'employees',
    name: 'Employees',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path stroke-linecap="round" stroke-linejoin="round" d="m16 11 2 2 4-4"/></svg>`,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400',
    permissions: [
      { code: 'employees.view', label: 'View', iconType: 'view' },
      { code: 'employees.create', label: 'Create', iconType: 'create' },
      { code: 'employees.update', label: 'Update', iconType: 'update' },
      { code: 'employees.delete', label: 'Delete', iconType: 'delete' },
      { code: 'employees.salary.view', label: 'View Salary', iconType: 'view' },
      { code: 'employees.salary.update', label: 'Update Salary', iconType: 'update' },
    ],
  },
  {
    id: 'roles',
    name: 'Roles & Permissions',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2 2 4-4"/></svg>`,
    iconBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    iconColor: 'text-teal-600 dark:text-teal-400',
    permissions: [
      { code: 'roles.view', label: 'View', iconType: 'view' },
      { code: 'roles.create', label: 'Create', iconType: 'create' },
      { code: 'roles.update', label: 'Update', iconType: 'update' },
      { code: 'roles.delete', label: 'Delete', iconType: 'delete' },
      { code: 'permissions.view', label: 'View Permissions', iconType: 'view' },
      { code: 'permissions.assign', label: 'Assign Permissions', iconType: 'update' },
    ],
  },
  {
    id: 'departments',
    name: 'Departments',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path stroke-linecap="round" stroke-linejoin="round" d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0 2 2h-2"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 6h4"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 10h4"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 14h4"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 18h4"/></svg>`,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    permissions: [
      { code: 'departments.view', label: 'View', iconType: 'view' },
      { code: 'departments.create', label: 'Create', iconType: 'create' },
      { code: 'departments.update', label: 'Update', iconType: 'update' },
      { code: 'departments.delete', label: 'Delete', iconType: 'delete' },
    ],
  },
  {
    id: 'branches',
    name: 'Branches & Locations',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    iconBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
    iconColor: 'text-sky-600 dark:text-sky-400',
    permissions: [
      { code: 'branches.view', label: 'View', iconType: 'view' },
      { code: 'branches.create', label: 'Create', iconType: 'create' },
      { code: 'branches.update', label: 'Update', iconType: 'update' },
      { code: 'branches.delete', label: 'Delete', iconType: 'delete' },
    ],
  },
  {
    id: 'attendance',
    name: 'Attendance & Time Tracking',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    permissions: [
      { code: 'attendance.view', label: 'View', iconType: 'view' },
      { code: 'attendance.create', label: 'Clock In / Record', iconType: 'create' },
      { code: 'attendance.update', label: 'Update Logs', iconType: 'update' },
    ],
  },
  {
    id: 'leave',
    name: 'Leave Management',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><rect width="18" height="18" x="3" y="4" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 2v4M8 2v4M3 10h18"/><path stroke-linecap="round" stroke-linejoin="round" d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>`,
    iconBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
    iconColor: 'text-violet-600 dark:text-violet-400',
    permissions: [
      { code: 'leave.view', label: 'View', iconType: 'view' },
      { code: 'leave.create', label: 'Apply', iconType: 'create' },
      { code: 'leave.update', label: 'Update', iconType: 'update' },
      { code: 'leave.approve', label: 'Approve', iconType: 'approve' },
      { code: 'leave.reject', label: 'Reject', iconType: 'reject' },
    ],
  },
  {
    id: 'payroll',
    name: 'Payroll & Salary Slips',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 12h.01M18 12h.01"/></svg>`,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    permissions: [
      { code: 'payroll.view', label: 'View', iconType: 'view' },
      { code: 'payroll.generate', label: 'Generate', iconType: 'create' },
      { code: 'payroll.update', label: 'Disburse / Update', iconType: 'update' },
      { code: 'salary.view', label: 'View Salaries', iconType: 'view' },
      { code: 'salary.create', label: 'Create Salary Structure', iconType: 'create' },
      { code: 'salary.update', label: 'Update Salary Structure', iconType: 'update' },
    ],
  },
  {
    id: 'tasks',
    name: 'Tasks & Projects',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><polyline points="9 11 12 14 22 4"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-600 dark:text-blue-400',
    permissions: [
      { code: 'tasks.view', label: 'View', iconType: 'view' },
      { code: 'tasks.create', label: 'Create', iconType: 'create' },
      { code: 'tasks.update', label: 'Update', iconType: 'update' },
      { code: 'tasks.delete', label: 'Delete', iconType: 'delete' },
    ],
  },
  {
    id: 'chat',
    name: 'Chat & Channels',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    permissions: [
      { code: 'messages.view', label: 'View Messages', iconType: 'view' },
      { code: 'messages.create', label: 'Send Messages', iconType: 'create' },
      { code: 'channels.create', label: 'Create Channels', iconType: 'create' },
      { code: 'channels.manage', label: 'Manage Channels', iconType: 'update' },
    ],
  },
  {
    id: 'meetings',
    name: 'Video Meetings',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11"/><rect width="12" height="10" x="2" y="7" rx="2"/></svg>`,
    iconBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    iconColor: 'text-purple-600 dark:text-purple-400',
    permissions: [
      { code: 'meetings.view', label: 'View', iconType: 'view' },
      { code: 'meetings.create', label: 'Schedule Meeting', iconType: 'create' },
      { code: 'meetings.update', label: 'Update Meeting', iconType: 'update' },
    ],
  },
  {
    id: 'expenses',
    name: 'Accountant & Expenses',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg>`,
    iconBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    iconColor: 'text-rose-600 dark:text-rose-400',
    permissions: [
      { code: 'expenses.view', label: 'View', iconType: 'view' },
      { code: 'expenses.create', label: 'Create / Record', iconType: 'create' },
      { code: 'expenses.delete', label: 'Delete', iconType: 'delete' },
    ],
  },
  {
    id: 'reports',
    name: 'Analytics & Reports',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v18h18"/><rect width="4" height="7" x="7" y="10" rx="1"/><rect width="4" height="12" x="15" y="5" rx="1"/></svg>`,
    iconBg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
    iconColor: 'text-orange-600 dark:text-orange-400',
    permissions: [
      { code: 'reports.view', label: 'View Reports', iconType: 'view' },
      { code: 'reports.generate', label: 'Generate Reports', iconType: 'create' },
      { code: 'reports.employee.view', label: 'View Employee Analytics', iconType: 'view' },
      { code: 'reports.employee.generate', label: 'Export Analytics', iconType: 'other' },
    ],
  },
  {
    id: 'campaigns',
    name: 'Broadcasts & Campaigns',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m3 11 18-5v12L3 14v-3z"/><path stroke-linecap="round" stroke-linejoin="round" d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
    iconBg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400',
    iconColor: 'text-pink-600 dark:text-pink-400',
    permissions: [
      { code: 'email_campaigns.view', label: 'View', iconType: 'view' },
      { code: 'email_campaigns.create', label: 'Create Campaign', iconType: 'create' },
      { code: 'email_campaigns.update', label: 'Update Campaign', iconType: 'update' },
      { code: 'email_campaigns.send', label: 'Send Campaign', iconType: 'send' },
    ],
  },
  {
    id: 'settings',
    name: 'Company Settings',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    iconColor: 'text-slate-700 dark:text-slate-300',
    permissions: [
      { code: 'company.settings.view', label: 'View Settings', iconType: 'view' },
      { code: 'company.settings.update', label: 'Update Settings', iconType: 'update' },
      { code: 'notifications.view', label: 'View Notifications', iconType: 'view' },
    ],
  },
  {
    id: 'resignations',
    name: 'Resignations & Clearance',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
    iconBg: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
    iconColor: 'text-red-600 dark:text-red-400',
    permissions: [
      { code: 'resignations.view', label: 'View', iconType: 'view' },
      { code: 'resignations.submit', label: 'Submit Resignation', iconType: 'create' },
      { code: 'resignations.approve', label: 'Approve & Clear', iconType: 'approve' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing Posts',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`,
    iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400',
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    permissions: [
      { code: 'marketing.posts.view', label: 'View', iconType: 'view' },
      { code: 'marketing.posts.create', label: 'Create Post', iconType: 'create' },
      { code: 'marketing.posts.delete', label: 'Delete Post', iconType: 'delete' },
    ],
  },
  {
    id: 'todos',
    name: 'Personal Todos',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="m9 12 2 2 4-4"/></svg>`,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    permissions: [
      { code: 'todos.view', label: 'View', iconType: 'view' },
      { code: 'todos.manage', label: 'Manage / Check', iconType: 'update' },
    ],
  },
  {
    id: 'ai',
    name: 'AI Workspace Tools',
    iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg>`,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400',
    permissions: [
      { code: 'ai.tools.use', label: 'Use AI Features', iconType: 'other' },
    ],
  },
];

@Component({
  selector: 'app-permissions-editor',
  standalone: true,
  imports: [CommonModule, AppCheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <!-- Top Modules Counter Badge -->
      <div class="flex items-center justify-between pb-1">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <span>MODULES</span>
          <span class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-extrabold shadow-sm">
            {{ modules.length }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="selectAllAll()"
            class="text-xs font-semibold text-[#2A65F6] hover:underline"
          >
            Select All
          </button>
          <span class="text-slate-300 dark:text-slate-700">•</span>
          <button
            type="button"
            (click)="deselectAllAll()"
            class="text-xs font-semibold text-slate-500 hover:underline"
          >
            Deselect All
          </button>
        </div>
      </div>

      <!-- Modules Accordion List -->
      <div class="space-y-3">
        @for (mod of modules; track mod.id) {
          <div
            class="rounded-xl border transition-all duration-150 overflow-hidden bg-white dark:bg-slate-900"
            [ngClass]="isModuleOpen(mod.id) ? 'border-slate-300 dark:border-slate-700 shadow-sm' : 'border-slate-200 dark:border-slate-800'"
          >
            <!-- Module Row Header -->
            <div
              class="flex items-center justify-between px-4 py-3.5 select-none transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer"
              (click)="toggleModuleOpen(mod.id)"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1 pr-3" (click)="$event.stopPropagation()">
                <!-- Checkbox to toggle all module permissions -->
                <app-checkbox
                  [checked]="isModuleFullySelected(mod)"
                  [indeterminate]="isModulePartiallySelected(mod)"
                  (checkedChange)="toggleModuleSelection(mod, $event)"
                ></app-checkbox>

                <!-- Tinted Icon Badge -->
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  [ngClass]="mod.iconBg"
                >
                  <span [innerHTML]="getSafeSvg(mod.iconSvg)" class="flex items-center justify-center"></span>
                </div>

                <!-- Title & Subtitle -->
                <div class="min-w-0">
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {{ mod.name }}
                  </h4>
                  <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {{ getSelectedCountInModule(mod) }} of {{ mod.permissions.length }} selected
                  </p>
                </div>
              </div>

              <!-- Chevron Toggle -->
              <button
                type="button"
                (click)="toggleModuleOpen(mod.id); $event.stopPropagation()"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200"
                [class.rotate-180]="isModuleOpen(mod.id)"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            <!-- Expanded Permissions Grid -->
            @if (isModuleOpen(mod.id)) {
              <div class="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/50">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  @for (perm of mod.permissions; track perm.code) {
                    <div
                      (click)="togglePermission(perm.code)"
                      class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs font-semibold select-none cursor-pointer transition-all duration-150"
                      [ngClass]="
                        isPermissionSelected(perm.code)
                          ? 'border-[#2A65F6] bg-blue-50/60 dark:bg-blue-950/30 text-slate-900 dark:text-white ring-1 ring-[#2A65F6]/30'
                          : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      "
                    >
                      <app-checkbox
                        [checked]="isPermissionSelected(perm.code)"
                        (checkedChange)="togglePermission(perm.code)"
                        (click)="$event.stopPropagation()"
                      ></app-checkbox>

                      <!-- Action Icon -->
                      <span class="w-4 h-4 shrink-0 flex items-center justify-center text-slate-400">
                        @switch (perm.iconType) {
                          @case ('view') {
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          }
                          @case ('create') {
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          }
                          @case ('update') {
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          }
                          @case ('delete') {
                            <svg class="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          }
                          @case ('approve') {
                            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          }
                          @case ('reject') {
                            <svg class="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          }
                          @case ('send') {
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          }
                          @default {
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
                            </svg>
                          }
                        }
                      </span>

                      <!-- Label -->
                      <span class="truncate">{{ perm.label }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class PermissionsEditorComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly modules = SYSTEM_PERMISSION_MODULES;

  getSafeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  @Input() set selectedPermissions(perms: string[] | null | undefined) {
    this.selectedSet.set(new Set(perms || []));
  }
  @Output() selectedPermissionsChange = new EventEmitter<string[]>();

  readonly selectedSet = signal<Set<string>>(new Set());
  readonly openModuleIds = signal<Set<string>>(new Set(['users', 'roles']));

  isPermissionSelected(code: string): boolean {
    return this.selectedSet().has(code);
  }

  togglePermission(code: string): void {
    const updated = new Set(this.selectedSet());
    if (updated.has(code)) {
      updated.delete(code);
    } else {
      updated.add(code);
    }
    this.selectedSet.set(updated);
    this.selectedPermissionsChange.emit(Array.from(updated));
  }

  getSelectedCountInModule(mod: PermissionModule): number {
    const set = this.selectedSet();
    return mod.permissions.filter((p) => set.has(p.code)).length;
  }

  isModuleFullySelected(mod: PermissionModule): boolean {
    const count = this.getSelectedCountInModule(mod);
    return count === mod.permissions.length && count > 0;
  }

  isModulePartiallySelected(mod: PermissionModule): boolean {
    const count = this.getSelectedCountInModule(mod);
    return count > 0 && count < mod.permissions.length;
  }

  toggleModuleSelection(mod: PermissionModule, selectAll: boolean): void {
    const updated = new Set(this.selectedSet());
    for (const p of mod.permissions) {
      if (selectAll) {
        updated.add(p.code);
      } else {
        updated.delete(p.code);
      }
    }
    this.selectedSet.set(updated);
    this.selectedPermissionsChange.emit(Array.from(updated));
  }

  selectAllAll(): void {
    const updated = new Set<string>();
    for (const mod of this.modules) {
      for (const p of mod.permissions) {
        updated.add(p.code);
      }
    }
    this.selectedSet.set(updated);
    this.selectedPermissionsChange.emit(Array.from(updated));
  }

  deselectAllAll(): void {
    this.selectedSet.set(new Set());
    this.selectedPermissionsChange.emit([]);
  }

  isModuleOpen(modId: string): boolean {
    return this.openModuleIds().has(modId);
  }

  toggleModuleOpen(modId: string): void {
    const updated = new Set(this.openModuleIds());
    if (updated.has(modId)) {
      updated.delete(modId);
    } else {
      updated.add(modId);
    }
    this.openModuleIds.set(updated);
  }
}
