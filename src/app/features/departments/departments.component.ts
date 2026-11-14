import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

interface DepartmentItem {
  departmentId: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  branchId?: string;
  branchName?: string;
  isCompanyWide?: boolean;
  createdAt?: string;
}

interface BranchItem {
  branchId: string;
  name: string;
  address?: string;
}

interface EmployeeSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppBadgeComponent,
    AppModalComponent,
    AppConfirmationModalComponent,
  ],
  templateUrl: "./departments.component.html",
  styleUrl: "./departments.component.scss",
})
export class DepartmentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly departments = signal<DepartmentItem[]>([]);
  readonly branches = signal<BranchItem[]>([]);
  readonly employees = signal<EmployeeSummary[]>([]);
  readonly managerOptions = signal<SelectOption[]>([]);
  readonly selectedBranchFilter = signal<string>('ALL');
  readonly isModalOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly editingDept = signal<DepartmentItem | null>(null);

  // Deletion Confirmation Modal
  readonly pendingDeleteDeptId = signal<string | null>(null);
  readonly isDeletingDept = signal<boolean>(false);

  readonly branchScopeOptions = computed<SelectOption[]>(() => [
    { label: '🌐 Company-Wide (All Branches)', value: '' },
    ...this.branches().map((b) => ({ label: `🏢 ${b.name}`, value: b.branchId })),
  ]);

  readonly deptForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    managerId: [''],
    branchId: [''],
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadDepartments();
    this.loadEmployees();
  }

  onBranchFilterChange(filter: string): void {
    this.selectedBranchFilter.set(filter);
    this.loadDepartments();
  }

  loadBranches(): void {
    this.api.get<BranchItem[]>('branches').subscribe({
      next: (res) => this.branches.set(res || []),
      error: () => {},
    });
  }

  loadDepartments(): void {
    const filter = this.selectedBranchFilter();
    let url = 'departments';
    if (filter && filter !== 'ALL') {
      url += `?branchId=${encodeURIComponent(filter)}`;
    }
    this.api.get<DepartmentItem[]>(url).subscribe({
      next: (res) => this.departments.set(res),
      error: () => {},
    });
  }

  loadEmployees(): void {
    this.api.get<{ data: EmployeeSummary[] }>('employees').subscribe({
      next: (res) => {
        this.employees.set(res.data);
        const opts: SelectOption[] = res.data.map((emp) => ({
          label: `${emp.firstName} ${emp.lastName} (${emp.email})`,
          value: emp.employeeId,
        }));
        this.managerOptions.set(opts);
      },
      error: () => {},
    });
  }

  getManagerName(managerId?: string): string {
    if (!managerId) return 'Unassigned';
    const emp = this.employees().find((e) => e.employeeId === managerId);
    return emp ? `${emp.firstName} ${emp.lastName}` : managerId;
  }

  openCreateModal(): void {
    this.editingDept.set(null);
    const filter = this.selectedBranchFilter();
    const defaultBranch = filter !== 'ALL' && filter !== 'COMPANY_WIDE' ? filter : '';
    this.deptForm.reset({ name: '', description: '', managerId: '', branchId: defaultBranch });
    this.isModalOpen.set(true);
  }

  openEditModal(dept: DepartmentItem): void {
    this.editingDept.set(dept);
    this.deptForm.patchValue({
      name: dept.name,
      description: dept.description || '',
      managerId: dept.managerId || '',
      branchId: dept.branchId || '',
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingDept.set(null);
  }

  saveDepartment(): void {
    if (this.deptForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.deptForm.value;
    const editing = this.editingDept();

    const selectedBranch = this.branches().find((b) => b.branchId === formVal.branchId);
    const payload = {
      ...formVal,
      branchName: selectedBranch ? selectedBranch.name : undefined,
      isCompanyWide: !formVal.branchId,
    };

    if (editing) {
      this.api.patch<DepartmentItem>(`departments/${editing.departmentId}`, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadDepartments();
        },
        error: () => this.isSubmitting.set(false),
      });
    } else {
      this.api.post<DepartmentItem>('departments', payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
          this.loadDepartments();
        },
        error: () => this.isSubmitting.set(false),
      });
    }
  }

  deleteDepartment(id: string): void {
    this.pendingDeleteDeptId.set(id);
  }

  confirmDeleteDepartment(): void {
    const id = this.pendingDeleteDeptId();
    if (!id) return;

    this.isDeletingDept.set(true);
    this.api.delete(`departments/${id}`).subscribe({
      next: () => {
        this.isDeletingDept.set(false);
        this.pendingDeleteDeptId.set(null);
        this.loadDepartments();
      },
      error: () => {
        this.isDeletingDept.set(false);
      },
    });
  }
}
