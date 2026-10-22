import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LayoutService } from '../../core/services/layout.service';
import { ApiService } from '../../core/services/api.service';

import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppButtonComponent } from '../../shared/components/button/button.component';

export interface SidebarCounts {
  employees: number;
  tasks: number;
  meetings: number;
  attendance: number;
  messages: number;
  expenses: number;
  todos: number;
  resignations: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AppModalComponent, AppButtonComponent],
  template: `
    @if (layoutService.isMobileOpen()) {
      <div
        (click)="layoutService.closeMobile()"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
      ></div>
    }

    <aside
      class="w-72 fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-[#2A65F6] dark:bg-black dark:border-r dark:border-white/10 text-white select-none transition-all duration-300 ease-in-out flex-shrink-0 lg:static lg:z-auto lg:translate-x-0 lg:transform-none"
      [class.max-lg:-translate-x-full]="!layoutService.isMobileOpen()"
      [class.max-lg:translate-x-0]="layoutService.isMobileOpen()"
      [class.lg:w-20]="layoutService.isDesktopCollapsed()"
      [class.lg:w-64]="!layoutService.isDesktopCollapsed()"
    >
      <div class="p-4 flex items-center justify-between">
        <div
          class="flex items-center justify-between px-2.5 py-[10px] rounded-[8px] bg-white/12 dark:bg-neutral-900/90 border border-white/15 dark:border-white/10 hover:bg-white/15 dark:hover:bg-neutral-900 transition cursor-pointer flex-1 min-w-0"
          [class.lg:hidden]="layoutService.isDesktopCollapsed()"
        >
          <div class="flex items-center space-x-3 min-w-0">
            <div
              class="flex items-center justify-center w-9 h-9 rounded-[8px] bg-white/20 text-white shadow-inner flex-shrink-0 overflow-hidden"
            >
              @if (authService.currentCompany()?.logoUrl) {
                <img
                  [src]="authService.currentCompany()?.logoUrl"
                  alt="Company Logo"
                  class="w-full h-full object-cover"
                />
              } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              }
            </div>
            <div class="text-left leading-tight min-w-0">
              <h4 class="text-sm font-semibold text-white truncate max-w-[170px]">
                {{ authService.currentCompany()?.name || 'WorkivLab' }}
              </h4>
              <p class="text-xs text-blue-100/70 truncate max-w-[170px]">app.workivlab.com</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          (click)="layoutService.closeMobile()"
          class="ml-2 p-2 rounded-[8px] bg-white/12 hover:bg-white/20 text-white lg:hidden transition flex-shrink-0"
          aria-label="Close mobile menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        @if (layoutService.isDesktopCollapsed()) {
          <div
            class="hidden lg:flex items-center justify-center w-11 h-11 mx-auto rounded-[8px] bg-white/12 border border-white/15 hover:bg-white/20 transition cursor-pointer shadow-inner overflow-hidden"
            [title]="authService.currentCompany()?.name || 'WorkivLab'"
          >
            @if (authService.currentCompany()?.logoUrl) {
              <img
                [src]="authService.currentCompany()?.logoUrl"
                alt="Company Logo"
                class="w-full h-full object-cover"
              />
            } @else {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            }
          </div>
        }
      </div>

      <nav class="flex-1 px-3 space-y-1 overflow-y-auto">
        @if (authService.isSuperAdmin()) {
          <a
            routerLink="/superadmin"
            routerLinkActive="sidebar-nav-active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-semibold bg-amber-500/25 border border-amber-300/30 text-amber-200 hover:bg-amber-500/35 transition group mb-2"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Super Admin Portal"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span
                class="font-semibold tracking-wide text-amber-200"
                [class.lg:hidden]="layoutService.isDesktopCollapsed()"
              >
                Super Admin
              </span>
            </div>
          </a>

          <a
            routerLink="/superadmin"
            [queryParams]="{ tab: 'companies' }"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Registered Companies"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0v-4a2 2 0 012-2h2a2 2 0 012 2v4M7 7h1m0 4h1m4-4h1m-1 4h1" />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Companies & Plans</span>
            </div>
          </a>

          <a
            routerLink="/superadmin"
            [queryParams]="{ tab: 'audit_logs' }"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="System Audit Logs"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">System Audit Logs</span>
            </div>
          </a>

          <a
            routerLink="/superadmin"
            [queryParams]="{ tab: 'users' }"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Users Directory"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Users Directory</span>
            </div>
          </a>
        } @else {
        <a
          routerLink="/dashboard"
          routerLinkActive="sidebar-nav-active"
          [routerLinkActiveOptions]="{ exact: true }"
          (click)="layoutService.closeMobile()"
          class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
          [ngClass]="
            layoutService.isDesktopCollapsed()
              ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
              : 'px-3.5 py-[10px] justify-between'
          "
          title="Dashboard"
        >
          <div
            class="flex items-center space-x-3"
            [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-white flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Dashboard</span>
          </div>
        </a>

        @if (
          authService.hasAnyPermission([
            'employees.view',
            'employees.create',
            'employees.update',
            'employees.delete',
          ])
        ) {
          <a
            routerLink="/employees"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 dark:hover:bg-slate-800/80 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Employees"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Employees</span>
            </div>
          </a>
        }

        @if (
          authService.hasAnyPermission([
            'email_campaigns.view',
            'email_campaigns.create',
            'email_campaigns.send',
          ])
        ) {
          <a
            routerLink="/broadcasts"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Broadcasts"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Broadcasts</span>
            </div>
          </a>
        }

        @if (authService.hasAnyPermission(['messages.view', 'messages.create'])) {
          <a
            routerLink="/chat"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Messages"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <div class="relative flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                @if (layoutService.isDesktopCollapsed() && counts().messages > 0) {
                  <span
                    class="hidden lg:block absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"
                  ></span>
                }
              </div>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Messages</span>
            </div>
            @if (counts().messages > 0) {
              <span
                [class.lg:hidden]="layoutService.isDesktopCollapsed()"
                class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-md bg-white/20 dark:bg-slate-800 text-white"
                >{{ counts().messages }}</span
              >
            }
          </a>
        }

        @if (
          authService.hasAnyPermission(['meetings.view', 'meetings.create', 'meetings.update'])
        ) {
          <a
            routerLink="/meetings"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Meetings"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <div class="relative flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Meetings</span>
            </div>
          </a>
        }

        @if (
          authService.hasAnyPermission([
            'attendance.view',
            'attendance.create',
            'attendance.update',
          ])
        ) {
          <a
            routerLink="/attendance"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Activity"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <div class="relative flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Activity</span>
            </div>
          </a>
        }

        @if (
          authService.hasAnyPermission([
            'tasks.view',
            'tasks.create',
            'tasks.update',
            'tasks.delete',
          ])
        ) {
          <a
            routerLink="/tasks"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="My tasks"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <div class="relative flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">My tasks</span>
            </div>
          </a>
        }

        <a
          routerLink="/todos"
          routerLinkActive="sidebar-nav-active"
          (click)="layoutService.closeMobile()"
          class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
          [ngClass]="
            layoutService.isDesktopCollapsed()
              ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
              : 'px-3.5 py-[10px] justify-between'
          "
          title="Personal Todos"
        >
          <div
            class="flex items-center space-x-3"
            [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
          >
            <div class="relative flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Personal Todos</span>
          </div>
          <div class="flex items-center space-x-1.5" [class.lg:hidden]="layoutService.isDesktopCollapsed()">
            <span
              class="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-400/30 text-emerald-200"
              >Timer</span
            >
          </div>
        </a>

        @if (
          authService.hasAnyPermission([
            'reports.view',
            'reports.generate',
            'reports.employee.view',
            'reports.employee.generate',
          ])
        ) {
          <a
            routerLink="/reports"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Analytics"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Analytics</span>
            </div>
          </a>
        }

        @if (
          authService.hasAnyPermission([
            'departments.view',
            'departments.create',
            'departments.update',
            'departments.delete',
          ])
        ) {
          <a
            routerLink="/departments"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Projects"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Projects</span>
            </div>
          </a>
        }

        @if (authService.hasAnyPermission(['payroll.view', 'payroll.generate']) || authService.currentUser()?.isOwner) {
          <a
            routerLink="/payroll"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Payroll & Slips"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Payroll & Slips</span>
            </div>
          </a>
        }

        @if (authService.hasAnyPermission(['expenses.view', 'expenses.create']) || authService.currentUser()?.isOwner) {
          <a
            routerLink="/expenses"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Accountant & Expenses"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Accountant</span>
            </div>
          </a>
        }

        @if (authService.hasAnyPermission(['marketing.posts.view', 'marketing.posts.create']) || authService.currentUser()?.isOwner) {
          <a
            routerLink="/marketing"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Social Media Designer"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Social Media</span>
            </div>
          </a>
        }

        <a
          routerLink="/resignations"
          routerLinkActive="sidebar-nav-active"
          (click)="layoutService.closeMobile()"
          class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
          [ngClass]="
            layoutService.isDesktopCollapsed()
              ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
              : 'px-3.5 py-[10px] justify-between'
          "
          title="Exit Clearance"
        >
          <div
            class="flex items-center space-x-3"
            [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Exit Clearance</span>
          </div>
        </a>

        @if (authService.hasAnyPermission(['company.settings.view', 'company.settings.update'])) {
          <a
            routerLink="/settings"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Settings"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Settings</span>
            </div>
          </a>
        }

        @if (authService.hasAnyPermission(['leave.view', 'leave.create', 'leave.approve'])) {
          <a
            routerLink="/leave"
            routerLinkActive="sidebar-nav-active"
            (click)="layoutService.closeMobile()"
            class="flex items-center rounded-xl text-sm font-medium hover:bg-white/10 transition group"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-3.5 py-[10px] lg:px-0 lg:py-[10px] lg:justify-center'
                : 'px-3.5 py-[10px] justify-between'
            "
            title="Documentation"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-blue-100 group-hover:text-white flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span [class.lg:hidden]="layoutService.isDesktopCollapsed()">Documentation</span>
            </div>
          </a>
        }
      }
      </nav>

      <div class="p-4 space-y-3">

        <div class="relative">
          <div
            (click)="toggleUserMenu()"
            class="flex items-center rounded-[8px] bg-white/12 border border-white/15 hover:bg-white/15 transition cursor-pointer"
            [ngClass]="
              layoutService.isDesktopCollapsed()
                ? 'px-2.5 py-[10px] lg:p-2 lg:justify-center'
                : 'px-2.5 py-[10px] justify-between'
            "
            [title]="authService.currentUser()?.displayName || 'Frankie Sullivan'"
          >
            <div
              class="flex items-center space-x-3"
              [class.lg:space-x-0]="layoutService.isDesktopCollapsed()"
            >
              <div
                class="w-9 h-9 rounded-full bg-amber-500/80 border-2 border-white/30 flex items-center justify-center font-bold text-sm text-white overflow-hidden flex-shrink-0"
              >
                @if (authService.currentUser()?.avatarUrl) {
                  <img
                    [src]="authService.currentUser()?.avatarUrl"
                    class="w-full h-full object-cover"
                  />
                } @else {
                  <span>{{ getInitials() }}</span>
                }
              </div>
              <div
                class="text-left leading-tight min-w-0"
                [class.lg:hidden]="layoutService.isDesktopCollapsed()"
              >
                <h4 class="text-sm font-semibold text-white truncate max-w-[120px]">
                  {{ authService.currentUser()?.displayName || 'Frankie Sullivan' }}
                </h4>
                <p class="text-xs text-blue-100/70 truncate max-w-[120px]">
                  {{ authService.currentUser()?.email || 'frankie@untitledui.com' }}
                </p>
              </div>
            </div>
            <svg
              [class.lg:hidden]="layoutService.isDesktopCollapsed()"
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 text-blue-200 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </div>

          @if (isUserMenuOpen()) {
            <div
              class="absolute mb-2 bg-white dark:bg-slate-900 rounded-[8px] shadow-xl border border-slate-100 dark:border-slate-800 py-1 text-slate-800 dark:text-slate-200 z-50"
              [ngClass]="
                layoutService.isDesktopCollapsed()
                  ? 'bottom-0 left-full ml-3 w-56'
                  : 'bottom-full left-0 w-full'
              "
            >
              <div class="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p class="text-xs text-slate-400">Signed in as</p>
                <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {{ authService.currentUser()?.email }}
                </p>
              </div>
              <button
                type="button"
                (click)="openProfileModal()"
                class="w-full text-left px-3.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center space-x-2 transition border-b border-slate-100 dark:border-slate-800"
              >
                <span>👤</span>
                <span>My Profile & Avatar</span>
              </button>
              <button
                type="button"
                (click)="authService.logout()"
                class="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-2 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign out</span>
              </button>
            </div>
          }
        </div>

        <div class="hidden lg:flex pt-1 border-t border-white/10">
          <button
            type="button"
            (click)="layoutService.toggleCollapse()"
            class="w-full flex items-center py-[10px] px-2 rounded-[8px] text-blue-100 hover:text-white hover:bg-white/10 transition text-xs font-medium"
            [ngClass]="
              layoutService.isDesktopCollapsed() ? 'justify-center' : 'justify-between px-3'
            "
            [title]="layoutService.isDesktopCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <span [class.hidden]="layoutService.isDesktopCollapsed()">Collapse sidebar</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 transition-transform duration-300"
              [class.rotate-180]="layoutService.isDesktopCollapsed()"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <app-modal
      [isOpen]="isProfileModalOpen()"
      title="Edit My Profile & Avatar"
      (closed)="closeProfileModal()"
    >
      <div class="space-y-4 text-slate-800 dark:text-slate-200">
        @if (profileFeedback()) {
          <div
            class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between"
          >
            <span>{{ profileFeedback() }}</span>
            <button
              (click)="profileFeedback.set(null)"
              class="text-emerald-600 font-bold hover:text-emerald-800"
            >
              ✕
            </button>
          </div>
        }

        <div
          class="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
        >
          <div
            class="relative w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner"
          >
            @if (profileAvatarUrl) {
              <img [src]="profileAvatarUrl" class="w-full h-full object-cover" />
            } @else {
              <span class="text-xl font-bold text-slate-600 dark:text-slate-300">{{
                getInitials()
              }}</span>
            }
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Profile Photo
            </label>
            <div class="flex items-center space-x-2">
              <label
                class="cursor-pointer px-3 py-1.5 rounded-xl bg-[#2A65F6] hover:bg-[#1f50c8] text-white text-xs font-medium transition shadow-sm"
              >
                <span>{{ isUploadingAvatar() ? 'Uploading...' : 'Upload New' }}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  class="hidden"
                  (change)="onAvatarSelected($event)"
                  [disabled]="isUploadingAvatar()"
                />
              </label>
              @if (profileAvatarUrl) {
                <button
                  type="button"
                  (click)="profileAvatarUrl = ''"
                  class="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500 text-xs transition"
                >
                  Remove
                </button>
              }
            </div>
            <p class="text-[10px] text-slate-400">PNG, JPG, or WEBP up to 5MB</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              First Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="profileFirstName"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2A65F6]"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Last Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="profileLastName"
              class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2A65F6]"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            [(ngModel)]="profilePhone"
            placeholder="+1 234 567 8900"
            class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2A65F6]"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Residential Address
          </label>
          <textarea
            [(ngModel)]="profileAddress"
            rows="2"
            placeholder="Street address, city, state, zip..."
            class="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2A65F6]"
          ></textarea>
        </div>

        <div
          class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800"
        >
          <app-button variant="secondary" type="button" (click)="closeProfileModal()"
            >Cancel</app-button
          >
          <app-button type="button" [loading]="isSavingProfile()" (click)="saveProfile()"
            >Save Changes</app-button
          >
        </div>
      </div>
    </app-modal>
  `,
})
export class SidebarComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly layoutService = inject(LayoutService);
  private readonly api = inject(ApiService);
  readonly isUserMenuOpen = signal<boolean>(false);
  readonly isProfileModalOpen = signal<boolean>(false);
  readonly isSavingProfile = signal<boolean>(false);
  readonly isUploadingAvatar = signal<boolean>(false);
  readonly profileFeedback = signal<string | null>(null);

  profileFirstName = '';
  profileLastName = '';
  profilePhone = '';
  profileAddress = '';
  profileAvatarUrl = '';

  readonly counts = signal<SidebarCounts>({
    employees: 0,
    tasks: 0,
    meetings: 0,
    attendance: 0,
    messages: 0,
    expenses: 0,
    todos: 0,
    resignations: 0,
  });

  ngOnInit(): void {
    this.loadCounts();
    // Periodically update badge counts every 30 seconds
    setInterval(() => {
      if (this.authService.token()) {
        this.loadCounts();
      }
    }, 30000);
  }

  loadCounts(): void {
    if (!this.authService.token()) return;
    this.api.get<SidebarCounts>('reports/sidebar-counts').subscribe({
      next: (res) => this.counts.set(res),
      error: () => {},
    });
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  openProfileModal(): void {
    const user = this.authService.currentUser();
    this.profileFirstName = user?.firstName || '';
    this.profileLastName = user?.lastName || '';
    this.profilePhone = user?.phone || '';
    this.profileAddress = user?.address || '';
    this.profileAvatarUrl = user?.avatarUrl || '';
    this.profileFeedback.set(null);
    this.isUserMenuOpen.set(false);
    this.isProfileModalOpen.set(true);
  }

  closeProfileModal(): void {
    this.isProfileModalOpen.set(false);
  }

  onAvatarSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.isUploadingAvatar.set(true);
    this.api.post<{ url: string; publicId: string }>('upload/logo', formData).subscribe({
      next: (res) => {
        this.profileAvatarUrl = res.url;
        this.isUploadingAvatar.set(false);
      },
      error: () => {
        this.isUploadingAvatar.set(false);
      },
    });
  }

  saveProfile(): void {
    if (!this.profileFirstName.trim() || !this.profileLastName.trim()) {
      return;
    }

    this.isSavingProfile.set(true);
    this.authService
      .updateProfile({
        firstName: this.profileFirstName.trim(),
        lastName: this.profileLastName.trim(),
        avatarUrl: this.profileAvatarUrl.trim(),
        phone: this.profilePhone.trim(),
        address: this.profileAddress.trim(),
      })
      .subscribe({
        next: () => {
          this.isSavingProfile.set(false);
          this.profileFeedback.set('Profile successfully updated!');
          setTimeout(() => {
            this.closeProfileModal();
          }, 1000);
        },
        error: () => {
          this.isSavingProfile.set(false);
        },
      });
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'FS';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  }
}
