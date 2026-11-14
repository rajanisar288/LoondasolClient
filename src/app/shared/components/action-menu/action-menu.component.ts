import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: string;
  isDanger?: boolean;
  disabled?: boolean;
  dividerAbove?: boolean;
}

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./action-menu.component.html",
  styleUrl: "./action-menu.component.scss",
})
export class AppActionMenuComponent {
  private readonly elementRef = inject(ElementRef);

  @Input() items: ActionMenuItem[] = [];
  @Input() disabled = false;

  @Output() actionSelected = new EventEmitter<string>();

  readonly isOpen = signal(false);

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  onSelect(item: ActionMenuItem): void {
    if (item.disabled) return;
    this.isOpen.set(false);
    this.actionSelected.emit(item.id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }
}
