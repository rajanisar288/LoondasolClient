import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { environment } from '../environments/environment';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [
      () => {
        if (typeof window !== 'undefined') {
          window.location.href = `${environment.marketingUrl}/login`;
        }
        return false;
      },
    ],
    children: [],
  },
  {
    path: 'auth/login',
    canActivate: [
      () => {
        if (typeof window !== 'undefined') {
          window.location.href = `${environment.marketingUrl}/login`;
        }
        return false;
      },
    ],
    children: [],
  },
  {
    path: 'register',
    canActivate: [
      () => {
        if (typeof window !== 'undefined') {
          window.location.href = `${environment.marketingUrl}/signup`;
        }
        return false;
      },
    ],
    children: [],
  },
  {
    path: 'auth/register',
    canActivate: [
      () => {
        if (typeof window !== 'undefined') {
          window.location.href = `${environment.marketingUrl}/signup`;
        }
        return false;
      },
    ],
    children: [],
  },
  {
    path: 'home',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
        canActivate: [permissionGuard],
        data: {
          permissions: [
            'employees.view',
            'employees.create',
            'employees.update',
            'employees.delete',
          ],
        },
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/attendance/attendance.component').then((m) => m.AttendanceComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['attendance.view', 'attendance.create', 'attendance.update'] },
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/tasks.component').then((m) => m.TasksComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete'] },
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./features/departments/departments.component').then(
            (m) => m.DepartmentsComponent,
          ),
        canActivate: [permissionGuard],
        data: {
          permissions: [
            'departments.view',
            'departments.create',
            'departments.update',
            'departments.delete',
          ],
        },
      },
      {
        path: 'leave',
        loadComponent: () =>
          import('./features/leave/leave.component').then((m) => m.LeaveComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['leave.view', 'leave.create', 'leave.approve'] },
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['messages.view', 'messages.create'] },
      },
      {
        path: 'meetings',
        loadComponent: () =>
          import('./features/meetings/meetings.component').then((m) => m.MeetingsComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['meetings.view', 'meetings.create', 'meetings.update'] },
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
        canActivate: [permissionGuard],
        data: {
          permissions: [
            'reports.view',
            'reports.generate',
            'reports.employee.view',
            'reports.employee.generate',
          ],
        },
      },
      {
        path: 'broadcasts',
        loadComponent: () =>
          import('./features/broadcasts/broadcasts.component').then((m) => m.BroadcastsComponent),
        canActivate: [permissionGuard],
        data: {
          permissions: ['email_campaigns.view', 'email_campaigns.create', 'email_campaigns.send'],
        },
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['company.settings.view', 'company.settings.update'] },
      },
      {
        path: 'todos',
        loadComponent: () =>
          import('./features/todos/todos.component').then((m) => m.TodosComponent),
      },
      {
        path: 'payroll',
        loadComponent: () =>
          import('./features/payroll/payroll.component').then((m) => m.PayrollComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['payroll.view', 'payroll.generate', 'payroll.update'] },
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then((m) => m.ExpensesComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['expenses.view', 'expenses.create', 'expenses.delete'] },
      },
      {
        path: 'marketing',
        loadComponent: () =>
          import('./features/marketing/marketing.component').then((m) => m.MarketingComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['marketing.posts.view', 'marketing.posts.create'] },
      },
      {
        path: 'superadmin',
        loadComponent: () =>
          import('./features/superadmin/superadmin.component').then(
            (m) => m.SuperadminComponent,
          ),
        canActivate: [superAdminGuard],
      },
      {
        path: 'resignations',
        loadComponent: () =>
          import('./features/resignations/resignations.component').then(
            (m) => m.ResignationsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
