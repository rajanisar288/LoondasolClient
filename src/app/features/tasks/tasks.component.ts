import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from '../../shared/components/button/button.component';
import { AppInputComponent } from '../../shared/components/input/input.component';
import { AppSelectComponent, SelectOption } from '../../shared/components/select/select.component';
import { AppModalComponent } from '../../shared/components/modal/modal.component';
import { AppDrawerComponent } from '../../shared/components/drawer/drawer.component';
import { AppConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { AppAvatarComponent } from '../../shared/components/avatar/avatar.component';
import { AppRichEditorComponent } from '../../shared/components/rich-editor/rich-editor.component';

interface TaskAssignee {
  userId: string;
  name: string;
  avatarUrl?: string;
}

export interface TaskSubtaskItem {
  subtaskId: string;
  title: string;
  isCompleted: boolean;
  createdAt?: string;
}

export interface CommentReactionItem {
  userId: string;
  userName: string;
  emoji: string;
  createdAt?: string;
}

export interface CommentReplyItem {
  replyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  reactions?: CommentReactionItem[];
  createdAt: string;
}

export interface TaskCommentItem {
  commentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  reactions?: CommentReactionItem[];
  replies?: CommentReplyItem[];
  createdAt: string;
}

interface TaskItem {
  taskId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'LAUNCHED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  assigneeName?: string;
  assignees?: TaskAssignee[];
  createdBy?: string;
  dueDate?: string;
  totalSpentMinutes?: number;
  isTimerRunning?: boolean;
  activeTimerUserId?: string;
  subtasks?: TaskSubtaskItem[];
  comments?: TaskCommentItem[];
  createdAt?: string;
}

interface EmployeeOption {
  userId: string;
  name: string;
  email: string;
  departmentName?: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppInputComponent,
    AppSelectComponent,
    AppModalComponent,
    AppDrawerComponent,
    AppConfirmationModalComponent,
    AppAvatarComponent,
    AppRichEditorComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="page-title">Task Boards & Projects</h1>
          <p class="page-description">
            Organize team workflows, drag-and-drop kanban boards, live time tracking, and AI tasks.
          </p>
        </div>

        <div class="flex items-center flex-wrap gap-2.5">
          <app-button variant="secondary" size="sm" (click)="openAiModal()">
            <span class="mr-1.5">✨</span>
            <span>AI Task Creator</span>
          </app-button>

          <app-button
            variant="secondary"
            size="sm"
            (click)="dispatchAiReport()"
            [loading]="isDispatchingReport()"
          >
            <span class="mr-1.5">📊</span>
            <span>Send Report to Chat</span>
          </app-button>

          @if (authService.hasPermission('tasks.create')) {
            <app-button size="sm" (click)="openCreateModal()">
              <span class="mr-1.5">+</span>
              <span>New Task</span>
            </app-button>
          }
        </div>
      </div>

      @if (reportBannerMessage()) {
        <div
          class="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300"
        >
          <div class="flex items-center space-x-2">
            <span>✅</span>
            <span>{{ reportBannerMessage() }}</span>
          </div>
          <button (click)="reportBannerMessage.set('')" class="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      }

      <!-- Sub-navigation Tabs: Overview, List, Board, Calendar, Files -->
      <div class="flex items-center space-x-6 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold overflow-x-auto pb-px">
        @for (tab of ['Overview', 'List', 'Board', 'Calendar', 'Files']; track tab) {
          <button
            type="button"
            (click)="activeViewTab.set($any(tab))"
            class="pb-3 px-1 border-b-2 transition relative flex items-center space-x-2 shrink-0"
            [class]="activeViewTab() === tab ? 'border-[#2A65F6] text-[#2A65F6] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
          >
            <span>{{ tab }}</span>
            @if (tab === 'Board') {
              <span class="w-1.5 h-1.5 rounded-full bg-[#2A65F6]"></span>
            }
          </button>
        }
      </div>

      <!-- Filter Bar Toolbar (matching screenshot) -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Due Date Filter Dropdown -->
          <div class="relative">
            <select
              [value]="filterDateRange()"
              (change)="filterDateRange.set($any($event.target).value)"
              class="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2A65F6] cursor-pointer"
            >
              <option value="all">Due Date: All Dates</option>
              <option value="today">Due Date: Today</option>
              <option value="week">Due Date: March 17 - 24</option>
              <option value="overdue">Due Date: Overdue Only</option>
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 text-xs">⌄</span>
          </div>

          <!-- Assignee Filter Dropdown -->
          <div class="relative">
            <select
              [value]="filterAssigneeId()"
              (change)="filterAssigneeId.set($any($event.target).value)"
              class="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2A65F6] cursor-pointer max-w-[170px] truncate"
            >
              <option value="">Assignee: All</option>
              @for (emp of employees(); track emp.userId) {
                <option [value]="emp.userId">{{ emp.name }}</option>
              }
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 text-xs">⌄</span>
          </div>

          <!-- Priority Filter Dropdown -->
          <div class="relative">
            <select
              [value]="filterPriority()"
              (change)="filterPriority.set($any($event.target).value)"
              class="appearance-none pl-3 pr-7 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2A65F6] cursor-pointer"
            >
              <option value="">Priority: All</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Normal Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 text-xs">⌄</span>
          </div>

          <!-- Advance Filters Button -->
          <button
            type="button"
            (click)="openFilterDrawer()"
            class="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 flex items-center space-x-1.5 transition"
          >
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span>Advance Filters</span>
            @if (activeFilterCount() > 0) {
              <span class="px-1.5 py-0.2 rounded-full bg-[#2A65F6] text-white text-[10px] font-bold">
                {{ activeFilterCount() }}
              </span>
            }
          </button>
        </div>

        <div class="flex items-center space-x-2.5">
          <!-- Search input -->
          <div class="relative w-44 sm:w-56">
            <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search tasks..."
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2A65F6]"
            />
          </div>

          <!-- + Add New Button -->
          <button
            type="button"
            (click)="openCreateModal()"
            class="px-4 py-2 rounded-xl bg-[#2A65F6] hover:bg-[#1f50c8] text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <span class="text-sm font-bold">+</span>
            <span>Add New</span>
          </button>
        </div>
      </div>

      <!-- 4 Kanban Columns matching screenshot -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
        <!-- 1. Pending Column -->
        <div
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, 'TODO')"
          class="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col min-h-[550px]"
        >
          <!-- Column Header -->
          <div class="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Pending</h3>
              <span class="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {{ getTasksByStatus('TODO').length }}
              </span>
            </div>
            @if (authService.hasPermission('tasks.create')) {
              <button
                type="button"
                (click)="openCreateModalForStatus('TODO')"
                class="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition"
                title="Add task to Pending"
              >
                +
              </button>
            }
          </div>

          <!-- Cards List -->
          <div class="space-y-3 flex-1">
            @for (task of getTasksByStatus('TODO'); track task.taskId) {
              <div
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openTaskDetail(task)"
                class="group card p-4 bg-white dark:bg-slate-800/90 shadow-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl cursor-pointer hover:border-[#2A65F6] hover:shadow-md transition-all space-y-3"
              >
                <!-- Priority & Timer -->
                <div class="flex items-center justify-between">
                  <span
                    class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide"
                    [ngClass]="getPriorityClass(task.priority)"
                  >
                    <span>🚩</span>
                    <span>{{ getPriorityLabel(task.priority) }}</span>
                  </span>

                  <div class="flex items-center space-x-1">
                    @if (task.isTimerRunning) {
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    }
                    <button
                      type="button"
                      (click)="$event.stopPropagation(); toggleTimer(task)"
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-lg transition"
                      [class]="task.isTimerRunning
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 border border-red-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 hover:bg-slate-200'"
                      title="Toggle time tracking"
                    >
                      {{ task.isTimerRunning ? '⏹ Stop' : '▶ Track' }}
                    </button>
                  </div>
                </div>

                <!-- Title & Description -->
                <div>
                  <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#2A65F6] transition line-clamp-2">
                    {{ task.title }}
                  </h4>
                  @if (task.description) {
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {{ stripHtml(task.description) }}
                    </p>
                  }
                </div>

                <!-- Subtasks Progress Bar -->
                @if (task.subtasks && task.subtasks.length > 0) {
                  <div class="space-y-1.5 pt-1">
                    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span class="flex items-center space-x-1 font-medium">
                        <span>☑</span>
                        <span>{{ getSubtaskStats(task).completed }}/{{ getSubtaskStats(task).total }} subtasks</span>
                      </span>
                      <span class="font-semibold text-slate-700 dark:text-slate-300">{{ getSubtaskPercent(task) }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        [ngClass]="getSubtaskPercent(task) === 100 ? 'bg-emerald-500' : 'bg-[#2A65F6]'"
                        [style.width.%]="getSubtaskPercent(task)"
                      ></div>
                    </div>
                  </div>
                }

                <!-- Card Footer: Assignee Stack & Due Date / Overdue -->
                <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div class="flex items-center">
                    @if (task.assignees && task.assignees.length > 0) {
                      <div class="flex -space-x-1.5 overflow-hidden items-center">
                        @for (assignee of task.assignees.slice(0, 3); track assignee.userId) {
                          <app-avatar
                            [name]="assignee.name"
                            [imageUrl]="assignee.avatarUrl"
                            size="xs"
                            shape="circle"
                            class="ring-2 ring-white dark:ring-slate-800"
                            [title]="assignee.name"
                          ></app-avatar>
                        }
                        @if (task.assignees.length > 3) {
                          <span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                            +{{ task.assignees.length - 3 }}
                          </span>
                        }
                      </div>
                    } @else if (task.assigneeName) {
                      <app-avatar
                        [name]="task.assigneeName"
                        size="xs"
                        shape="circle"
                        [title]="task.assigneeName"
                      ></app-avatar>
                    } @else {
                      <span class="text-[11px] text-slate-400 italic">Unassigned</span>
                    }
                  </div>

                  <div class="flex items-center space-x-1.5">
                    @if (task.dueDate) {
                      @if (isOverdue(task.dueDate, task.status)) {
                        <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200/60 dark:border-rose-900/40">
                          <span>⚠️</span>
                          <span>Overdue</span>
                        </span>
                      } @else {
                        <span class="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span>📅</span>
                          <span>{{ formatDueDate(task.dueDate) }}</span>
                        </span>
                      }
                    }
                    @if (task.comments && task.comments.length > 0) {
                      <span class="inline-flex items-center space-x-0.5 text-[11px] text-slate-400">
                        <span>💬</span>
                        <span>{{ task.comments.length }}</span>
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- 2. In Progress Column -->
        <div
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, 'IN_PROGRESS')"
          class="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col min-h-[550px]"
        >
          <!-- Column Header -->
          <div class="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">In Progress</h3>
              <span class="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                {{ getTasksByStatus('IN_PROGRESS').length }}
              </span>
            </div>
            @if (authService.hasPermission('tasks.create')) {
              <button
                type="button"
                (click)="openCreateModalForStatus('IN_PROGRESS')"
                class="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition"
                title="Add task to In Progress"
              >
                +
              </button>
            }
          </div>

          <!-- Cards List -->
          <div class="space-y-3 flex-1">
            @for (task of getTasksByStatus('IN_PROGRESS'); track task.taskId) {
              <div
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openTaskDetail(task)"
                class="group card p-4 bg-white dark:bg-slate-800/90 shadow-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl cursor-pointer hover:border-[#2A65F6] hover:shadow-md transition-all space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide"
                    [ngClass]="getPriorityClass(task.priority)"
                  >
                    <span>🚩</span>
                    <span>{{ getPriorityLabel(task.priority) }}</span>
                  </span>

                  <div class="flex items-center space-x-1">
                    @if (task.isTimerRunning) {
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    }
                    <button
                      type="button"
                      (click)="$event.stopPropagation(); toggleTimer(task)"
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-lg transition"
                      [class]="task.isTimerRunning
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 border border-red-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 hover:bg-slate-200'"
                      title="Toggle time tracking"
                    >
                      {{ task.isTimerRunning ? '⏹ Stop' : '▶ Track' }}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#2A65F6] transition line-clamp-2">
                    {{ task.title }}
                  </h4>
                  @if (task.description) {
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {{ stripHtml(task.description) }}
                    </p>
                  }
                </div>

                @if (task.subtasks && task.subtasks.length > 0) {
                  <div class="space-y-1.5 pt-1">
                    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span class="flex items-center space-x-1 font-medium">
                        <span>☑</span>
                        <span>{{ getSubtaskStats(task).completed }}/{{ getSubtaskStats(task).total }} subtasks</span>
                      </span>
                      <span class="font-semibold text-slate-700 dark:text-slate-300">{{ getSubtaskPercent(task) }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        [ngClass]="getSubtaskPercent(task) === 100 ? 'bg-emerald-500' : 'bg-[#2A65F6]'"
                        [style.width.%]="getSubtaskPercent(task)"
                      ></div>
                    </div>
                  </div>
                }

                <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div class="flex items-center">
                    @if (task.assignees && task.assignees.length > 0) {
                      <div class="flex -space-x-1.5 overflow-hidden items-center">
                        @for (assignee of task.assignees.slice(0, 3); track assignee.userId) {
                          <app-avatar
                            [name]="assignee.name"
                            [imageUrl]="assignee.avatarUrl"
                            size="xs"
                            shape="circle"
                            class="ring-2 ring-white dark:ring-slate-800"
                            [title]="assignee.name"
                          ></app-avatar>
                        }
                        @if (task.assignees.length > 3) {
                          <span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                            +{{ task.assignees.length - 3 }}
                          </span>
                        }
                      </div>
                    } @else if (task.assigneeName) {
                      <app-avatar
                        [name]="task.assigneeName"
                        size="xs"
                        shape="circle"
                        [title]="task.assigneeName"
                      ></app-avatar>
                    } @else {
                      <span class="text-[11px] text-slate-400 italic">Unassigned</span>
                    }
                  </div>

                  <div class="flex items-center space-x-1.5">
                    @if (task.dueDate) {
                      @if (isOverdue(task.dueDate, task.status)) {
                        <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200/60 dark:border-rose-900/40">
                          <span>⚠️</span>
                          <span>Overdue</span>
                        </span>
                      } @else {
                        <span class="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span>📅</span>
                          <span>{{ formatDueDate(task.dueDate) }}</span>
                        </span>
                      }
                    }
                    @if (task.comments && task.comments.length > 0) {
                      <span class="inline-flex items-center space-x-0.5 text-[11px] text-slate-400">
                        <span>💬</span>
                        <span>{{ task.comments.length }}</span>
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- 3. Completed Column -->
        <div
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, 'COMPLETED')"
          class="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col min-h-[550px]"
        >
          <!-- Column Header -->
          <div class="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Completed</h3>
              <span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {{ getTasksByStatus('COMPLETED').length }}
              </span>
            </div>
            @if (authService.hasPermission('tasks.create')) {
              <button
                type="button"
                (click)="openCreateModalForStatus('COMPLETED')"
                class="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition"
                title="Add task to Completed"
              >
                +
              </button>
            }
          </div>

          <!-- Cards List -->
          <div class="space-y-3 flex-1">
            @for (task of getTasksByStatus('COMPLETED'); track task.taskId) {
              <div
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openTaskDetail(task)"
                class="group card p-4 bg-white dark:bg-slate-800/90 shadow-sm border border-slate-200/80 dark:border-slate-700/80 rounded-2xl cursor-pointer hover:border-[#2A65F6] hover:shadow-md transition-all space-y-3 opacity-90"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40"
                  >
                    <span>✓</span>
                    <span>Done</span>
                  </span>

                  <span class="text-xs text-emerald-600 font-bold">✓</span>
                </div>

                <div>
                  <h4 class="font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-through group-hover:text-[#2A65F6] transition line-clamp-2">
                    {{ task.title }}
                  </h4>
                  @if (task.description) {
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {{ stripHtml(task.description) }}
                    </p>
                  }
                </div>

                @if (task.subtasks && task.subtasks.length > 0) {
                  <div class="space-y-1.5 pt-1">
                    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span class="flex items-center space-x-1 font-medium">
                        <span>☑</span>
                        <span>{{ getSubtaskStats(task).completed }}/{{ getSubtaskStats(task).total }} subtasks</span>
                      </span>
                      <span class="font-semibold text-emerald-600">{{ getSubtaskPercent(task) }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300 bg-emerald-500"
                        [style.width.%]="getSubtaskPercent(task)"
                      ></div>
                    </div>
                  </div>
                }

                <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div class="flex items-center">
                    @if (task.assignees && task.assignees.length > 0) {
                      <div class="flex -space-x-1.5 overflow-hidden items-center">
                        @for (assignee of task.assignees.slice(0, 3); track assignee.userId) {
                          <app-avatar
                            [name]="assignee.name"
                            [imageUrl]="assignee.avatarUrl"
                            size="xs"
                            shape="circle"
                            class="ring-2 ring-white dark:ring-slate-800"
                            [title]="assignee.name"
                          ></app-avatar>
                        }
                        @if (task.assignees.length > 3) {
                          <span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                            +{{ task.assignees.length - 3 }}
                          </span>
                        }
                      </div>
                    } @else if (task.assigneeName) {
                      <app-avatar
                        [name]="task.assigneeName"
                        size="xs"
                        shape="circle"
                        [title]="task.assigneeName"
                      ></app-avatar>
                    } @else {
                      <span class="text-[11px] text-slate-400 italic">Unassigned</span>
                    }
                  </div>

                  <div class="flex items-center space-x-1.5">
                    @if (task.dueDate) {
                      <span class="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-400">
                        <span>📅</span>
                        <span>{{ formatDueDate(task.dueDate) }}</span>
                      </span>
                    }
                    @if (task.comments && task.comments.length > 0) {
                      <span class="inline-flex items-center space-x-0.5 text-[11px] text-slate-400">
                        <span>💬</span>
                        <span>{{ task.comments.length }}</span>
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- 4. Launched Column -->
        <div
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, 'LAUNCHED')"
          class="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col min-h-[550px]"
        >
          <!-- Column Header -->
          <div class="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Launched</h3>
              <span class="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                {{ getTasksByStatus('LAUNCHED').length }}
              </span>
            </div>
            @if (authService.hasPermission('tasks.create')) {
              <button
                type="button"
                (click)="openCreateModalForStatus('LAUNCHED')"
                class="w-6 h-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition"
                title="Add task to Launched"
              >
                +
              </button>
            }
          </div>

          <!-- Cards List -->
          <div class="space-y-3 flex-1">
            @for (task of getTasksByStatus('LAUNCHED'); track task.taskId) {
              <div
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd()"
                (click)="openTaskDetail(task)"
                class="group card p-4 bg-white dark:bg-slate-800/90 shadow-sm border border-purple-200/70 dark:border-purple-900/50 rounded-2xl cursor-pointer hover:border-purple-500 hover:shadow-md transition-all space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span
                    class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40"
                  >
                    <span>🚀</span>
                    <span>Launched</span>
                  </span>

                  <div class="flex items-center space-x-1">
                    @if (task.isTimerRunning) {
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    }
                    <button
                      type="button"
                      (click)="$event.stopPropagation(); toggleTimer(task)"
                      class="px-2 py-0.5 text-[10px] font-semibold rounded-lg transition"
                      [class]="task.isTimerRunning
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 border border-red-200'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 hover:bg-slate-200'"
                      title="Toggle time tracking"
                    >
                      {{ task.isTimerRunning ? '⏹ Stop' : '▶ Track' }}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition line-clamp-2">
                    {{ task.title }}
                  </h4>
                  @if (task.description) {
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {{ stripHtml(task.description) }}
                    </p>
                  }
                </div>

                @if (task.subtasks && task.subtasks.length > 0) {
                  <div class="space-y-1.5 pt-1">
                    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span class="flex items-center space-x-1 font-medium">
                        <span>☑</span>
                        <span>{{ getSubtaskStats(task).completed }}/{{ getSubtaskStats(task).total }} subtasks</span>
                      </span>
                      <span class="font-semibold text-purple-600">{{ getSubtaskPercent(task) }}%</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300 bg-purple-600"
                        [style.width.%]="getSubtaskPercent(task)"
                      ></div>
                    </div>
                  </div>
                }

                <div class="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div class="flex items-center">
                    @if (task.assignees && task.assignees.length > 0) {
                      <div class="flex -space-x-1.5 overflow-hidden items-center">
                        @for (assignee of task.assignees.slice(0, 3); track assignee.userId) {
                          <app-avatar
                            [name]="assignee.name"
                            [imageUrl]="assignee.avatarUrl"
                            size="xs"
                            shape="circle"
                            class="ring-2 ring-white dark:ring-slate-800"
                            [title]="assignee.name"
                          ></app-avatar>
                        }
                        @if (task.assignees.length > 3) {
                          <span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                            +{{ task.assignees.length - 3 }}
                          </span>
                        }
                      </div>
                    } @else if (task.assigneeName) {
                      <app-avatar
                        [name]="task.assigneeName"
                        size="xs"
                        shape="circle"
                        [title]="task.assigneeName"
                      ></app-avatar>
                    } @else {
                      <span class="text-[11px] text-slate-400 italic">Unassigned</span>
                    }
                  </div>

                  <div class="flex items-center space-x-1.5">
                    @if (task.dueDate) {
                      <span class="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span>📅</span>
                        <span>{{ formatDueDate(task.dueDate) }}</span>
                      </span>
                    }
                    @if (task.comments && task.comments.length > 0) {
                      <span class="inline-flex items-center space-x-0.5 text-[11px] text-slate-400">
                        <span>💬</span>
                        <span>{{ task.comments.length }}</span>
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <app-modal [isOpen]="isModalOpen()" title="Create New Task" (closed)="closeCreateModal()">
        <form [formGroup]="taskForm" (ngSubmit)="submitTask()" class="space-y-4">
          <app-input
            label="Task Title"
            placeholder="Implement authentication token rotation"
            [required]="true"
            formControlName="title"
          ></app-input>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Instructions
            </label>
            <app-rich-editor
              [value]="createTaskDescription"
              (valueChange)="onNewTaskDescriptionChange($event)"
              placeholder="Add detailed task instructions, checklists, formatting..."
              minHeight="130px"
            ></app-rich-editor>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <app-select
              label="Priority"
              [options]="priorityOptions"
              formControlName="priority"
            ></app-select>

            <app-select
              label="Status"
              [options]="statusOptions"
              formControlName="status"
            ></app-select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              formControlName="dueDate"
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2A65F6]"
            />
          </div>

          @if (employees().length > 0) {
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Assign Colleagues (Multi-Assignee)
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                @for (emp of employees(); track emp.userId) {
                  <label class="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      [checked]="isAssigneeSelected(emp.userId)"
                      (change)="toggleAssignee(emp)"
                      class="rounded text-[#2A65F6] focus:ring-[#2A65F6]"
                    />
                    <span class="truncate">{{ emp.name }} ({{ emp.email }})</span>
                  </label>
                }
              </div>
            </div>
          }

          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800"
          >
            <app-button variant="secondary" type="button" (click)="closeCreateModal()">Cancel</app-button>
            <app-button type="submit" [loading]="isSubmitting()">Create Task</app-button>
          </div>
        </form>
      </app-modal>

      <app-modal [isOpen]="isAiModalOpen()" title="✨ AI Task Creator" (closed)="closeAiModal()">
        <div class="space-y-4">
          <p class="text-xs text-slate-500">
            Describe the task naturally in plain English. Gemini AI will automatically extract the title, instructions, priority, due date, and matching assignees.
          </p>

          <div>
            <textarea
              [(ngModel)]="aiPromptText"
              rows="4"
              placeholder="e.g., Ask Ali to send the quarterly sales report to the client tomorrow morning with urgent priority."
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2A65F6]"
            ></textarea>
          </div>

          <div class="flex items-center justify-end space-x-3 pt-2">
            <app-button variant="secondary" (click)="closeAiModal()">Cancel</app-button>
            <app-button
              (click)="generateTaskFromAi()"
              [loading]="isGeneratingAi()"
              [disabled]="!aiPromptText.trim()"
            >
              Parse & Fill Task
            </app-button>
          </div>
        </div>
      </app-modal>

      <!-- Jira-style Task Detail LEFT Drawer -->
      <app-drawer
        [isOpen]="isDetailDrawerOpen()"
        position="left"
        customWidth="640px"
        [title]="selectedTaskDetail()?.title || 'Task Details'"
        (closed)="closeDetailDrawer()"
      >
        @if (selectedTaskDetail(); as task) {
          <div class="space-y-6 max-h-[85vh] overflow-y-auto pr-1">
            <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  [value]="task.status"
                  (change)="updateDetailStatus($any($event.target).value)"
                  class="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  @for (opt of statusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>

              <div class="flex items-center space-x-2">
                <span class="text-xs font-semibold text-slate-500">Priority:</span>
                <select
                  [value]="task.priority"
                  (change)="updateDetailPriority($any($event.target).value)"
                  class="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  @for (opt of priorityOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>

              <div class="flex items-center space-x-3 text-xs text-slate-500">
                <span class="flex items-center space-x-1 font-mono">
                  <span>⏱️</span>
                  <span>{{ formatDuration(task.totalSpentMinutes || 0) }}</span>
                </span>
                <button
                  type="button"
                  (click)="toggleTimer(task)"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg transition"
                  [class]="task.isTimerRunning ? 'bg-red-50 text-red-600 dark:bg-red-950/40 border border-red-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'"
                >
                  {{ task.isTimerRunning ? '⏹ Stop Timer' : '▶ Start Timer' }}
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Description & Specifications
                </label>
                <div class="flex items-center space-x-2">
                  @if (!isEditingDescription) {
                    <button
                      type="button"
                      (click)="startEditingDescription(task.description || '')"
                      class="text-xs text-blue-600 hover:underline font-medium"
                    >
                      ✏️ Edit
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="saveDescription()"
                      [disabled]="isSavingDescription()"
                      class="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      (click)="isEditingDescription = false"
                      class="text-xs px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded font-medium"
                    >
                      Cancel
                    </button>
                  }
                </div>
              </div>

              @if (isEditingDescription) {
                <div class="space-y-2">
                  <app-rich-editor
                    [value]="editedDescription"
                    (valueChange)="onEditDescriptionChange($event)"
                    placeholder="Write detailed specifications..."
                    minHeight="150px"
                  ></app-rich-editor>
                </div>
              } @else {
                <div
                  class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-h-[48px]"
                  [innerHTML]="getTaskDescriptionHtml(task.description)"
                ></div>
              }
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subtasks</h4>
                  <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                    {{ getSubtaskStats(task).completed }}/{{ getSubtaskStats(task).total }}
                  </span>
                </div>
                @if (getSubtaskStats(task).total > 0) {
                  <span class="text-xs font-semibold text-blue-600">
                    {{ getSubtaskPercent(task) }}% completed
                  </span>
                }
              </div>

              @if (getSubtaskStats(task).total > 0) {
                <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    class="bg-blue-600 h-full rounded-full transition-all duration-300"
                    [style.width.%]="getSubtaskPercent(task)"
                  ></div>
                </div>
              }

              <div class="space-y-1.5">
                @for (subtask of (task.subtasks || []); track subtask.subtaskId) {
                  <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <label class="flex items-center space-x-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        [checked]="subtask.isCompleted"
                        (change)="toggleSubtask(task, subtask)"
                        class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                      />
                      <span
                        class="text-xs font-medium"
                        [class]="subtask.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'"
                      >
                        {{ subtask.title }}
                      </span>
                    </label>

                    <button
                      type="button"
                      (click)="deleteSubtask(task, subtask.subtaskId)"
                      class="text-slate-400 hover:text-red-500 text-xs px-1.5 py-0.5 rounded transition"
                      title="Delete subtask"
                    >
                      ✕
                    </button>
                  </div>
                }
              </div>

              <div class="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  [(ngModel)]="newSubtaskTitle"
                  (keyup.enter)="addSubtask(task)"
                  placeholder="Add a new subtask and press Enter..."
                  class="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <app-button
                  size="sm"
                  (click)="addSubtask(task)"
                  [disabled]="!newSubtaskTitle.trim()"
                >
                  Add Subtask
                </app-button>
              </div>
            </div>

            <div class="space-y-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <span>💬 Discussion & Comments</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                    {{ getCommentCount(task) }}
                  </span>
                </h4>
                <span class="text-[11px] text-slate-400">Team members are alerted in real time</span>
              </div>

              <!-- Comments List (Facebook Style) -->
              <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
                @for (c of (task.comments || []); track c.commentId) {
                  <div class="flex items-start space-x-2.5">
                    <!-- User Avatar -->
                    <app-avatar
                      [name]="c.userName"
                      [imageUrl]="c.userAvatar"
                      size="sm"
                      shape="circle"
                      class="flex-shrink-0 mt-0.5"
                    ></app-avatar>

                    <!-- Comment Body & Actions -->
                    <div class="flex-1 min-w-0">
                      <!-- Comment Bubble -->
                      <div class="relative inline-block max-w-[95%] sm:max-w-[85%] bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-3.5 py-2.5 border border-slate-200/40 dark:border-slate-700/40">
                        <div class="flex items-center space-x-2">
                          <span class="font-bold text-xs text-slate-900 dark:text-white">{{ c.userName }}</span>
                          @if (c.userId === task.assigneeId) {
                            <span class="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[9px] font-semibold rounded">Assignee</span>
                          }
                        </div>
                        <p class="text-xs text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">{{ c.content }}</p>

                        <!-- Floating Reaction Badge -->
                        @if (c.reactions && c.reactions.length > 0) {
                          <div
                            class="absolute -bottom-2 right-2 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-full px-1.5 py-0.5 flex items-center space-x-1 cursor-pointer"
                            [title]="getReactionTooltip(c.reactions)"
                          >
                            <span class="text-[11px] leading-none">{{ getUniqueReactionEmojis(c.reactions).join('') }}</span>
                            <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">{{ c.reactions.length }}</span>
                          </div>
                        }
                      </div>

                      <!-- Action Bar -->
                      <div class="flex items-center space-x-3.5 mt-1 ml-2 text-[11px]">
                        <span class="text-slate-400 font-medium">{{ formatCommentTime(c.createdAt) }}</span>

                        <!-- Like Button with Emoji Reactions Picker -->
                        <div class="relative">
                          <button
                            type="button"
                            (click)="toggleReactionPicker('comment_' + c.commentId)"
                            class="font-bold hover:underline transition"
                            [class.text-blue-600]="getUserReaction(c.reactions)"
                            [class.dark:text-blue-400]="getUserReaction(c.reactions)"
                            [class.text-slate-600]="!getUserReaction(c.reactions)"
                            [class.dark:text-slate-400]="!getUserReaction(c.reactions)"
                          >
                            {{ getUserReaction(c.reactions) ? (getUserReaction(c.reactions) + ' Reacted') : 'Like' }}
                          </button>

                          <!-- Emoji Reaction Picker Popup -->
                          @if (activeReactionPickerId === 'comment_' + c.commentId) {
                            <div class="absolute left-0 bottom-full mb-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full px-2 py-1 flex items-center space-x-1.5 z-30 animate-in fade-in zoom-in-95">
                              @for (emoji of availableEmojis; track emoji) {
                                <button
                                  type="button"
                                  (click)="toggleCommentReaction(task, c.commentId, emoji)"
                                  class="text-base hover:scale-125 transition-transform p-0.5"
                                  [title]="emoji"
                                >
                                  {{ emoji }}
                                </button>
                              }
                            </div>
                          }
                        </div>

                        <!-- Reply Button -->
                        <button
                          type="button"
                          (click)="toggleReplyInput(c.commentId)"
                          class="font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline transition"
                        >
                          Reply
                        </button>

                        <!-- Delete Button (if author or admin) -->
                        @if (authService.currentUser()?.userId === c.userId || authService.isCompanyOwner()) {
                          <button
                            type="button"
                            (click)="deleteComment(task, c.commentId)"
                            class="text-slate-400 hover:text-red-500 hover:underline transition"
                          >
                            Delete
                          </button>
                        }
                      </div>

                      <!-- Nested Replies (Facebook Style) -->
                      @if ((c.replies && c.replies.length > 0) || replyingCommentId === c.commentId) {
                        <div class="pl-3.5 border-l-2 border-slate-200 dark:border-slate-700/60 ml-2 mt-2 space-y-2.5">
                          @for (r of (c.replies || []); track r.replyId) {
                            <div class="flex items-start space-x-2">
                              <app-avatar
                                [name]="r.userName"
                                [imageUrl]="r.userAvatar"
                                size="xs"
                                shape="circle"
                                class="flex-shrink-0 mt-0.5"
                              ></app-avatar>
                              <div class="flex-1 min-w-0">
                                <div class="relative inline-block max-w-[95%] bg-slate-100 dark:bg-slate-800/90 rounded-2xl px-3 py-1.5 border border-slate-200/40 dark:border-slate-700/40">
                                  <span class="font-bold text-[11px] text-slate-900 dark:text-white">{{ r.userName }}</span>
                                  <p class="text-xs text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap leading-relaxed">{{ r.content }}</p>

                                  @if (r.reactions && r.reactions.length > 0) {
                                    <div
                                      class="absolute -bottom-2 right-2 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-full px-1.5 py-0.2 flex items-center space-x-0.5 cursor-pointer"
                                      [title]="getReactionTooltip(r.reactions)"
                                    >
                                      <span class="text-[10px] leading-none">{{ getUniqueReactionEmojis(r.reactions).join('') }}</span>
                                      <span class="text-[9px] font-bold text-slate-600 dark:text-slate-300">{{ r.reactions.length }}</span>
                                    </div>
                                  }
                                </div>

                                <div class="flex items-center space-x-3 mt-0.5 ml-2 text-[10px]">
                                  <span class="text-slate-400 font-medium">{{ formatCommentTime(r.createdAt) }}</span>

                                  <div class="relative">
                                    <button
                                      type="button"
                                      (click)="toggleReactionPicker('reply_' + r.replyId)"
                                      class="font-bold hover:underline transition"
                                      [class.text-blue-600]="getUserReaction(r.reactions)"
                                      [class.dark:text-blue-400]="getUserReaction(r.reactions)"
                                      [class.text-slate-600]="!getUserReaction(r.reactions)"
                                      [class.dark:text-slate-400]="!getUserReaction(r.reactions)"
                                    >
                                      {{ getUserReaction(r.reactions) ? (getUserReaction(r.reactions) + ' Reacted') : 'Like' }}
                                    </button>

                                    @if (activeReactionPickerId === 'reply_' + r.replyId) {
                                      <div class="absolute left-0 bottom-full mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full px-2 py-0.5 flex items-center space-x-1.5 z-30 animate-in fade-in">
                                        @for (emoji of availableEmojis; track emoji) {
                                          <button
                                            type="button"
                                            (click)="toggleReplyReaction(task, c.commentId, r.replyId, emoji)"
                                            class="text-sm hover:scale-125 transition-transform p-0.5"
                                            [title]="emoji"
                                          >
                                            {{ emoji }}
                                          </button>
                                        }
                                      </div>
                                    }
                                  </div>

                                  @if (authService.currentUser()?.userId === r.userId || authService.isCompanyOwner()) {
                                    <button
                                      type="button"
                                      (click)="deleteReply(task, c.commentId, r.replyId)"
                                      class="text-slate-400 hover:text-red-500 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  }
                                </div>
                              </div>
                            </div>
                          }

                          <!-- Inline Reply Input -->
                          @if (replyingCommentId === c.commentId) {
                            <div class="flex items-center space-x-2 pt-1">
                              <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                                {{ authService.currentUser()?.firstName ? authService.currentUser()!.firstName[0].toUpperCase() : 'U' }}
                              </div>
                              <input
                                type="text"
                                [(ngModel)]="activeReplyText"
                                (keyup.enter)="submitReply(task, c.commentId)"
                                [placeholder]="'Write a reply to ' + c.userName + '...'"
                                class="flex-1 px-3 py-1.5 text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                (click)="submitReply(task, c.commentId)"
                                [disabled]="!activeReplyText.trim()"
                                class="px-3 py-1 bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition"
                              >
                                Reply
                              </button>
                              <button
                                type="button"
                                (click)="cancelReply()"
                                class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5"
                              >
                                Cancel
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                } @empty {
                  <p class="text-xs text-slate-400 italic text-center py-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No comments yet. Start the conversation below — assignees will be notified instantly!
                  </p>
                }
              </div>

              <!-- Main Comment Composer (Facebook Style) -->
              <div class="pt-2">
                <div class="flex items-start space-x-2.5">
                  <app-avatar
                    [name]="(authService.currentUser()?.firstName || '') + ' ' + (authService.currentUser()?.lastName || '')"
                    [imageUrl]="authService.currentUser()?.avatarUrl"
                    size="sm"
                    shape="circle"
                    class="flex-shrink-0 mt-0.5"
                  ></app-avatar>
                  <div class="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition">
                    <textarea
                      [(ngModel)]="newCommentText"
                      rows="2"
                      placeholder="Write a comment... (use @name to mention, teammates will be alerted)"
                      class="w-full px-1 text-xs bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                    ></textarea>
                    <div class="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
                      <!-- Quick Emojis -->
                      <div class="flex items-center space-x-1">
                        @for (em of ['👍', '❤️', '👏', '🚀', '🔥', '💡']; track em) {
                          <button
                            type="button"
                            (click)="appendEmojiToComment(em)"
                            class="text-xs hover:scale-125 transition-transform p-0.5"
                            [title]="'Add ' + em"
                          >
                            {{ em }}
                          </button>
                        }
                      </div>

                      <app-button
                        size="sm"
                        (click)="addComment(task)"
                        [disabled]="!newCommentText.trim()"
                      >
                        Post Comment
                      </app-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              @if (authService.hasPermission('tasks.delete')) {
                <button
                  type="button"
                  (click)="deleteTaskFromModal(task.taskId)"
                  class="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold"
                >
                  🗑️ Delete Task
                </button>
              } @else {
                <span></span>
              }

              <app-button variant="secondary" (click)="closeDetailDrawer()">
                Close
              </app-button>
            </div>
          </div>
        }
      </app-drawer>

      <!-- Tasks Filter Drawer -->
      <app-drawer
        [isOpen]="isFilterDrawerOpen()"
        title="Filter Tasks"
        subtitle="Narrow down tasks by priority, assignee, and active timers"
        [showFooter]="true"
        primaryLabel="Done"
        secondaryLabel="Reset Filters"
        (closed)="closeFilterDrawer()"
        (primaryAction)="closeFilterDrawer()"
        (secondaryAction)="resetFilters()"
      >
        <div class="space-y-4">
          <div>
            <label class="form-label">Priority</label>
            <select
              [value]="filterPriority()"
              (change)="filterPriority.set($any($event.target).value)"
              class="select-control"
            >
              <option value="">All Priorities</option>
              @for (opt of priorityOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          </div>

          <div>
            <label class="form-label">Assignee</label>
            <select
              [value]="filterAssigneeId()"
              (change)="filterAssigneeId.set($any($event.target).value)"
              class="select-control"
            >
              <option value="">All Assignees</option>
              @for (emp of employees(); track emp.userId) {
                <option [value]="emp.userId">{{ emp.name }}</option>
              }
            </select>
          </div>

          <div>
            <label class="flex items-center space-x-2.5 cursor-pointer mt-2">
              <input
                type="checkbox"
                [checked]="filterRunningTimerOnly()"
                (change)="filterRunningTimerOnly.set($any($event.target).checked)"
                class="rounded border-slate-300 text-[#2A65F6] focus:ring-[#2A65F6]"
              />
              <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Active time tracking only (running timers)
              </span>
            </label>
          </div>
        </div>
      </app-drawer>

      <!-- Task Delete Confirmation Modal -->
      <app-confirmation-modal
        [isOpen]="!!pendingDeleteTaskId()"
        title="Delete Task"
        message="Are you sure you want to delete this task? All comments, subtasks, and time tracking logs will be permanently deleted."
        variant="danger"
        confirmLabel="Delete Task"
        [loading]="isDeletingTask()"
        (confirmed)="confirmDeleteTask()"
        (cancelled)="pendingDeleteTaskId.set(null)"
      ></app-confirmation-modal>
    </div>
  `,
})
export class TasksComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly tasks = signal<TaskItem[]>([]);
  readonly employees = signal<EmployeeOption[]>([]);
  readonly selectedAssignees = signal<TaskAssignee[]>([]);

  readonly isModalOpen = signal<boolean>(false);
  readonly isAiModalOpen = signal<boolean>(false);
  readonly isDetailDrawerOpen = signal<boolean>(false);
  readonly selectedTaskDetail = signal<TaskItem | null>(null);

  // View Tab & Filter Bar Signals
  readonly activeViewTab = signal<'Overview' | 'List' | 'Board' | 'Calendar' | 'Files'>('Board');
  readonly filterDateRange = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly isFilterDrawerOpen = signal<boolean>(false);
  readonly filterPriority = signal<string>('');
  readonly filterAssigneeId = signal<string>('');
  readonly filterRunningTimerOnly = signal<boolean>(false);
  createTaskDescription = '';

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.filterPriority()) count++;
    if (this.filterAssigneeId()) count++;
    if (this.filterRunningTimerOnly()) count++;
    if (this.filterDateRange() !== 'all') count++;
    return count;
  });

  // Task Delete Modal
  readonly pendingDeleteTaskId = signal<string | null>(null);
  readonly isDeletingTask = signal<boolean>(false);

  readonly isSubmitting = signal<boolean>(false);
  readonly isGeneratingAi = signal<boolean>(false);
  readonly isDispatchingReport = signal<boolean>(false);
  readonly isSavingDescription = signal<boolean>(false);
  readonly reportBannerMessage = signal<string>('');

  aiPromptText = '';
  newSubtaskTitle = '';
  newCommentText = '';
  replyingCommentId: string | null = null;
  activeReplyText = '';
  activeReactionPickerId: string | null = null;
  readonly availableEmojis = ['👍', '❤️', '👏', '🔥', '😂', '💡'];
  editedDescription = '';
  isEditingDescription = false;
  private draggedTask: TaskItem | null = null;

  readonly priorityOptions: SelectOption[] = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' },
  ];

  readonly statusOptions: SelectOption[] = [
    { label: 'Pending', value: 'TODO' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Launched', value: 'LAUNCHED' },
  ];

  readonly taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['MEDIUM'],
    status: ['TODO'],
    dueDate: [''],
  });

  isOverdue(dueDate?: string, status?: string): boolean {
    if (!dueDate || status === 'COMPLETED' || status === 'LAUNCHED') return false;
    return new Date(dueDate).getTime() < Date.now();
  }

  formatDueDate(dueDate?: string): string {
    if (!dueDate) return '';
    try {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) return dueDate;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dueDate;
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return 'Urgent Priority';
      case 'HIGH':
        return 'High Priority';
      case 'MEDIUM':
        return 'Normal Priority';
      case 'LOW':
        return 'Low Priority';
      default:
        return 'Normal Priority';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  }

  stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').trim();
  }

  openCreateModalForStatus(status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'LAUNCHED'): void {
    this.taskForm.reset({ priority: 'MEDIUM', status: status });
    this.createTaskDescription = '';
    this.selectedAssignees.set([]);
    this.isModalOpen.set(true);
  }

  onNewTaskDescriptionChange(html: string): void {
    this.createTaskDescription = html;
    this.taskForm.patchValue({ description: html });
  }

  onEditDescriptionChange(html: string): void {
    this.editedDescription = html;
  }

  hasDescriptionChanged(): boolean {
    return (this.selectedTaskDetail()?.description || '') !== this.editedDescription;
  }

  ngOnInit(): void {
    this.loadTasks();
    this.loadEmployees();
  }

  loadTasks(): void {
    this.api.get<TaskItem[]>('tasks').subscribe({
      next: (res) => this.tasks.set(res || []),
      error: () => {},
    });
  }

  loadEmployees(): void {
    this.api.get<{ data: any[] }>('employees', { limit: 100 }).subscribe({
      next: (res) => {
        const list = (res.data || [])
          .filter((e) => !!e.userId)
          .map((e) => ({
            userId: e.userId,
            name: `${e.firstName} ${e.lastName}`,
            email: e.email,
            departmentName: e.departmentName,
          }));
        this.employees.set(list);
      },
      error: () => {},
    });
  }

  openFilterDrawer(): void {
    this.isFilterDrawerOpen.set(true);
  }

  closeFilterDrawer(): void {
    this.isFilterDrawerOpen.set(false);
  }

  resetFilters(): void {
    this.filterPriority.set('');
    this.filterAssigneeId.set('');
    this.filterDateRange.set('all');
    this.filterRunningTimerOnly.set(false);
    this.searchQuery.set('');
    this.isFilterDrawerOpen.set(false);
  }

  getTasksByStatus(status: string): TaskItem[] {
    let list = this.tasks().filter((t) => {
      if (status === 'LAUNCHED') {
        return t.status === 'LAUNCHED' || t.status === 'IN_REVIEW';
      }
      return t.status === status;
    });

    const df = this.filterDateRange();
    if (df === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      list = list.filter((t) => t.dueDate && t.dueDate.startsWith(todayStr));
    } else if (df === 'week') {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      list = list.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= now && d <= nextWeek;
      });
    } else if (df === 'overdue') {
      list = list.filter((t) => this.isOverdue(t.dueDate, t.status));
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assignees && t.assignees.some((a) => a.name.toLowerCase().includes(q))),
      );
    }
    if (this.filterPriority()) {
      list = list.filter((t) => t.priority === this.filterPriority());
    }
    if (this.filterAssigneeId()) {
      list = list.filter(
        (t) =>
          (t.assignees && t.assignees.some((a) => a.userId === this.filterAssigneeId())) ||
          t.assigneeId === this.filterAssigneeId(),
      );
    }
    if (this.filterRunningTimerOnly()) {
      list = list.filter((t) => t.isTimerRunning);
    }
    return list;
  }

  // HTML5 Drag and Drop Handlers
  onDragStart(event: DragEvent, task: TaskItem): void {
    this.draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.taskId);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(): void {
    this.draggedTask = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'LAUNCHED'): void {
    event.preventDefault();
    if (this.draggedTask && this.draggedTask.status !== targetStatus) {
      this.moveStatus(this.draggedTask, targetStatus);
    }
    this.draggedTask = null;
  }

  moveStatus(task: TaskItem, newStatus: string): void {
    this.api.patch(`tasks/${task.taskId}`, { status: newStatus }).subscribe({
      next: () => this.loadTasks(),
      error: () => {},
    });
  }

  // Live Timer Tracking
  toggleTimer(task: TaskItem): void {
    const endpoint = task.isTimerRunning ? `tasks/${task.taskId}/stop-timer` : `tasks/${task.taskId}/start-timer`;
    this.api.post<TaskItem>(endpoint, {}).subscribe({
      next: () => this.loadTasks(),
      error: () => {},
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  // Multi-assignee selection
  isAssigneeSelected(userId: string): boolean {
    return this.selectedAssignees().some((a) => a.userId === userId);
  }

  toggleAssignee(emp: EmployeeOption): void {
    const current = [...this.selectedAssignees()];
    const idx = current.findIndex((a) => a.userId === emp.userId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push({ userId: emp.userId, name: emp.name });
    }
    this.selectedAssignees.set(current);
  }

  // AI Task Creator
  openAiModal(): void {
    this.isAiModalOpen.set(true);
    this.aiPromptText = '';
  }

  closeAiModal(): void {
    this.isAiModalOpen.set(false);
  }

  generateTaskFromAi(): void {
    if (!this.aiPromptText.trim()) return;

    this.isGeneratingAi.set(true);
    this.api
      .post<{
        title: string;
        description?: string;
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        dueDate?: string;
        assigneeHint?: string;
      }>('ai/parse-task', { prompt: this.aiPromptText.trim() })
      .subscribe({
        next: (parsed) => {
          this.isGeneratingAi.set(false);
          this.closeAiModal();

          // Pre-populate taskForm
          this.taskForm.patchValue({
            title: parsed.title || '',
            description: parsed.description || '',
            priority: parsed.priority || 'MEDIUM',
            status: 'TODO',
            dueDate: parsed.dueDate ? parsed.dueDate.slice(0, 10) : '',
          });

          // Match assigneeHint to loaded employees if available
          if (parsed.assigneeHint && this.employees().length > 0) {
            const hint = parsed.assigneeHint.toLowerCase();
            const matched = this.employees().find(
              (e) => e.name.toLowerCase().includes(hint) || e.email.toLowerCase().includes(hint),
            );
            if (matched) {
              this.selectedAssignees.set([{ userId: matched.userId, name: matched.name }]);
            }
          }

          this.openCreateModal();
        },
        error: () => {
          this.isGeneratingAi.set(false);
        },
      });
  }

  // Send AI Task Report to Chat
  dispatchAiReport(): void {
    this.isDispatchingReport.set(true);
    this.api
      .post<{ success: boolean; preview: string }>('ai/dispatch-task-report', {
        channelId: 'general',
      })
      .subscribe({
        next: (res) => {
          this.isDispatchingReport.set(false);
          this.reportBannerMessage.set('AI task report successfully dispatched to #general chat!');
        },
        error: () => {
          this.isDispatchingReport.set(false);
        },
      });
  }

  openCreateModal(): void {
    this.isModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isModalOpen.set(false);
    this.selectedAssignees.set([]);
    this.taskForm.reset({ priority: 'MEDIUM', status: 'TODO' });
  }

  submitTask(): void {
    if (this.taskForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.taskForm.value;
    const payload = {
      ...formVal,
      assignees: this.selectedAssignees(),
    };

    this.api.post<TaskItem>('tasks', payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.loadTasks();
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  getPriorityVariant(priority: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  // Jira Task Detail Modal & Subtask/Comment Management
  openTaskDetail(task: TaskItem): void {
    this.selectedTaskDetail.set(task);
    this.editedDescription = task.description || '';
    this.isDetailDrawerOpen.set(true);
    this.isEditingDescription = false;
    this.newSubtaskTitle = '';
    this.newCommentText = '';
  }

  closeDetailDrawer(): void {
    this.isDetailDrawerOpen.set(false);
    this.selectedTaskDetail.set(null);
    this.isEditingDescription = false;
  }

  closeDetailModal(): void {
    this.closeDetailDrawer();
  }

  getSubtaskStats(task: TaskItem): { total: number; completed: number } {
    const list = task.subtasks || [];
    return {
      total: list.length,
      completed: list.filter((s) => s.isCompleted).length,
    };
  }

  getSubtaskPercent(task: TaskItem): number {
    const stats = this.getSubtaskStats(task);
    if (!stats.total) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  }

  updateDetailStatus(newStatus: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'): void {
    const task = this.selectedTaskDetail();
    if (!task) return;
    this.api.patch<TaskItem>(`tasks/${task.taskId}`, { status: newStatus }).subscribe({
      next: (updated) => {
        this.selectedTaskDetail.set(updated);
        this.loadTasks();
      },
      error: () => {},
    });
  }

  updateDetailPriority(newPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'): void {
    const task = this.selectedTaskDetail();
    if (!task) return;
    this.api.patch<TaskItem>(`tasks/${task.taskId}`, { priority: newPriority }).subscribe({
      next: (updated) => {
        this.selectedTaskDetail.set(updated);
        this.loadTasks();
      },
      error: () => {},
    });
  }

  startEditingDescription(desc: string): void {
    this.editedDescription = desc || '';
    this.isEditingDescription = true;
  }

  insertFormatting(prefix: string, suffix: string): void {
    this.editedDescription = (this.editedDescription || '') + `${prefix}${suffix}`;
  }

  saveDescription(): void {
    const task = this.selectedTaskDetail();
    if (!task) return;
    this.isSavingDescription.set(true);
    this.api.patch<TaskItem>(`tasks/${task.taskId}`, { description: this.editedDescription }).subscribe({
      next: (updated) => {
        this.isSavingDescription.set(false);
        this.isEditingDescription = false;
        this.selectedTaskDetail.set(updated);
        this.loadTasks();
      },
      error: () => {
        this.isSavingDescription.set(false);
      },
    });
  }

  addSubtask(task: TaskItem): void {
    if (!this.newSubtaskTitle.trim()) return;
    const title = this.newSubtaskTitle.trim();
    this.api.post<TaskItem>(`tasks/${task.taskId}/subtasks`, { title }).subscribe({
      next: (updated) => {
        this.newSubtaskTitle = '';
        this.selectedTaskDetail.set(updated);
        this.loadTasks();
      },
      error: () => {},
    });
  }

  toggleSubtask(task: TaskItem, subtask: TaskSubtaskItem): void {
    const isCompleted = !subtask.isCompleted;
    this.api
      .patch<TaskItem>(`tasks/${task.taskId}/subtasks/${subtask.subtaskId}`, { isCompleted })
      .subscribe({
        next: (updated) => {
          this.selectedTaskDetail.set(updated);
          this.loadTasks();
        },
        error: () => {},
      });
  }

  deleteSubtask(task: TaskItem, subtaskId: string): void {
    this.api.delete<TaskItem>(`tasks/${task.taskId}/subtasks/${subtaskId}`).subscribe({
      next: (updated) => {
        this.selectedTaskDetail.set(updated);
        this.loadTasks();
      },
      error: () => {},
    });
  }

  getCommentCount(task: TaskItem): number {
    let count = (task.comments || []).length;
    for (const c of task.comments || []) {
      if (c.replies) count += c.replies.length;
    }
    return count;
  }

  toggleReplyInput(commentId: string): void {
    if (this.replyingCommentId === commentId) {
      this.replyingCommentId = null;
      this.activeReplyText = '';
    } else {
      this.replyingCommentId = commentId;
      this.activeReplyText = '';
    }
  }

  cancelReply(): void {
    this.replyingCommentId = null;
    this.activeReplyText = '';
  }

  submitReply(task: TaskItem, commentId: string): void {
    if (!this.activeReplyText.trim()) return;
    const content = this.activeReplyText.trim();
    this.api
      .post<TaskItem>(`tasks/${task.taskId}/comments/${commentId}/reply`, { content })
      .subscribe({
        next: (updated) => {
          this.selectedTaskDetail.set(updated);
          this.activeReplyText = '';
          this.replyingCommentId = null;
          this.loadTasks();
        },
        error: () => {},
      });
  }

  deleteReply(task: TaskItem, commentId: string, replyId: string): void {
    this.api
      .delete<TaskItem>(`tasks/${task.taskId}/comments/${commentId}/reply/${replyId}`)
      .subscribe({
        next: (updated) => {
          this.selectedTaskDetail.set(updated);
          this.loadTasks();
        },
        error: () => {},
      });
  }

  toggleCommentReaction(task: TaskItem, commentId: string, emoji: string): void {
    this.activeReactionPickerId = null;
    this.api
      .post<TaskItem>(`tasks/${task.taskId}/comments/${commentId}/react`, { emoji })
      .subscribe({
        next: (updated) => {
          this.selectedTaskDetail.set(updated);
          this.loadTasks();
        },
        error: () => {},
      });
  }

  toggleReplyReaction(task: TaskItem, commentId: string, replyId: string, emoji: string): void {
    this.activeReactionPickerId = null;
    this.api
      .post<TaskItem>(`tasks/${task.taskId}/comments/${commentId}/reply/${replyId}/react`, { emoji })
      .subscribe({
        next: (updated) => {
          this.selectedTaskDetail.set(updated);
          this.loadTasks();
        },
        error: () => {},
      });
  }

  toggleReactionPicker(id: string): void {
    this.activeReactionPickerId = this.activeReactionPickerId === id ? null : id;
  }

  getUserReaction(reactions?: CommentReactionItem[]): string | null {
    if (!reactions) return null;
    const myId = this.authService.currentUser()?.userId;
    const found = reactions.find((r) => r.userId === myId);
    return found ? found.emoji : null;
  }

  getUniqueReactionEmojis(reactions?: CommentReactionItem[]): string[] {
    if (!reactions || reactions.length === 0) return [];
    return Array.from(new Set(reactions.map((r) => r.emoji))).slice(0, 3);
  }

  getReactionTooltip(reactions?: CommentReactionItem[]): string {
    if (!reactions || reactions.length === 0) return '';
    return reactions.map((r) => `${r.userName} (${r.emoji})`).join(', ');
  }

  appendEmojiToComment(emoji: string): void {
    this.newCommentText = (this.newCommentText ? this.newCommentText + ' ' : '') + emoji;
  }

  formatCommentTime(dateStr?: string | Date): string {
    if (!dateStr) return '';
    const now = new Date().getTime();
    const date = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  addComment(task: TaskItem): void {
    if (!this.newCommentText.trim()) return;
    const content = this.newCommentText.trim();
    this.api.post<TaskItem>(`tasks/${task.taskId}/comments`, { content }).subscribe({
      next: (updated) => {
        this.newCommentText = '';
        this.selectedTaskDetail.set(updated);
        this.loadTasks();
      },
      error: () => {},
    });
  }

  deleteComment(task: TaskItem, commentId: string): void {
    this.api.delete<TaskItem>(`tasks/${task.taskId}/comments/${commentId}`).subscribe({
      next: (updated) => {
        this.selectedTaskDetail.set(updated);
        this.loadTasks();
      },
      error: () => {},
    });
  }

  deleteTaskFromModal(taskId: string): void {
    this.pendingDeleteTaskId.set(taskId);
  }

  confirmDeleteTask(): void {
    const taskId = this.pendingDeleteTaskId();
    if (!taskId) return;

    this.isDeletingTask.set(true);
    this.api.delete(`tasks/${taskId}`).subscribe({
      next: () => {
        this.isDeletingTask.set(false);
        this.pendingDeleteTaskId.set(null);
        this.closeDetailModal();
        this.loadTasks();
      },
      error: () => {
        this.isDeletingTask.set(false);
      },
    });
  }

  getTaskDescriptionHtml(desc?: string): string {
    return desc || '<span class="text-slate-400 italic">No description provided</span>';
  }
}
