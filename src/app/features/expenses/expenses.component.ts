import { Component, OnInit, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppDrawerComponent } from '../../shared/components/drawer/drawer.component';
import {
  SharedTableComponent,
  SharedTableColumn,
  SharedTableAction,
  SharedTableActionEvent,
} from '../../shared/components/table/table.component';

export interface Expense {
  expenseId: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  branchName?: string;
  receiptUrl?: string;
  paidByName: string;
  status: 'PENDING' | 'APPROVED' | 'REIMBURSED' | 'REJECTED';
  notes?: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedTableComponent, AppDrawerComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Accountant & Daily Expenses
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track operational spending, corporate receipts, branch expense rollups, and reimbursement workflows.
          </p>
        </div>

        <button
          type="button"
          (click)="openCreateModal()"
          class="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#2A65F6] hover:bg-[#2052cb] text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Record Expense</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Recorded Expenses</div>
          <div class="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {{ formatCurrency(summary()?.totalExpenses || 0) }}
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending Review</div>
          <div class="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {{ summary()?.pendingCount || 0 }}
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Approved / Disbursed</div>
          <div class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {{ summary()?.approvedCount || 0 }}
          </div>
        </div>
      </div>

      <!-- Custom Cell Templates for Shared Table -->
      <ng-template #titleCell let-ctx>
        <div>
          <div class="font-bold text-slate-900 dark:text-white">{{ ctx.row.title }}</div>
          <span class="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {{ ctx.row.category }}
          </span>
        </div>
      </ng-template>

      <ng-template #branchCell let-ctx>
        <span class="text-xs font-medium text-slate-600 dark:text-slate-400">
          {{ ctx.row.branchName || 'Headquarters' }}
        </span>
      </ng-template>

      <ng-template #amountCell let-ctx>
        <span class="font-bold text-slate-900 dark:text-white">
          {{ formatCurrency(ctx.row.amount) }}
        </span>
      </ng-template>

      <ng-template #receiptCell let-ctx>
        @if (ctx.row.receiptUrl) {
          <a
            [href]="ctx.row.receiptUrl"
            target="_blank"
            class="text-xs text-[#2A65F6] hover:underline font-semibold"
          >
            📎 View Attachment
          </a>
        } @else {
          <span class="text-xs text-slate-400">None</span>
        }
      </ng-template>

      <ng-template #statusCell let-ctx>
        <span
          class="px-2.5 py-1 rounded-full text-xs font-bold"
          [ngClass]="{
            'bg-amber-50 text-amber-600 dark:bg-amber-950/50': ctx.row.status === 'PENDING',
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50': ctx.row.status === 'APPROVED' || ctx.row.status === 'REIMBURSED',
            'bg-red-50 text-red-600 dark:bg-red-950/50': ctx.row.status === 'REJECTED'
          }"
        >
          {{ ctx.row.status }}
        </span>
      </ng-template>

      <!-- Reusable SaaS Shared Table -->
      <theme-table
        [rows]="expenses()"
        [columns]="expenseColumns"
        [actions]="expenseActions"
        [loading]="isLoading()"
        loadingMessage="Loading expenses..."
        [searchable]="true"
        [clientSideSearch]="true"
        searchPlaceholder="Search expenses by title, category, or branch..."
        [showFilterButton]="false"
        [clientSidePagination]="true"
        [pageSize]="10"
        [showPageSizeSelector]="true"
        (actionClick)="onExpenseAction($event)"
        emptyTitle="No expense entries recorded"
        emptyMessage="Click 'Record Expense' to log receipts, office supplies, travel, or utility costs."
      ></theme-table>
    </div>

    <app-drawer
      [isOpen]="showCreateModal()"
      title="Record Daily Expense"
      subtitle="Log corporate receipts, office supplies, travel, equipment, or utilities"
      size="md"
      position="right"
      [showFooter]="true"
      primaryLabel="Record Expense"
      secondaryLabel="Cancel"
      [primaryLoading]="isSubmitting()"
      [primaryDisabled]="!newTitle.trim() || !newAmount || isSubmitting()"
      (closed)="showCreateModal.set(false)"
      (primaryAction)="createExpense()"
      (secondaryAction)="showCreateModal.set(false)"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Expense Title *</label>
          <input
            type="text"
            [(ngModel)]="newTitle"
            placeholder="e.g. Office Coffee & Supplies"
            class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-[#2A65F6] text-slate-900 dark:text-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
            <select
              [(ngModel)]="newCategory"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-[#2A65F6] text-slate-900 dark:text-white"
            >
              <option value="OFFICE_SUPPLIES">Office Supplies</option>
              <option value="UTILITIES">Utilities</option>
              <option value="TRAVEL">Travel</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="SOFTWARE">Software & Tools</option>
              <option value="MEALS">Meals & Events</option>
              <option value="MISC">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ({{ authService.effectiveCurrency() }}) *</label>
            <input
              type="number"
              step="0.01"
              [(ngModel)]="newAmount"
              placeholder="0.00"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-[#2A65F6] text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date *</label>
          <input
            type="date"
            [(ngModel)]="newDate"
            class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-[#2A65F6] text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Receipt Attachment URL</label>
          <input
            type="text"
            [(ngModel)]="newReceiptUrl"
            placeholder="https://... or upload link"
            class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-[#2A65F6] text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </app-drawer>
  `,
})
export class ExpensesComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);

  @ViewChild('titleCell') titleCell?: TemplateRef<any>;
  @ViewChild('branchCell') branchCell?: TemplateRef<any>;
  @ViewChild('amountCell') amountCell?: TemplateRef<any>;
  @ViewChild('receiptCell') receiptCell?: TemplateRef<any>;
  @ViewChild('statusCell') statusCell?: TemplateRef<any>;

  get expenseColumns(): SharedTableColumn<Expense>[] {
    return [
      {
        key: 'title',
        header: 'Title & Category',
        sortable: true,
        template: this.titleCell,
      },
      {
        key: 'branchName',
        header: 'Branch',
        sortable: true,
        template: this.branchCell,
      },
      {
        key: 'amount',
        header: 'Amount',
        sortable: true,
        template: this.amountCell,
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
      },
      {
        key: 'paidByName',
        header: 'Paid By',
        sortable: true,
      },
      {
        key: 'receiptUrl',
        header: 'Receipt',
        template: this.receiptCell,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        template: this.statusCell,
      },
    ];
  }

  get expenseActions(): SharedTableAction<Expense>[] {
    return [
      {
        id: 'approve',
        label: 'Approve',
        icon: '✅',
        visible: (exp) =>
          exp.status === 'PENDING' &&
          Boolean(this.authService.hasAnyPermission(['expenses.create']) || this.authService.currentUser()?.isOwner),
      },
      {
        id: 'reject',
        label: 'Reject',
        icon: '❌',
        danger: true,
        visible: (exp) =>
          exp.status === 'PENDING' &&
          Boolean(this.authService.hasAnyPermission(['expenses.create']) || this.authService.currentUser()?.isOwner),
      },
    ];
  }

  onExpenseAction(event: SharedTableActionEvent<Expense>): void {
    if (event.action.id === 'approve') {
      this.updateStatus(event.row.expenseId, 'APPROVED');
    } else if (event.action.id === 'reject') {
      this.updateStatus(event.row.expenseId, 'REJECTED');
    }
  }

  readonly expenses = signal<Expense[]>([]);
  readonly summary = signal<any>(null);
  readonly isLoading = signal(true);
  readonly showCreateModal = signal(false);
  readonly isSubmitting = signal(false);

  newTitle = '';
  newCategory = 'OFFICE_SUPPLIES';
  newAmount = 0;
  newDate = new Date().toISOString().slice(0, 10);
  newReceiptUrl = '';

  ngOnInit(): void {
    this.fetchExpenses();
    this.fetchSummary();
  }

  fetchExpenses(): void {
    this.isLoading.set(true);
    this.api.get<Expense[]>('expenses').subscribe({
      next: (res) => {
        this.expenses.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  fetchSummary(): void {
    this.api.get('expenses/summary').subscribe({
      next: (res) => this.summary.set(res),
    });
  }

  openCreateModal(): void {
    this.newTitle = '';
    this.newCategory = 'OFFICE_SUPPLIES';
    this.newAmount = 0;
    this.newDate = new Date().toISOString().slice(0, 10);
    this.newReceiptUrl = '';
    this.showCreateModal.set(true);
  }

  createExpense(): void {
    if (!this.newTitle.trim() || !this.newAmount) return;
    this.isSubmitting.set(true);
    this.api
      .post<Expense>('expenses', {
        title: this.newTitle.trim(),
        category: this.newCategory,
        amount: Number(this.newAmount),
        currency: this.authService.effectiveCurrency(),
        date: this.newDate,
        receiptUrl: this.newReceiptUrl.trim() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.expenses.update((list) => [created, ...list]);
          this.fetchSummary();
          this.showCreateModal.set(false);
          this.isSubmitting.set(false);
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  updateStatus(expenseId: string, status: string): void {
    this.api
      .patch<Expense>(`expenses/${expenseId}/status`, { status })
      .subscribe({
        next: (updated) => {
          this.expenses.update((list) => list.map((e) => (e.expenseId === expenseId ? updated : e)));
          this.fetchSummary();
        },
      });
  }

  formatCurrency(amount: number): string {
    return this.authService.formatCurrency(amount);
  }
}
