import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selection-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./selection-card.component.html",
  styleUrl: "./selection-card.component.scss",
})
export class AppSelectionCardComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() badge?: string;
  @Input() selected = false;
  @Input() disabled = false;
  @Input() indicatorType: 'radio' | 'chevron' | 'check' = 'radio';

  @Output() selectionChange = new EventEmitter<void>();

  onSelect(): void {
    if (!this.disabled) {
      this.selectionChange.emit();
    }
  }
}
