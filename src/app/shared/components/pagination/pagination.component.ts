import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-[#27292d] border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 select-none"
    >
      <!-- Results summary -->
      <div>
        Showing
        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ startItem }}</span>
        to
        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ endItem }}</span>
        of
        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ totalItems }}</span>
        entries
      </div>

      <!-- Pagination Buttons -->
      <div class="flex items-center space-x-1">
        <!-- Previous Page -->
        <button
          type="button"
          (click)="onPageChange(currentPage - 1)"
          [disabled]="currentPage <= 1"
          class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L8.414 10l4.293 4.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Pages -->
        @for (p of getVisiblePages(); track $index) {
          @if (p === -1) {
            <span class="w-8 h-8 flex items-center justify-center text-slate-400">...</span>
          } @else {
            <button
              type="button"
              (click)="onPageChange(p)"
              class="w-8 h-8 rounded-lg font-medium text-xs transition-colors"
              [ngClass]="
                p === currentPage
                  ? 'bg-[#2A65F6] text-white shadow-sm font-semibold'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              "
            >
              {{ p }}
            </button>
          }
        }

        <!-- Next Page -->
        <button
          type="button"
          (click)="onPageChange(currentPage + 1)"
          [disabled]="currentPage >= totalPages"
          class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L11.586 10 7.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class AppPaginationComponent {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 1;
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, -1, total];
    }

    if (current >= total - 2) {
      return [1, -1, total - 3, total - 2, total - 1, total];
    }

    return [1, -1, current - 1, current, current + 1, -1, total];
  }
}
