import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./tabs.component.html",
  styleUrl: "./tabs.component.scss",
})
export class AppTabsComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() tabs: TabItem[] = [];
  @Input() activeTab: string = '';
  @Output() activeTabChange = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<TabItem>();

  selectTab(id: string): void {
    if (this.activeTab !== id) {
      this.activeTab = id;
      this.activeTabChange.emit(id);
      const found = this.tabs.find((t) => t.id === id);
      if (found) {
        this.tabChange.emit(found);
      }
      this.cdr.markForCheck();
    }
  }
}
