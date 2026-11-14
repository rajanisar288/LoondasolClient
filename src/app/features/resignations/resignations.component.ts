import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

export interface ExitClearance {
  itAssetsReturned: boolean;
  accessRevoked: boolean;
  idBadgeReturned: boolean;
  financeDuesCleared: boolean;
  knowledgeTransferDone: boolean;
}

export interface Resignation {
  resignationId: string;
  employeeName: string;
  employeeEmail: string;
  departmentName?: string;
  submissionDate: string;
  intendedLastWorkingDay: string;
  reason: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  clearanceChecklist: ExitClearance;
  exitInterviewNotes?: string;
}

@Component({
  selector: 'app-resignations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./resignations.component.html",
  styleUrl: "./resignations.component.scss",
})
export class ResignationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly authService = inject(AuthService);

  readonly resignations = signal<Resignation[]>([]);
  readonly isLoading = signal(true);
  readonly showSubmitModal = signal(false);
  readonly isSubmitting = signal(false);

  newLastDate = '';
  newReason = '';

  ngOnInit(): void {
    this.fetchResignations();
  }

  fetchResignations(): void {
    this.isLoading.set(true);
    this.api.get<Resignation[]>('resignations').subscribe({
      next: (res) => {
        this.resignations.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  canManageClearance(): boolean {
    return (
      this.authService.currentUser()?.isOwner ||
      this.authService.hasAnyPermission(['resignations.approve'])
    );
  }

  openSubmitModal(): void {
    this.newLastDate = '';
    this.newReason = '';
    this.showSubmitModal.set(true);
  }

  submitResignation(): void {
    if (!this.newLastDate || !this.newReason.trim()) return;
    this.isSubmitting.set(true);
    this.api
      .post<Resignation>('resignations', {
        intendedLastWorkingDay: this.newLastDate,
        reason: this.newReason.trim(),
      })
      .subscribe({
        next: (created) => {
          this.resignations.update((list) => [created, ...list]);
          this.showSubmitModal.set(false);
          this.isSubmitting.set(false);
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  toggleChecklist(resignationId: string, field: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.api
      .patch<Resignation>(`resignations/${resignationId}/clearance`, {
        [field]: checked,
      })
      .subscribe({
        next: (updated) => {
          this.resignations.update((list) =>
            list.map((r) => (r.resignationId === resignationId ? updated : r)),
          );
        },
      });
  }

  updateStatus(resignationId: string, status: string): void {
    this.api
      .patch<Resignation>(`resignations/${resignationId}/status`, { status })
      .subscribe({
        next: (updated) => {
          this.resignations.update((list) =>
            list.map((r) => (r.resignationId === resignationId ? updated : r)),
          );
        },
      });
  }
}
