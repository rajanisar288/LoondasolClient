import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./accordion.component.html",
  styleUrl: "./accordion.component.scss",
})
export class AppAccordionComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() badge?: string;
  @Input() isOpen = false;

  @Output() isOpenChange = new EventEmitter<boolean>();

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }
}
