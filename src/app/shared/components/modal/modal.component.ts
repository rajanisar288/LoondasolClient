import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { AppButtonComponent } from '../button/button.component';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./modal.component.html",
  styleUrl: "./modal.component.scss",
})
export class AppModalComponent implements OnChanges, OnDestroy {
  private readonly document = inject(DOCUMENT);

  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() size: ModalSize = 'lg';
  @Input() maxWidthClass = '';
  @Input() splitLayout = false;
  @Input() closeOnEscape = true;
  @Input() closeOnBackdrop = true;
  @Input() showFooter = false;
  @Input() showResetButton = false;
  @Input() resetLabel = 'Reset';
  @Input() primaryLabel = 'Save';
  @Input() secondaryLabel = 'Cancel';
  @Input() primaryLoading = false;
  @Input() primaryDisabled = false;

  @Output() closed = new EventEmitter<void>();
  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
  @Output() resetAction = new EventEmitter<void>();

  /** Synchronizes document body scroll lock when modal state changes. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.document.body.style.overflow = this.isOpen ? 'hidden' : '';
    }
  }

  /** Restores document body scroll when modal component is destroyed. */
  ngOnDestroy(): void {
    this.document.body.style.overflow = '';
  }

  /** Prevents panel itself from scrolling */
  onPanelScroll(event: Event): void {
    const el = event.target as HTMLElement | null;
    if (el && el.scrollTop !== 0) {
      el.scrollTop = 0;
    }
  }

  /** Resolves the Tailwind max-width class from explicit override or size preset. */
  resolvedWidthClass(): string {
    if (this.maxWidthClass) {
      return this.maxWidthClass;
    }
    const map: Record<ModalSize, string> = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-3xl',
      '2xl': 'max-w-4xl',
      '3xl': 'max-w-5xl',
      '4xl': 'max-w-6xl',
    };
    return map[this.size] || 'max-w-2xl';
  }

  /** Handles Escape key press to close the modal when enabled. */
  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isOpen && this.closeOnEscape && !this.primaryLoading) {
      event.preventDefault();
      this.close();
    }
  }

  /** Closes the modal when the backdrop is clicked. */
  onBackdropClick(): void {
    if (this.closeOnBackdrop && !this.primaryLoading) {
      this.close();
    }
  }

  /** Emits secondary action and closes the modal. */
  onSecondary(): void {
    this.secondaryAction.emit();
    this.close();
  }

  /** Emits closed event to parent component. */
  close(): void {
    this.closed.emit();
  }
}
