import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

export interface TimeInterval {
  intervalId: string;
  start: string;
  end?: string;
  durationMinutes: number;
}

export interface PersonalTodo {
  todoId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
  isRunning: boolean;
  currentIntervalStartedAt?: string;
  intervals: TimeInterval[];
  totalDurationMinutes: number;
  createdAt: string;
}

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./todos.component.html",
  styleUrl: "./todos.component.scss",
})
export class TodosComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly todos = signal<PersonalTodo[]>([]);
  readonly isLoading = signal(true);
  readonly showCreateModal = signal(false);
  readonly isSubmitting = signal(false);

  newTitle = '';
  newDesc = '';

  ngOnInit(): void {
    this.fetchTodos();
  }

  fetchTodos(): void {
    this.isLoading.set(true);
    this.api.get<PersonalTodo[]>('personal-todos').subscribe({
      next: (res) => {
        this.todos.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  completedCount(): number {
    return this.todos().filter((t) => t.status === 'COMPLETED').length;
  }

  totalLoggedMinutes(): number {
    return this.todos().reduce((acc, curr) => acc + (curr.totalDurationMinutes || 0), 0);
  }

  openCreateModal(): void {
    this.newTitle = '';
    this.newDesc = '';
    this.showCreateModal.set(true);
  }

  createTodo(): void {
    if (!this.newTitle.trim()) return;
    this.isSubmitting.set(true);
    this.api
      .post<PersonalTodo>('personal-todos', {
        title: this.newTitle.trim(),
        description: this.newDesc.trim() || undefined,
      })
      .subscribe({
        next: (created) => {
          this.todos.update((list) => [created, ...list]);
          this.showCreateModal.set(false);
          this.isSubmitting.set(false);
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  startTimer(todoId: string): void {
    this.api.post<PersonalTodo>(`personal-todos/${todoId}/start`, {}).subscribe({
      next: (updated) => {
        this.todos.update((list) =>
          list.map((t) => (t.todoId === todoId ? updated : { ...t, isRunning: false })),
        );
      },
    });
  }

  pauseTimer(todoId: string): void {
    this.api.post<PersonalTodo>(`personal-todos/${todoId}/pause`, {}).subscribe({
      next: (updated) => {
        this.todos.update((list) => list.map((t) => (t.todoId === todoId ? updated : t)));
      },
    });
  }

  completeTodo(todoId: string): void {
    this.api.post<PersonalTodo>(`personal-todos/${todoId}/complete`, {}).subscribe({
      next: (updated) => {
        this.todos.update((list) => list.map((t) => (t.todoId === todoId ? updated : t)));
      },
    });
  }

  deleteTodo(todoId: string): void {
    if (!confirm('Are you sure you want to delete this personal task?')) return;
    this.api.delete(`personal-todos/${todoId}`).subscribe({
      next: () => {
        this.todos.update((list) => list.filter((t) => t.todoId !== todoId));
      },
    });
  }

  formatHoursMinutes(totalMins: number): string {
    const mins = totalMins || 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  }

  formatTime(isoStr: string): string {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
