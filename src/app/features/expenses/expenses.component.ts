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
  templateUrl: "./expenses.component.html",
  styleUrl: "./expenses.component.scss",
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
