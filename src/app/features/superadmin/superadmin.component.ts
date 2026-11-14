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
  templateUrl: "./superadmin.component.html",
  styleUrl: "./superadmin.component.scss",
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
