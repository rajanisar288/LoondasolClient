import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AppBadgeComponent } from '../../shared/components/badge/badge.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AppSuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { AppAvatarComponent } from '../../shared/components/avatar/avatar.component';
import { AppCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { AppTabsComponent, TabItem } from '../../shared/components/tabs/tabs.component';
import { PermissionsEditorComponent } from '../../shared/components/permissions-editor/permissions-editor.component';
import {
  SharedTableComponent,
  SharedTableColumn,
  SharedTableAction,
  SharedTableActionEvent,
  SharedTablePageEvent,
  SharedTableSortEvent,
} from '../../shared/components/table/table.component';

export interface EmployeeRecord {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  departmentId?: string;
  departmentName?: string;
  branchId?: string;
  branchName?: string;
  designation: string;
  employmentType: string;
  salary?: number;
  taxPercentage?: number;
  userLocationRegion?: string;
  isOnline?: boolean;
  lastSeen?: string;
  status: string;
  permissions?: string[];
  roleId?: string;
  roleName?: string;
}

export interface RoleItem {
  _id?: string;
  id?: string;
  companyId?: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SeatStatusResponse {
  purchasedSeats: number;
  totalActiveSeats: number;
  availableSeats: number;
  plan: string;
  pricePerSeat: number;
}

export interface DepartmentItem {
  departmentId: string;
  name: string;
  branchId?: string;
  branchName?: string;
  isCompanyWide?: boolean;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppBadgeComponent,
    AppModalComponent,
    AppConfirmationModalComponent,
    AppSuccessModalComponent,
    AppAvatarComponent,
    AppCheckboxComponent,
    AppTabsComponent,
    PermissionsEditorComponent,
    SharedTableComponent,
  ],
  templateUrl: "./employees.component.html",
  styleUrl: "./employees.component.scss",
})
export class EmployeesComponent implements OnInit, OnDestroy {
  private feedbackTimeout: any = null;

  setFeedback(message: string, isError = false): void {
    this.actionFeedback.set({ message, isError });
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
    this.feedbackTimeout = setTimeout(() => {
      this.actionFeedback.set(null);
      this.cdr.markForCheck();
    }, 5000);
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
  }
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly activeTab = signal<'employees' | 'roles'>('employees');

  readonly tabItems = computed<TabItem[]>(() => [
    {
      id: 'employees',
      label: 'Employees Directory',
    },
    {
      id: 'roles',
      label: 'Roles & Permissions',
    },
  ]);

  @ViewChild('checkboxHeader', { static: true }) checkboxHeader?: TemplateRef<unknown>;
  @ViewChild('checkboxCell', { static: true }) checkboxCell?: TemplateRef<any>;
  @ViewChild('employeeCell', { static: true }) employeeCell?: TemplateRef<any>;
  @ViewChild('roleCell', { static: true }) roleCell?: TemplateRef<any>;
  @ViewChild('deptCell', { static: true }) deptCell?: TemplateRef<any>;
  @ViewChild('salaryCell', { static: true }) salaryCell?: TemplateRef<any>;
  @ViewChild('statusCell', { static: true }) statusCell?: TemplateRef<any>;
  @ViewChild('roleNameCell', { static: true }) roleNameCell?: TemplateRef<any>;
  @ViewChild('rolePermCountCell', { static: true }) rolePermCountCell?: TemplateRef<any>;
  @ViewChild('roleTypeCell', { static: true }) roleTypeCell?: TemplateRef<any>;

  readonly employees = signal<EmployeeRecord[]>([]);
  readonly roles = signal<RoleItem[]>([]);
  readonly seatStatus = signal<SeatStatusResponse | null>(null);
  readonly departmentOptions = signal<SelectOption[]>([]);
  readonly branchOptions = signal<SelectOption[]>([]);
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalEmployees = signal<number>(0);
  readonly isPaginationEnabled = signal<boolean>(true);
  readonly isInviteModalOpen = signal<boolean>(false);
  readonly isEditModalOpen = signal<boolean>(false);
  readonly editingEmployee = signal<EmployeeRecord | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly invitationSuccessLink = signal<string | null>(null);
  readonly isInviteSuccessModalOpen = signal<boolean>(false);
  readonly actionFeedback = signal<{ message: string; isError?: boolean } | null>(null);
  readonly isRoleModalOpen = signal<boolean>(false);
  readonly editingRole = signal<RoleItem | null>(null);
  readonly roleFormPermissions = signal<string[]>([]);
  readonly isSubmittingRole = signal<boolean>(false);
  readonly pendingDeleteRole = signal<RoleItem | null>(null);
  readonly isDeletingRole = signal<boolean>(false);
  readonly isFilterModalOpen = signal<boolean>(false);
  readonly sortField = signal<string>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly selectedEmployeeIds = signal<Set<string>>(new Set());
  readonly pendingDeleteEmployee = signal<EmployeeRecord | null>(null);
  readonly isDeletingEmployee = signal<boolean>(false);
  readonly allDepartments = signal<DepartmentItem[]>([]);
  readonly allBranches = signal<any[]>([]);
  readonly hasBranches = computed(() => this.allBranches().length > 0);
  readonly hasDepartments = computed(() => this.allDepartments().length > 0);

  readonly roleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  readonly filterForm: FormGroup = this.fb.group({
    branchId: [''],
    departmentId: [''],
    status: [''],
    employmentType: [''],
  });

  readonly inviteForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    roleId: ['', Validators.required],
    departmentId: [''],
    branchId: [''],
    phone: [''],
    designation: ['', Validators.required],
    employmentType: ['FULL_TIME', Validators.required],
    salary: [0],
    taxPercentage: [null],
    userLocationRegion: [''],
  });

  readonly editForm: FormGroup = this.fb.group({
    roleId: ['', Validators.required],
    departmentId: [''],
    branchId: [''],
    phone: [''],
    designation: ['', Validators.required],
    employmentType: ['FULL_TIME', Validators.required],
    salary: [0],
    taxPercentage: [null],
    userLocationRegion: [''],
    status: ['ACTIVE', Validators.required],
  });

  readonly employmentTypeOptions: SelectOption[] = [
    { label: 'Full Time', value: 'FULL_TIME' },
    { label: 'Part Time', value: 'PART_TIME' },
    { label: 'Contractor', value: 'CONTRACT' },
    { label: 'Intern', value: 'INTERN' },
  ];

  readonly statusOptions: SelectOption[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive / Suspended', value: 'INACTIVE' },
    { label: 'On Leave', value: 'ON_LEAVE' },
    { label: 'Terminated', value: 'TERMINATED' },
  ];

  readonly activeFilterCount = computed(() => {
    const val = this.filterForm.value;
    let count = 0;
    if (val.branchId) count++;
    if (val.departmentId) count++;
    if (val.status) count++;
    if (val.employmentType) count++;
    return count;
  });

  readonly sortedEmployees = computed(() => {
    const list = [...this.employees()];
    const field = this.sortField();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    return list.sort((a, b) => {
      let valA = '';
      let valB = '';
      if (field === 'name') {
        valA = `${a.firstName} ${a.lastName}`.toLowerCase();
        valB = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (field === 'roleName') {
        valA = (a.roleName || '').toLowerCase();
        valB = (b.roleName || '').toLowerCase();
      } else if (field === 'designation') {
        valA = (a.designation || '').toLowerCase();
        valB = (b.designation || '').toLowerCase();
      } else if (field === 'department') {
        valA = (a.departmentName || '').toLowerCase();
        valB = (b.departmentName || '').toLowerCase();
      } else if (field === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      }
      return valA.localeCompare(valB) * dir;
    });
  });

  readonly roleSelectOptions = computed<SelectOption[]>(() =>
    this.roles().map((r) => ({
      label: r.name,
      value: (r._id || r.id)!,
    }))
  );

  readonly isAllSelected = computed(() => {
    const current = this.employees();
    if (current.length === 0) return false;
    const selected = this.selectedEmployeeIds();
    return current.every((e) => selected.has(e.employeeId));
  });

  readonly deleteEmployeeMessage = computed(() => {
    const emp = this.pendingDeleteEmployee();
    return emp
      ? `Are you sure you want to permanently delete ${emp.firstName} ${emp.lastName}? This will immediately revoke corporate platform access and permanently erase their employee account.`
      : '';
  });

  readonly deleteRoleMessage = computed(() => {
    const role = this.pendingDeleteRole();
    return role
      ? `Are you sure you want to delete the role "${role.name}"? Employees currently assigned to this role will need to be reassigned to another role.`
      : '';
  });

  readonly isSeatLimitReached = computed(() => {
    const seats = this.seatStatus();
    if (!seats) return false;
    return seats.availableSeats <= 0;
  });

  /** Switches between Employees and Roles tabs and refreshes role data when needed. */
  onTabSelect(tabId: string): void {
    this.activeTab.set(tabId as 'employees' | 'roles');
    if (tabId === 'roles') {
      this.loadRoles();
    }
    this.cdr.markForCheck();
  }

  /** Returns the column definitions for the employees table. */
  get employeeColumns(): SharedTableColumn<EmployeeRecord>[] {
    const cols: SharedTableColumn<EmployeeRecord>[] = [
      {
        key: 'select',
        header: '',
        width: '44px',
        headerTemplate: this.checkboxHeader,
        template: this.checkboxCell,
        sortable: false,
        searchable: false,
      },
      {
        key: 'name',
        header: 'Employee',
        sortable: true,
        template: this.employeeCell,
      },
      {
        key: 'roleName',
        header: 'Role',
        sortable: true,
        template: this.roleCell,
      },
      {
        key: 'designation',
        header: 'Designation',
        sortable: true,
      },
      {
        key: 'department',
        header: 'Department',
        sortable: true,
        template: this.deptCell,
      },
      {
        key: 'employmentType',
        header: 'Type',
        formatter: (val) => String(val || '').toUpperCase(),
      },
    ];
    if (this.canViewSalary()) {
      cols.push({
        key: 'salary',
        header: 'Salary',
        template: this.salaryCell,
      });
    }
    cols.push({
      key: 'status',
      header: 'Status',
      sortable: true,
      template: this.statusCell,
    });
    return cols;
  }

  /** Returns the row action definitions for the employees table. */
  get employeeTableActions(): SharedTableAction<EmployeeRecord>[] {
    return [
      {
        id: 'edit',
        label: 'Edit Profile & Role',
        icon: '✏️',
        visible: () => this.canEditEmployee(),
      },
      {
        id: 'toggle-status',
        label: (emp) => (emp.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'),
        icon: '🔄',
        visible: () => this.canEditEmployee(),
      },
      {
        id: 'delete',
        label: 'Delete Employee',
        icon: '🗑️',
        danger: true,
        visible: () => this.canDeleteEmployee(),
      },
    ];
  }

  /** Returns the column definitions for the roles table. */
  get roleColumns(): SharedTableColumn<RoleItem>[] {
    return [
      {
        key: 'name',
        header: 'Role Name',
        sortable: true,
        template: this.roleNameCell,
      },
      {
        key: 'description',
        header: 'Description',
        sortable: false,
        formatter: (val) => String(val || '—'),
      },
      {
        key: 'permissions',
        header: 'Granted Permissions',
        template: this.rolePermCountCell,
      },
      {
        key: 'isSystem',
        header: 'Type',
        template: this.roleTypeCell,
      },
    ];
  }

  /** Returns the row action definitions for the roles table. */
  get roleTableActions(): SharedTableAction<RoleItem>[] {
    return [
      {
        id: 'edit',
        label: 'Edit Permissions',
        icon: '✏️',
        visible: () => true,
      },
      {
        id: 'delete',
        label: 'Delete Role',
        icon: '🗑️',
        danger: true,
        visible: (role) => !role.isSystem,
      },
    ];
  }

  /** Checks whether the current user has permission to view employee salaries. */
  canViewSalary(): boolean {
    return this.authService.hasPermission('employees.salary.view');
  }

  /** Checks whether the current user can create new employees. */
  canCreateEmployee(): boolean {
    return (
      this.authService.currentUser()?.isOwner === true ||
      this.authService.hasPermission('employees.create')
    );
  }

  /** Checks whether the current user can edit existing employees. */
  canEditEmployee(): boolean {
    return (
      this.authService.currentUser()?.isOwner === true ||
      this.authService.hasPermission('employees.update')
    );
  }

  /** Checks whether the current user can delete employees. */
  canDeleteEmployee(): boolean {
    return (
      this.authService.currentUser()?.isOwner === true ||
      this.authService.hasPermission('employees.delete')
    );
  }

  /** Initializes directory data and branch-to-department form listeners. */
  ngOnInit(): void {
    this.loadEmployees();
    this.loadRoles();
    this.loadDepartments();
    this.loadBranches();
    this.loadSeatStatus();
    this.inviteForm.get('branchId')?.valueChanges.subscribe((branchId: string) => {
      this.updateDepartmentOptions(branchId);
    });
    this.editForm.get('branchId')?.valueChanges.subscribe((branchId: string) => {
      this.updateDepartmentOptions(branchId);
    });
  }

  /** Loads all roles configured for the workspace. */
  loadRoles(): void {
    this.api.get<RoleItem[]>('roles').subscribe({
      next: (data) => {
        this.roles.set(data || []);
        const empRole =
          (data || []).find((r) => r.name.toUpperCase() === 'EMPLOYEE') || (data || [])[0];
        if (empRole && !this.inviteForm.get('roleId')?.value) {
          this.inviteForm.patchValue({ roleId: empRole._id || empRole.id });
        }
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  /** Loads branch options for employee assignment and filtering. */
  loadBranches(): void {
    this.api.get<any[]>('branches').subscribe({
      next: (branches) => {
        this.allBranches.set(branches || []);
        const options: SelectOption[] = [
          { label: 'Unassigned Branch (Company HQ)', value: '' },
          ...(branches || []).map((b) => ({
            label:
              b.name +
              (b.timezone || b.currency
                ? ` (${[b.timezone, b.currency].filter(Boolean).join(' • ')})`
                : ''),
            value: b.branchId,
          })),
        ];
        this.branchOptions.set(options);
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  /** Resolves the operating currency for a given branch ID, falling back to the company currency. */
  getBranchCurrency(branchId?: string | null): string {
    if (branchId) {
      const branch = this.allBranches().find((b) => b.branchId === branchId);
      if (branch?.currency) return branch.currency;
    }
    return this.authService.effectiveCurrency();
  }

  /** Formats an employee's salary in their assigned branch currency or the company currency. */
  formatEmployeeSalary(emp: EmployeeRecord): string {
    const currency = this.getBranchCurrency(emp.branchId);
    return this.authService.formatCurrency(emp.salary, currency);
  }

  /** Loads all workspace departments and populates select options. */
  loadDepartments(): void {
    this.api.get<DepartmentItem[]>('departments').subscribe({
      next: (depts) => {
        this.allDepartments.set(depts || []);
        this.updateDepartmentOptions();
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  /** Updates department select options filtered by the selected branch. */
  updateDepartmentOptions(selectedBranchId?: string): void {
    const depts = this.allDepartments();
    const filtered = depts.filter((d) => {
      if (!selectedBranchId) return true;
      return !d.branchId || d.isCompanyWide || d.branchId === selectedBranchId;
    });
    const options: SelectOption[] = [
      { label: 'Unassigned Department', value: '' },
      ...filtered.map((d) => ({
        label: d.branchName ? `${d.name} (${d.branchName})` : d.name,
        value: d.departmentId,
      })),
    ];
    this.departmentOptions.set(options);
    this.cdr.markForCheck();
  }

  /** Fetches the paginated and filtered list of employees from the API. */
  loadEmployees(): void {
    const filterVal = this.filterForm.value;
    const params: Record<string, string | number | boolean | undefined> = {
      search: this.searchQuery(),
    };
    if (filterVal.departmentId) {
      params['departmentId'] = filterVal.departmentId;
    }
    if (filterVal.branchId) {
      params['branchId'] = filterVal.branchId;
    }
    if (filterVal.status) {
      params['status'] = filterVal.status;
    }
    if (this.isPaginationEnabled()) {
      params['page'] = this.currentPage();
      params['limit'] = this.pageSize();
      params['pagination'] = 'true';
    } else {
      params['pagination'] = 'false';
    }
    this.api.get<{ data: EmployeeRecord[]; total?: number }>('employees', params).subscribe({
      next: (res) => {
        let list = res.data || [];
        if (filterVal.employmentType) {
          list = list.filter((e) => e.employmentType === filterVal.employmentType);
        }
        this.employees.set(list);
        this.totalEmployees.set(res.total ?? list.length);
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  /** Handles search input changes from the employees table. */
  onTableSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  /** Handles page and page-size changes from the employees table. */
  onTablePageChange(event: SharedTablePageEvent): void {
    this.currentPage.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadEmployees();
  }

  /** Handles column sorting changes on the employees table. */
  onTableSortChange(event: SharedTableSortEvent<EmployeeRecord>): void {
    this.sortField.set(String(event.column.key));
    this.sortDirection.set(event.direction === 'desc' ? 'desc' : 'asc');
    this.cdr.markForCheck();
  }

  /** Dispatches row action clicks from the employees table. */
  onEmployeeTableActionClick(event: SharedTableActionEvent<EmployeeRecord>): void {
    const actionId = event.action.id;
    const emp = event.row;
    if (actionId === 'edit') {
      this.openEditModal(emp);
    } else if (actionId === 'toggle-status') {
      this.toggleStatus(emp);
    } else if (actionId === 'delete') {
      this.pendingDeleteEmployee.set(emp);
      this.cdr.markForCheck();
    }
  }

  /** Toggles selection of all employees on the current page. */
  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedEmployeeIds.set(new Set());
    } else {
      const set = new Set(this.employees().map((e) => e.employeeId));
      this.selectedEmployeeIds.set(set);
    }
    this.cdr.markForCheck();
  }

  /** Toggles selection state for a single employee row. */
  toggleSelectEmployee(id: string): void {
    const current = new Set(this.selectedEmployeeIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedEmployeeIds.set(current);
    this.cdr.markForCheck();
  }

  /** Clears all selected employee rows. */
  clearSelection(): void {
    this.selectedEmployeeIds.set(new Set());
    this.cdr.markForCheck();
  }

  /** Opens the employee filter modal. */
  openFilterModal(): void {
    this.isFilterModalOpen.set(true);
    this.cdr.markForCheck();
  }

  /** Closes the employee filter modal. */
  closeFilterModal(): void {
    this.isFilterModalOpen.set(false);
    this.cdr.markForCheck();
  }

  /** Applies the active filter form criteria and reloads employees. */
  applyFilters(): void {
    this.isFilterModalOpen.set(false);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  /** Resets all employee filters to defaults and reloads employees. */
  resetFilters(): void {
    this.filterForm.reset({
      branchId: '',
      departmentId: '',
      status: '',
      employmentType: '',
    });
    this.isFilterModalOpen.set(false);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  // loadSeatStatus: fetches workspace seat capacity and active count
  loadSeatStatus(): void {
    this.api.get<SeatStatusResponse>('companies/seats/status').subscribe({
      next: (res) => {
        this.seatStatus.set(res);
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  // openInviteModal: opens the modal for inviting a new employee
  openInviteModal(): void {
    if (this.isSeatLimitReached()) {
      const seats = this.seatStatus();
      this.actionFeedback.set({
        message: `You have reached your ${seats?.purchasedSeats ?? 5} employee seats plan. Please add more seats in Settings to invite team members.`,
        isError: true,
      });
      return;
    }
    let defaultRoleId = '';
    const empRole =
      this.roles().find((r) => r.name.toUpperCase() === 'EMPLOYEE') || this.roles()[0];
    if (empRole) {
      defaultRoleId = (empRole._id || empRole.id)!;
    }
    this.inviteForm.reset({
      roleId: defaultRoleId,
      employmentType: 'FULL_TIME',
      salary: 0,
      taxPercentage: null,
      userLocationRegion: '',
      departmentId: '',
      branchId: '',
      phone: '',
    });
    this.updateDepartmentOptions('');
    this.isInviteModalOpen.set(true);
    this.invitationSuccessLink.set(null);
    this.cdr.markForCheck();
  }

  /** Closes the invite employee modal. */
  closeInviteModal(): void {
    this.isInviteModalOpen.set(false);
    this.cdr.markForCheck();
  }

  /** Submits the new employee invitation to the API. */
  submitInvite(): void {
    if (this.inviteForm.invalid) return;
    this.isSubmitting.set(true);
    const payload = { ...this.inviteForm.value };
    if (!payload.departmentId || !this.hasDepartments()) delete payload.departmentId;
    if (!payload.branchId || !this.hasBranches()) delete payload.branchId;
    this.api
      .post<{ employee: EmployeeRecord; invitationLink: string }>('employees', payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.closeInviteModal();
          const inviteUrl = res.invitationLink.startsWith('http')
            ? res.invitationLink.replace(/http:\/\/localhost:\d+/, environment.marketingUrl).replace('/register', '/invite')
            : `${environment.marketingUrl}${res.invitationLink.replace('/register', '/invite')}`;
          this.invitationSuccessLink.set(inviteUrl);
          this.isInviteSuccessModalOpen.set(true);
          this.setFeedback(`Employee created and invite link has been sent to ${payload.email}.`);
          this.loadEmployees();
          this.loadSeatStatus();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.setFeedback(err?.error?.message || 'Failed to send invitation', true);
          this.cdr.markForCheck();
        },
      });
  }

  /** Opens the modal to edit an existing employee's details and role. */
  openEditModal(emp: EmployeeRecord): void {
    this.editingEmployee.set(emp);
    this.updateDepartmentOptions(emp.branchId);
    let matchedRoleId = emp.roleId || '';
    if (!matchedRoleId && emp.roleName) {
      const r = this.roles().find((x) => x.name.toLowerCase() === emp.roleName?.toLowerCase());
      if (r) matchedRoleId = (r._id || r.id)!;
    }
    if (!matchedRoleId && this.roles().length > 0) {
      const defaultR =
        this.roles().find((x) => x.name.toUpperCase() === 'EMPLOYEE') || this.roles()[0];
      matchedRoleId = (defaultR._id || defaultR.id)!;
    }
    this.editForm.patchValue({
      roleId: matchedRoleId,
      departmentId: emp.departmentId || '',
      branchId: emp.branchId || '',
      phone: emp.phone || '',
      designation: emp.designation,
      employmentType: emp.employmentType,
      salary: emp.salary || 0,
      taxPercentage: emp.taxPercentage ?? null,
      userLocationRegion: emp.userLocationRegion || '',
      status: emp.status,
    });
    this.isEditModalOpen.set(true);
    this.cdr.markForCheck();
  }

  /** Closes the edit employee modal. */
  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingEmployee.set(null);
    this.cdr.markForCheck();
  }

  /** Submits updated employee profile and role assignments to the API. */
  submitEdit(): void {
    const emp = this.editingEmployee();
    if (!emp || this.editForm.invalid) return;
    this.isSubmitting.set(true);
    const payload = { ...this.editForm.value };
    if (!payload.departmentId || !this.hasDepartments()) delete payload.departmentId;
    if (!payload.branchId || !this.hasBranches()) delete payload.branchId;
    this.api.patch<EmployeeRecord>(`employees/${emp.employeeId}`, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeEditModal();
        this.actionFeedback.set({
          message: `Employee record for ${emp.firstName} ${emp.lastName} updated successfully.`,
        });
        this.loadEmployees();
        this.loadSeatStatus();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.actionFeedback.set({
          message: err?.error?.message || 'Failed to update employee',
          isError: true,
        });
        this.cdr.markForCheck();
      },
    });
  }

  /** Toggles an employee's account status between ACTIVE and INACTIVE. */
  toggleStatus(emp: EmployeeRecord): void {
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.api
      .patch<EmployeeRecord>(`employees/${emp.employeeId}/status`, { status: newStatus })
      .subscribe({
        next: () => {
          this.actionFeedback.set({
            message: `${emp.firstName} ${emp.lastName} status updated to ${newStatus}.`,
          });
          this.loadEmployees();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.actionFeedback.set({
            message: err?.error?.message || 'Failed to update employee status',
            isError: true,
          });
          this.cdr.markForCheck();
        },
      });
  }

  /** Permanently deletes the selected employee record via the API. */
  confirmDeleteEmployee(): void {
    const emp = this.pendingDeleteEmployee();
    if (!emp) return;
    this.isDeletingEmployee.set(true);
    this.api.delete(`employees/${emp.employeeId}`).subscribe({
      next: () => {
        this.isDeletingEmployee.set(false);
        this.pendingDeleteEmployee.set(null);
        this.employees.update((list) => list.filter((e) => e.employeeId !== emp.employeeId));
        this.actionFeedback.set({
          message: `Employee ${emp.firstName} ${emp.lastName} permanently deleted.`,
        });
        this.loadEmployees();
        this.loadSeatStatus();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeletingEmployee.set(false);
        this.actionFeedback.set({
          message: err?.error?.message || 'Failed to delete employee',
          isError: true,
        });
        this.cdr.markForCheck();
      },
    });
  }

  /** Opens the modal for creating a new custom role. */
  openCreateRoleModal(): void {
    this.editingRole.set(null);
    this.roleForm.reset({ name: '', description: '' });
    this.roleForm.get('name')?.enable();
    this.roleFormPermissions.set([]);
    this.isRoleModalOpen.set(true);
    this.cdr.markForCheck();
  }

  /** Opens the modal for editing an existing role and its permissions. */
  openEditRoleModal(role: RoleItem): void {
    this.editingRole.set(role);
    this.roleForm.patchValue({
      name: role.name,
      description: role.description || '',
    });
    if (role.isSystem) {
      this.roleForm.get('name')?.disable();
    } else {
      this.roleForm.get('name')?.enable();
    }
    this.roleFormPermissions.set([...(role.permissions || [])]);
    this.isRoleModalOpen.set(true);
    this.cdr.markForCheck();
  }

  /** Closes the role creation and editing modal. */
  closeRoleModal(): void {
    this.isRoleModalOpen.set(false);
    this.editingRole.set(null);
    this.cdr.markForCheck();
  }

  /** Dispatches row actions from the roles table. */
  onRoleTableActionClick(event: SharedTableActionEvent<RoleItem>): void {
    if (event.action.id === 'edit') {
      this.openEditRoleModal(event.row);
    } else if (event.action.id === 'delete') {
      this.promptDeleteRole(event.row);
    }
  }

  /** Submits new or updated role and permissions to the API. */
  submitRole(): void {
    const rawVal = this.roleForm.getRawValue();
    const name = (rawVal.name || '').trim();
    if (!name) {
      this.actionFeedback.set({ message: 'Role name is required', isError: true });
      return;
    }
    this.isSubmittingRole.set(true);
    const editing = this.editingRole();
    const permissions = this.roleFormPermissions();
    const description = (rawVal.description || '').trim();
    if (editing) {
      const roleId = editing._id || editing.id;
      this.api
        .patch<RoleItem>(`roles/${roleId}`, {
          name,
          description,
          permissions,
        })
        .subscribe({
          next: (updated) => {
            this.isSubmittingRole.set(false);
            this.closeRoleModal();
            this.actionFeedback.set({
              message: `Role "${updated.name}" updated successfully.`,
            });
            this.loadRoles();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.isSubmittingRole.set(false);
            this.actionFeedback.set({
              message: err?.error?.message || 'Failed to update role',
              isError: true,
            });
            this.cdr.markForCheck();
          },
        });
    } else {
      this.api
        .post<RoleItem>('roles', {
          name,
          description,
          permissions,
        })
        .subscribe({
          next: (created) => {
            this.isSubmittingRole.set(false);
            this.closeRoleModal();
            this.actionFeedback.set({
              message: `Role "${created.name}" created successfully.`,
            });
            this.loadRoles();
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.isSubmittingRole.set(false);
            this.actionFeedback.set({
              message: err?.error?.message || 'Failed to create role',
              isError: true,
            });
            this.cdr.markForCheck();
          },
        });
    }
  }

  /** Prompts confirmation before deleting a custom role. */
  promptDeleteRole(role: RoleItem): void {
    if (role.isSystem) {
      this.actionFeedback.set({ message: 'System roles cannot be deleted.', isError: true });
      return;
    }
    this.pendingDeleteRole.set(role);
    this.cdr.markForCheck();
  }

  /** Confirms and executes deletion of a custom role via the API. */
  confirmDeleteRole(): void {
    const role = this.pendingDeleteRole();
    if (!role) return;
    this.isDeletingRole.set(true);
    const roleId = role._id || role.id;
    this.api.delete(`roles/${roleId}`).subscribe({
      next: () => {
        this.isDeletingRole.set(false);
        this.pendingDeleteRole.set(null);
        this.actionFeedback.set({ message: `Role "${role.name}" deleted successfully.` });
        this.loadRoles();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeletingRole.set(false);
        this.actionFeedback.set({
          message: err?.error?.message || 'Failed to delete role',
          isError: true,
        });
        this.cdr.markForCheck();
      },
    });
  }

  /** Maps employee status string to badge color variant. */
  getStatusVariant(status: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'warning';
      case 'INVITED':
        return 'primary';
      case 'INACTIVE':
      case 'TERMINATED':
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
