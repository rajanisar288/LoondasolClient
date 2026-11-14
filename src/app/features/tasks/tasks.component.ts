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
import { AppCheckboxComponent } from '../../shared/components/checkbox/checkbox.component';

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
    AppCheckboxComponent,
  ],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.scss",
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
    { label: 'In Review', value: 'IN_REVIEW' },
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

  getAssigneeNamesList(assignees?: TaskAssignee[]): string {
    if (!assignees || assignees.length === 0) return '';
    return assignees.map((a) => a.name).join(', ');
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

  updateDetailStatus(newStatus: any): void {
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

  updateDetailPriority(newPriority: any): void {
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
