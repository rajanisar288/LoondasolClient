import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../button/button.component';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./confirmation-modal.component.html",
  styleUrl: "./confirmation-modal.component.scss",
})
export class AppConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed? This action may not be reversible.';
  @Input() highlightText?: string;
  @Input() variant: ConfirmVariant = 'danger';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isOpen && !this.loading) {
      event.preventDefault();
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getIconBgClasses(): string {
    switch (this.variant) {
      case 'danger':
        return 'bg-rose-100/80 dark:bg-rose-950/50';
      case 'warning':
        return 'bg-amber-100/80 dark:bg-amber-950/50';
      case 'info':
      default:
        return 'bg-blue-100/80 dark:bg-blue-950/50';
    }
  }
}
