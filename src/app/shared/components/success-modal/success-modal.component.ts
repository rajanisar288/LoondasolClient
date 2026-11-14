import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./success-modal.component.html",
  styleUrl: "./success-modal.component.scss",
})
export class AppSuccessModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Success!';
  @Input() message?: string;
  @Input() copyableText?: string;
  @Input() buttonLabel = 'Continue';

  @Output() closed = new EventEmitter<void>();

  readonly copied = signal(false);

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent): void {
    if (this.isOpen) {
      event.preventDefault();
      this.onClose();
    }
  }

  onClose(): void {
    this.closed.emit();
  }

  copyToClipboard(): void {
    if (this.copyableText) {
      navigator.clipboard.writeText(this.copyableText);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    }
  }
}
