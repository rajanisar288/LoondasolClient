import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { SharedTableComponent, SharedTableColumn } from '../../shared/components/table/table.component';
import { AppTabsComponent, TabItem } from '../../shared/components/tabs/tabs.component';

export interface SuperAdminStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  freeTrialCompanies?: number;
  paidCompanies?: number;
  proPlanCompanies?: number;
  ultraPlanCompanies?: number;
  totalUsers: number;
  activeUsers: number;
  totalEmployees: number;
  totalLogs: number;
  regions: string[];
}

export interface CompanyItem {
  companyId: string;
  name: string;
  email: string;
  region: string;
  timezone: string;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  employeeCount: number;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
  };
}

export interface AuditLogItem {
  logId: string;
  action: string;
  userId?: string;
  userEmail?: string;
  companyId?: string;
  companyName?: string;
  region?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: string;
}

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppBadgeComponent,
    AppModalComponent,
    AppInputComponent,
    AppTabsComponent,
  ],
  template: `
    <div class="space-y-6 w-full">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-3">
            <h1 class="page-title text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              🛡️ Super Admin Control Center
            </h1>
            <span
              class="px-2.5 py-1 rounded-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold"
            >
              System Master Privilege
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global monitoring, tenant lifecycle management, and real-time system audit logs.
          </p>
        </div>

        <div class="flex items-center gap-2.5">
          <app-button variant="secondary" (click)="refreshAll()">
            🔄 Refresh Data
          </app-button>
        </div>
      </div>

      <!-- Notification Alerts -->
      @if (actionError()) {
        <div class="p-3.5 rounded-[8px] bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{{ actionError() }}</span>
          <button type="button" (click)="actionError.set(null)" class="font-bold">✕</button>
        </div>
      }
      @if (actionSuccess()) {
        <div class="p-3.5 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span>{{ actionSuccess() }}</span>
          <button type="button" (click)="actionSuccess.set(null)" class="font-bold">✕</button>
        </div>
      }

      <!-- System KPI Overview Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-5 rounded-[12px] bg-white dark:bg-[#202226] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Total Companies</span>
            <span class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2A65F6]">🏢</span>
          </div>
          <div class="mt-3 flex items-baseline justify-between">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats()?.totalCompanies || 0 }}</span>
            <span class="text-xs text-emerald-600 font-semibold">{{ stats()?.activeCompanies || 0 }} Active</span>
          </div>
        </div>

        <div class="p-5 rounded-[12px] bg-white dark:bg-[#202226] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Subscription Plans</span>
            <span class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">💳</span>
          </div>
          <div class="mt-3 flex items-baseline justify-between">
            <div>
              <span class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats()?.freeTrialCompanies || 0 }}</span>
              <span class="text-xs text-slate-500 font-medium ml-1">Free Trial</span>
            </div>
            <span class="text-xs text-emerald-600 font-semibold">
              {{ stats()?.paidCompanies || 0 }} Paid
            </span>
          </div>
        </div>

        <div class="p-5 rounded-[12px] bg-white dark:bg-[#202226] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Total System Users</span>
            <span class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600">👥</span>
          </div>
          <div class="mt-3 flex items-baseline justify-between">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats()?.totalUsers || 0 }}</span>
            <span class="text-xs text-slate-500">{{ stats()?.totalEmployees || 0 }} Employees</span>
          </div>
        </div>

        <div class="p-5 rounded-[12px] bg-white dark:bg-[#202226] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Audit Events Logged</span>
            <span class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">📜</span>
          </div>
          <div class="mt-3 flex items-baseline justify-between">
            <span class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats()?.totalLogs || 0 }}</span>
            <span class="text-xs text-amber-600 font-medium">Real-Time</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <app-tabs
        [tabs]="tabItems"
        [activeTab]="activeTab()"
        (activeTabChange)="activeTab.set($event)"
      ></app-tabs>

      <!-- TAB 1: REGISTERED COMPANIES MANAGEMENT -->
      @if (activeTab() === 'companies') {
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4 bg-white dark:bg-[#202226] p-4 rounded-[12px] border border-slate-200 dark:border-slate-800">
            <div class="w-72">
              <app-input
                placeholder="Search company name, email, or ID..."
                [value]="companySearchQuery()"
                (input)="onCompanySearch($any($event.target).value)"
              ></app-input>
            </div>
            <span class="text-xs text-slate-500 font-medium">Showing {{ filteredCompanies().length }} Companies</span>
          </div>

          <div class="bg-white dark:bg-[#202226] rounded-[12px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-[#27292d] border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                    <th class="py-3.5 px-4">Company Name</th>
                    <th class="py-3.5 px-4">Owner Email</th>
                    <th class="py-3.5 px-4">Region & Timezone</th>
                    <th class="py-3.5 px-4">Employees</th>
                    <th class="py-3.5 px-4">Status</th>
                    <th class="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (comp of paginatedCompanies(); track comp.companyId) {
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="py-3.5 px-4">
                        <div class="font-semibold text-slate-900 dark:text-white">{{ comp.name }}</div>
                        <div class="text-[11px] text-slate-400 font-mono">{{ comp.companyId }}</div>
                      </td>
                      <td class="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {{ comp.email }}
                      </td>
                      <td class="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <span class="font-semibold text-blue-600 dark:text-blue-400">[{{ comp.region }}]</span> {{ comp.timezone }} ({{ comp.currency }})
                      </td>
                      <td class="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-bold">
                        👥 {{ comp.employeeCount }}
                      </td>
                      <td class="py-3.5 px-4">
                        <app-badge
                          [variant]="comp.status === 'ACTIVE' ? 'success' : 'danger'"
                          [showDot]="true"
                        >
                          {{ comp.status }}
                        </app-badge>
                      </td>
                      <td class="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          (click)="viewCompanyModal(comp)"
                          class="px-2.5 py-1 rounded-[6px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
                        >
                          Details
                        </button>
                        @if (comp.status === 'ACTIVE') {
                          <button
                            type="button"
                            (click)="toggleCompanyStatus(comp, 'SUSPENDED')"
                            class="px-2.5 py-1 rounded-[6px] bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 text-xs font-semibold"
                          >
                            Deactivate
                          </button>
                        } @else {
                          <button
                            type="button"
                            (click)="toggleCompanyStatus(comp, 'ACTIVE')"
                            class="px-2.5 py-1 rounded-[6px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-semibold"
                          >
                            Activate
                          </button>
                        }
                      </td>
                    </tr>
                  }
                  @if (filteredCompanies().length === 0) {
                    <tr>
                      <td colspan="6" class="py-8 text-center text-slate-400 text-xs">
                        No registered companies found matching query.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Companies Pagination Footer -->
            @if (filteredCompanies().length > 0) {
              <div class="px-4 py-3 bg-slate-50 dark:bg-[#27292d] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
                <div class="text-slate-500 dark:text-slate-400">
                  Showing <span class="font-semibold text-slate-900 dark:text-white">{{ (companyPage() - 1) * companyPageSize() + 1 }}</span> to
                  <span class="font-semibold text-slate-900 dark:text-white">{{ Math.min(companyPage() * companyPageSize(), filteredCompanies().length) }}</span> of
                  <span class="font-semibold text-slate-900 dark:text-white">{{ filteredCompanies().length }}</span> companies
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    type="button"
                    [disabled]="companyPage() <= 1"
                    (click)="companyPage.set(companyPage() - 1)"
                    class="px-2.5 py-1 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                  >
                    Previous
                  </button>
                  <span class="text-slate-600 dark:text-slate-400 font-semibold px-2">
                    Page {{ companyPage() }} of {{ companyTotalPages() }}
                  </span>
                  <button
                    type="button"
                    [disabled]="companyPage() >= companyTotalPages()"
                    (click)="companyPage.set(companyPage() + 1)"
                    class="px-2.5 py-1 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 2: SYSTEM AUDIT EVENT LOGS -->
      @if (activeTab() === 'audit_logs') {
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#202226] p-4 rounded-[12px] border border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-3 flex-1">
              <div class="w-64">
                <app-input
                  placeholder="Search logs by action, email, company..."
                  [value]="logSearchQuery()"
                  (input)="onLogSearch($any($event.target).value)"
                ></app-input>
              </div>
              <span class="text-xs text-slate-500 font-medium">Total: {{ filteredLogs().length }} Logs</span>
            </div>
            <app-button variant="secondary" (click)="loadAuditLogs()">
              🔄 Fetch Logs
            </app-button>
          </div>

          <div class="bg-white dark:bg-[#202226] rounded-[12px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-[#27292d] border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                    <th class="py-3.5 px-4">Event Action</th>
                    <th class="py-3.5 px-4">User / Email</th>
                    <th class="py-3.5 px-4">Company</th>
                    <th class="py-3.5 px-4">Timestamp</th>
                    <th class="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  @for (log of paginatedLogs(); track log.logId) {
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="py-3 px-4">
                        <span class="px-2 py-0.5 rounded-[6px] text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-[#2A65F6] border border-blue-200/50">
                          {{ log.action }}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-slate-800 dark:text-slate-200">
                        {{ log.userEmail || 'System Process' }}
                      </td>
                      <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {{ log.companyName || log.companyId || 'Global' }}
                      </td>
                      <td class="py-3 px-4 text-slate-500">
                        {{ log.createdAt | date:'short' }}
                      </td>
                      <td class="py-3 px-4 text-right">
                        <button
                          type="button"
                          (click)="inspectLogDetails(log)"
                          class="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-sans hover:bg-slate-200"
                        >
                          Inspect Payload
                        </button>
                      </td>
                    </tr>
                  }
                  @if (filteredLogs().length === 0) {
                    <tr>
                      <td colspan="5" class="py-8 text-center text-slate-400 text-xs font-sans">
                        No system audit event logs retrieved.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Audit Logs Pagination Footer -->
            @if (filteredLogs().length > 0) {
              <div class="px-4 py-3 bg-slate-50 dark:bg-[#27292d] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs font-sans">
                <div class="text-slate-500 dark:text-slate-400">
                  Showing <span class="font-semibold text-slate-900 dark:text-white">{{ (logPage() - 1) * logPageSize() + 1 }}</span> to
                  <span class="font-semibold text-slate-900 dark:text-white">{{ Math.min(logPage() * logPageSize(), filteredLogs().length) }}</span> of
                  <span class="font-semibold text-slate-900 dark:text-white">{{ filteredLogs().length }}</span> audit logs
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    type="button"
                    [disabled]="logPage() <= 1"
                    (click)="logPage.set(logPage() - 1)"
                    class="px-2.5 py-1 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                  >
                    Previous
                  </button>
                  <span class="text-slate-600 dark:text-slate-400 font-semibold px-2">
                    Page {{ logPage() }} of {{ logTotalPages() }}
                  </span>
                  <button
                    type="button"
                    [disabled]="logPage() >= logTotalPages()"
                    (click)="logPage.set(logPage() + 1)"
                    class="px-2.5 py-1 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 3: SYSTEM USERS DIRECTORY -->
      @if (activeTab() === 'users') {
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4 bg-white dark:bg-[#202226] p-4 rounded-[12px] border border-slate-200 dark:border-slate-800">
            <div class="w-80">
              <app-input
                placeholder="Search user email, name, role..."
                [value]="userSearchQuery()"
                (input)="onUserSearch($any($event.target).value)"
              ></app-input>
            </div>
            <span class="text-xs text-slate-500 font-medium">Total: {{ filteredUsers().length }} Users</span>
          </div>

          <div class="bg-white dark:bg-[#202226] rounded-[12px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-[#27292d] border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider">
                    <th class="py-3.5 px-4">User Name</th>
                    <th class="py-3.5 px-4">Email</th>
                    <th class="py-3.5 px-4">Company ID</th>
                    <th class="py-3.5 px-4">Role</th>
                    <th class="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (u of paginatedUsers(); track u.userId) {
                    <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {{ u.firstName }} {{ u.lastName }}
                      </td>
                      <td class="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {{ u.email }}
                      </td>
                      <td class="py-3 px-4 font-mono text-slate-500">
                        {{ u.companyId }}
                      </td>
                      <td class="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        {{ u.roleName }}
                      </td>
                      <td class="py-3 px-4">
                        <app-badge [variant]="u.status === 'ACTIVE' ? 'success' : 'danger'">
                          {{ u.status }}
                        </app-badge>
                      </td>
                    </tr>
                  }
                  @if (filteredUsers().length === 0) {
                    <tr>
                      <td colspan="5" class="py-8 text-center text-slate-400 text-xs">
                        No system users found.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Users Pagination Footer -->
            @if (filteredUsers().length > 0) {
              <div class="px-4 py-3 bg-slate-50 dark:bg-[#27292d] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
                <div class="text-slate-500 dark:text-slate-400">
                  Showing <span class="font-semibold text-slate-900 dark:text-white">{{ (userPage() - 1) * userPageSize() + 1 }}</span> to
                  <span class="font-semibold text-slate-900 dark:text-white">{{ Math.min(userPage() * userPageSize(), filteredUsers().length) }}</span> of
                  <span class="font-semibold text-slate-900 dark:text-white">{{ filteredUsers().length }}</span> users
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    type="button"
                    [disabled]="userPage() <= 1"
                    (click)="userPage.set(userPage() - 1)"
                    class="px-2.5 py-1 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                  >
                    Previous
                  </button>
                  <span class="text-slate-600 dark:text-slate-400 font-semibold px-2">
                    Page {{ userPage() }} of {{ userTotalPages() }}
                  </span>
                  <button
                    type="button"
                    [disabled]="userPage() >= userTotalPages()"
                    (click)="userPage.set(userPage() + 1)"
                    class="px-2.5 py-1 rounded-[6px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Company Detail Modal -->
    <app-modal
      [isOpen]="isCompanyModalOpen()"
      [title]="selectedCompany()?.name || 'Company Details'"
      size="lg"
      [showFooter]="false"
      (closed)="isCompanyModalOpen.set(false)"
    >
      <div class="space-y-5 py-2" *ngIf="selectedCompanyDetails(); let details">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs">
          <div>
            <span class="text-slate-400 block">Company ID:</span>
            <span class="font-mono font-bold text-slate-900 dark:text-white">{{ details.company?.companyId }}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Owner Email:</span>
            <span class="font-semibold text-slate-900 dark:text-white">{{ details.company?.email }}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Region & Timezone:</span>
            <span class="font-semibold text-slate-900 dark:text-white">{{ details.company?.region }} • {{ details.company?.timezone }}</span>
          </div>
          <div>
            <span class="text-slate-400 block">Status:</span>
            <app-badge [variant]="details.company?.status === 'ACTIVE' ? 'success' : 'danger'">
              {{ details.company?.status }}
            </app-badge>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-900 dark:text-white mb-2">Employees Directory ({{ details.employees?.length || 0 }})</h4>
          <div class="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 text-xs">
            @for (emp of details.employees || []; track emp.employeeId) {
              <div class="p-2 rounded bg-slate-50 dark:bg-[#27292d] flex items-center justify-between">
                <div>
                  <span class="font-semibold text-slate-900 dark:text-white">{{ emp.firstName }} {{ emp.lastName }}</span>
                  <span class="text-slate-400 ml-2">({{ emp.designation || 'Staff' }})</span>
                </div>
                <span class="font-mono text-slate-500">{{ emp.email }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </app-modal>

    <!-- Audit Log Inspection Modal -->
    <app-modal
      [isOpen]="isLogModalOpen()"
      title="Audit Event Payload Details"
      size="md"
      [showFooter]="false"
      (closed)="isLogModalOpen.set(false)"
    >
      <div class="space-y-4 py-2" *ngIf="selectedLog(); let log">
        <div class="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
          <pre>{{ log | json }}</pre>
        </div>
      </div>
    </app-modal>
  `,
})
export class SuperadminComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  readonly stats = signal<SuperAdminStats | null>(null);
  readonly companies = signal<CompanyItem[]>([]);
  readonly auditLogs = signal<AuditLogItem[]>([]);
  readonly systemUsers = signal<any[]>([]);

  readonly activeTab = signal<string>('companies');
  readonly actionError = signal<string | null>(null);
  readonly actionSuccess = signal<string | null>(null);

  readonly companySearchQuery = signal<string>('');
  readonly logSearchQuery = signal<string>('');
  readonly userSearchQuery = signal<string>('');

  // Pagination for Companies
  readonly companyPage = signal<number>(1);
  readonly companyPageSize = signal<number>(10);
  readonly companyTotalPages = computed(() =>
    Math.ceil(this.filteredCompanies().length / this.companyPageSize()) || 1
  );
  readonly paginatedCompanies = computed(() => {
    const start = (this.companyPage() - 1) * this.companyPageSize();
    return this.filteredCompanies().slice(start, start + this.companyPageSize());
  });

  // Pagination for Audit Logs
  readonly logPage = signal<number>(1);
  readonly logPageSize = signal<number>(15);
  readonly logTotalPages = computed(() =>
    Math.ceil(this.filteredLogs().length / this.logPageSize()) || 1
  );
  readonly paginatedLogs = computed(() => {
    const start = (this.logPage() - 1) * this.logPageSize();
    return this.filteredLogs().slice(start, start + this.logPageSize());
  });

  // Pagination for System Users
  readonly userPage = signal<number>(1);
  readonly userPageSize = signal<number>(10);
  readonly userTotalPages = computed(() =>
    Math.ceil(this.filteredUsers().length / this.userPageSize()) || 1
  );
  readonly paginatedUsers = computed(() => {
    const start = (this.userPage() - 1) * this.userPageSize();
    return this.filteredUsers().slice(start, start + this.userPageSize());
  });

  readonly isCompanyModalOpen = signal<boolean>(false);
  readonly selectedCompany = signal<CompanyItem | null>(null);
  readonly selectedCompanyDetails = signal<any | null>(null);

  readonly isLogModalOpen = signal<boolean>(false);
  readonly selectedLog = signal<AuditLogItem | null>(null);

  readonly tabItems: TabItem[] = [
    { id: 'companies', label: '🏢 Registered Companies' },
    { id: 'audit_logs', label: '📜 System Audit Trail' },
    { id: 'users', label: '👥 Users Directory' },
  ];

  readonly filteredCompanies = computed(() => {
    const q = this.companySearchQuery().toLowerCase().trim();
    if (!q) return this.companies();
    return this.companies().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.companyId.toLowerCase().includes(q),
    );
  });

  readonly filteredLogs = computed(() => {
    const q = this.logSearchQuery().toLowerCase().trim();
    if (!q) return this.auditLogs();
    return this.auditLogs().filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
        (l.companyName && l.companyName.toLowerCase().includes(q)),
    );
  });

  readonly filteredUsers = computed(() => {
    const q = this.userSearchQuery().toLowerCase().trim();
    if (!q) return this.systemUsers();
    return this.systemUsers().filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q),
    );
  });

  readonly Math = Math;

  onCompanySearch(q: string): void {
    this.companySearchQuery.set(q);
    this.companyPage.set(1);
  }

  onLogSearch(q: string): void {
    this.logSearchQuery.set(q);
    this.logPage.set(1);
  }

  onUserSearch(q: string): void {
    this.userSearchQuery.set(q);
    this.userPage.set(1);
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab) {
        this.activeTab.set(tab);
      }
    });
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadStats();
    this.loadCompanies();
    this.loadAuditLogs();
    this.loadUsers();
  }

  loadStats(): void {
    this.api.get<SuperAdminStats>('superadmin/stats').subscribe({
      next: (res) => this.stats.set(res),
      error: (err) => this.actionError.set('Failed to load system stats'),
    });
  }

  loadCompanies(): void {
    this.api.get<CompanyItem[]>('superadmin/companies').subscribe({
      next: (res) => this.companies.set(res || []),
      error: () => {},
    });
  }

  loadAuditLogs(): void {
    this.api
      .get<{ logs: AuditLogItem[] }>('superadmin/audit-logs', { limit: 100 })
      .subscribe({
        next: (res) => this.auditLogs.set(res?.logs || []),
        error: () => {},
      });
  }

  loadUsers(): void {
    this.api.get<any[]>('superadmin/users').subscribe({
      next: (res) => this.systemUsers.set(res || []),
      error: () => {},
    });
  }

  toggleCompanyStatus(company: CompanyItem, status: 'ACTIVE' | 'SUSPENDED'): void {
    this.api
      .patch(`superadmin/companies/${company.companyId}/status`, { status })
      .subscribe({
        next: () => {
          this.actionSuccess.set(`Company [${company.name}] is now ${status}.`);
          this.refreshAll();
        },
        error: (err) => this.actionError.set(err?.error?.message || 'Failed to update status'),
      });
  }

  viewCompanyModal(company: CompanyItem): void {
    this.selectedCompany.set(company);
    this.selectedCompanyDetails.set(null);
    this.isCompanyModalOpen.set(true);

    this.api.get<any>(`superadmin/companies/${company.companyId}`).subscribe({
      next: (res) => this.selectedCompanyDetails.set(res),
      error: () => {},
    });
  }

  inspectLogDetails(log: AuditLogItem): void {
    this.selectedLog.set(log);
    this.isLogModalOpen.set(true);
  }
}
