import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  SharedTableAction,
  SharedTableActionEvent,
  SharedTableCellContext,
  SharedTableColumn,
  SharedTablePageEvent,
  SharedTableSortDirection,
  SharedTableSortEvent,
} from './table.types';

export * from './table.types';

@Component({
  selector: 'theme-table, app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedTableComponent<T extends object = any> implements OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private actionPopover: HTMLElement | null = null;
  private readonly onScroll = (event: Event) => {
    if (!this.actionPopover?.contains(event.target as Node)) {
      this.closeActionMenu();
      this.cdr.markForCheck();
    }
  };

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onScroll, true);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']?.currentValue) {
      this.closeActionMenu();
    }
    this.cdr.markForCheck();
  }

  // ==================================================
  // DATA
  // ==================================================

  @Input() rows: readonly T[] = [];

  @Input() columns: readonly SharedTableColumn<T>[] = [];

  @Input() actions: readonly SharedTableAction<T>[] = [];

  /**
   * Used to uniquely identify rows (e.g. "id", "userId", "employeeId").
   */
  @Input() rowKey: keyof T | string = 'id';

  /**
   * Optional custom function used to identify a row.
   */
  @Input() rowKeyGetter?: (row: T, index: number) => string | number;

  // ==================================================
  // TABLE DISPLAY
  // ==================================================

  @Input() loading = false;

  @Input() showHeader = true;

  @Input() showFooter = true;

  @Input() showActions = true;

  @Input() striped = false;

  @Input() hoverable = true;

  @Input() compact = false;

  // ==================================================
  // SEARCH
  // ==================================================

  @Input() searchable = true;

  @Input() searchPlaceholder = 'Search by name or ID...';

  /**
   * When true, rows are filtered inside this component.
   * Set this to false when search is handled by an API.
   */
  @Input() clientSideSearch = true;

  @Input() searchDebounce = 300;

  @Output() searchChange = new EventEmitter<string>();

  // ==================================================
  // FILTER
  // ==================================================

  @Input() showFilterButton = true;

  @Input() filterButtonLabel = 'Filters';

  @Input() activeFilterCount = 0;

  @Output() filterClick = new EventEmitter<void>();

  // ==================================================
  // PAGINATION
  // ==================================================

  /**
   * When true, pagination is handled inside this component.
   * Set this to false when rows are already paginated by an API.
   */
  @Input() clientSidePagination = true;

  @Input() pageSize = 10;

  @Input() pageSizeOptions: readonly number[] = [10, 13, 25, 50];

  @Input() showPageSizeSelector = false;

  /**
   * Total records from the API.
   * Required when clientSidePagination is false.
   */
  @Input() totalRecords = 0;

  /** False when a server returns pages without an overall count. */
  @Input() totalRecordsKnown = true;
  @Input() hasNextPage = false;

  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<SharedTablePageEvent>();

  // ==================================================
  // MESSAGES
  // ==================================================

  @Input() loadingMessage = 'Loading records...';

  @Input() emptyTitle = 'No records found';

  @Input() emptyMessage = 'There are currently no records available to display.';

  @Input() emptySearchMessage = 'No records match your current search.';

  // ==================================================
  // CUSTOM TEMPLATES
  // ==================================================

  @Input() toolbarStartTemplate?: TemplateRef<unknown>;

  @Input() toolbarEndTemplate?: TemplateRef<unknown>;

  @Input() emptyTemplate?: TemplateRef<unknown>;

  @Input() loadingTemplate?: TemplateRef<unknown>;

  // ==================================================
  // EVENTS
  // ==================================================

  @Output() actionClick = new EventEmitter<SharedTableActionEvent<T>>();

  @Output() rowClick = new EventEmitter<T>();

  @Output() sortChange = new EventEmitter<SharedTableSortEvent<T>>();

  // ==================================================
  // INTERNAL STATE
  // ==================================================

  @Input() searchValue = '';

  @Input() currentPage = 1;

  currentSortColumn: SharedTableColumn<T> | null = null;

  currentSortDirection: SharedTableSortDirection = null;

  openedActionRowKey: string | number | null = null;

  private searchTimeout?: ReturnType<typeof setTimeout>;

  // ==================================================
  // GETTERS
  // ==================================================

  get filteredRows(): readonly T[] {
    if (!this.clientSideSearch || !this.searchValue.trim()) {
      return this.rows;
    }

    const normalizedSearch = this.normalizeValue(this.searchValue);

    return this.rows.filter(row =>
      this.searchableColumns.some(column => {
        const value = this.getColumnValue(row, column);
        return this.normalizeValue(value).includes(normalizedSearch);
      })
    );
  }

  get sortedRows(): readonly T[] {
    if (!this.currentSortColumn || !this.currentSortDirection) {
      return this.filteredRows;
    }

    const column = this.currentSortColumn;
    const direction = this.currentSortDirection;

    return [...this.filteredRows].sort((firstRow, secondRow) => {
      const firstValue = this.getColumnValue(firstRow, column);
      const secondValue = this.getColumnValue(secondRow, column);

      const comparison = this.compareValues(firstValue, secondValue);

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  get displayedRows(): readonly T[] {
    if (!this.clientSidePagination) {
      return this.sortedRows;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    return this.sortedRows.slice(startIndex, endIndex);
  }

  get searchableColumns(): readonly SharedTableColumn<T>[] {
    return this.columns.filter(column => column.searchable !== false);
  }

  get resolvedTotalRecords(): number {
    if (this.clientSidePagination) {
      return this.sortedRows.length;
    }

    return this.totalRecords;
  }

  get totalPages(): number {
    if (!this.clientSidePagination && !this.totalRecordsKnown) {
      return this.currentPage + (this.hasNextPage ? 1 : 0);
    }
    return Math.max(1, Math.ceil(this.resolvedTotalRecords / this.pageSize));
  }

  get startRecord(): number {
    if (!this.clientSidePagination && !this.totalRecordsKnown) {
      return this.rows.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
    }
    if (this.resolvedTotalRecords === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    if (!this.clientSidePagination && !this.totalRecordsKnown) {
      return this.rows.length ? (this.currentPage - 1) * this.pageSize + this.rows.length : 0;
    }
    return Math.min(this.currentPage * this.pageSize, this.resolvedTotalRecords);
  }

  get visiblePages(): number[] {
    const totalPages = this.totalPages;
    const maximumPages = Math.max(1, this.maxVisiblePages);

    if (totalPages <= maximumPages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const half = Math.floor(maximumPages / 2);

    let startPage = Math.max(1, this.currentPage - half);
    let endPage = startPage + maximumPages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maximumPages + 1;
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }

  get hasActions(): boolean {
    return this.showActions && this.actions.length > 0;
  }

  get isEmpty(): boolean {
    return !this.loading && this.displayedRows.length === 0;
  }

  // ==================================================
  // SEARCH
  // ==================================================

  onSearchInput(value: string): void {
    this.searchValue = value;
    this.currentPage = 1;

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchChange.emit(this.searchValue.trim());
    }, this.searchDebounce);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.currentPage = 1;
    this.searchChange.emit('');
  }

  // ==================================================
  // PAGINATION
  // ==================================================

  goToPage(page: number): void {
    const validPage = Math.min(Math.max(page, 1), this.totalPages);

    if (validPage === this.currentPage) {
      return;
    }

    this.currentPage = validPage;
    this.closeActionMenu();

    this.pageChange.emit({
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  onPageSizeChange(pageSize: number | string): void {
    const parsedPageSize = Number(pageSize);

    if (!Number.isFinite(parsedPageSize) || parsedPageSize <= 0) {
      return;
    }

    this.pageSize = parsedPageSize;
    this.currentPage = 1;

    this.pageChange.emit({
      page: this.currentPage,
      pageSize: this.pageSize,
    });
  }

  // ==================================================
  // SORTING
  // ==================================================

  onSort(column: SharedTableColumn<T>): void {
    if (!column.sortable) {
      return;
    }

    if (this.currentSortColumn !== column) {
      this.currentSortColumn = column;
      this.currentSortDirection = 'asc';
    } else {
      this.currentSortDirection = this.getNextSortDirection(this.currentSortDirection);

      if (!this.currentSortDirection) {
        this.currentSortColumn = null;
      }
    }

    this.currentPage = 1;

    this.sortChange.emit({
      column,
      direction: this.currentSortDirection,
    });
  }

  getSortDirection(column: SharedTableColumn<T>): SharedTableSortDirection {
    if (this.currentSortColumn !== column) {
      return null;
    }

    return this.currentSortDirection;
  }

  // ==================================================
  // ACTIONS
  // ==================================================

  toggleActionMenu(row: T, rowIndex: number, event: MouseEvent): void {
    event.stopPropagation();

    const rowKey = this.getRowKey(row, rowIndex);

    const wasOpen = this.openedActionRowKey === rowKey;
    this.closeActionMenu();
    if (wasOpen) return;
    this.openedActionRowKey = rowKey;
    this.cdr.detectChanges();
    const trigger = event.currentTarget as HTMLElement;
    const menu = trigger.parentElement?.querySelector<HTMLElement>('[popover]');
    if (!menu) return;
    this.actionPopover = menu;

    if (typeof (menu as any).showPopover === 'function') {
      try {
        (menu as any).showPopover();
      } catch {
        // Fallback for browsers without popover attribute support
      }
    }

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(200, window.innerWidth - 16);
    menu.style.width = `${width}px`;
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const upwards = below < menu.scrollHeight && above > below;
    menu.style.maxHeight = `${Math.max(0, upwards ? above : below)}px`;
    const height = menu.getBoundingClientRect().height || 80;
    menu.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`;
    menu.style.top = `${Math.max(8, upwards ? rect.top - height - 4 : rect.bottom + 4)}px`;
    document.addEventListener('scroll', this.onScroll, true);
  }

  isActionMenuOpen(row: T, rowIndex: number): boolean {
    return this.openedActionRowKey === this.getRowKey(row, rowIndex);
  }

  getVisibleActions(row: T): readonly SharedTableAction<T>[] {
    return this.actions.filter(action => !action.visible || action.visible(row));
  }

  getActionLabel(action: SharedTableAction<T>, row: T): string {
    if (typeof action.label === 'function') {
      return action.label(row);
    }
    return action.label;
  }

  isActionDisabled(action: SharedTableAction<T>, row: T): boolean {
    return action.disabled?.(row) ?? false;
  }

  onActionClick(action: SharedTableAction<T>, row: T, event: MouseEvent): void {
    event.stopPropagation();

    if (this.isActionDisabled(action, row) || (action.visible && !action.visible(row))) {
      return;
    }

    this.actionClick.emit({
      action,
      row,
    });

    this.closeActionMenu();
  }

  closeActionMenu(): void {
    if (typeof (this.actionPopover as any)?.hidePopover === 'function') {
      try {
        (this.actionPopover as any).hidePopover();
      } catch {
        // Ignored
      }
    }
    this.actionPopover = null;
    document.removeEventListener('scroll', this.onScroll, true);
    this.openedActionRowKey = null;
  }

  @HostListener('window:resize')
  @HostListener('document:keydown.escape')
  onDismissActionMenu(): void {
    this.closeActionMenu();
  }

  // ==================================================
  // ROW
  // ==================================================

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  trackByRow = (index: number, row: T): string | number => {
    return this.getRowKey(row, index);
  };

  trackByColumn = (index: number, column: SharedTableColumn<T>): string => {
    return String(column.key || index);
  };

  trackByAction = (index: number, action: SharedTableAction<T>): string => {
    return action.id || String(index);
  };

  trackByPage = (_index: number, page: number): number => {
    return page;
  };

  // ==================================================
  // CELL VALUES
  // ==================================================

  getColumnValue(row: T, column: SharedTableColumn<T>): unknown {
    if (column.valueGetter) {
      return column.valueGetter(row);
    }

    return this.getNestedValue(row, String(column.key));
  }

  getDisplayValue(row: T, column: SharedTableColumn<T>): string {
    const value = this.getColumnValue(row, column);

    if (column.formatter) {
      return column.formatter(value, row);
    }

    if (value === null || value === undefined || value === '') {
      return column.emptyValue ?? '—';
    }

    return String(value);
  }

  getTemplateContext(row: T, column: SharedTableColumn<T>): SharedTableCellContext<T> {
    const value = this.getColumnValue(row, column);
    if (!row || typeof row !== 'object') {
      return {
        $implicit: row,
        row,
        value,
        column,
      };
    }

    const implicit: any = {
      ...(row as any),
      row,
      value,
      column,
    };

    return {
      $implicit: implicit,
      row,
      value,
      column,
    } as any;
  }

  getColumnClasses(column: SharedTableColumn<T>): Record<string, boolean> {
    return {
      'shared-table__cell--center': column.align === 'center',
      'shared-table__cell--right': column.align === 'right',
      'shared-table__cell--mobile-hidden': Boolean(column.hideOnMobile),
    };
  }

  getColumnStyle(column: SharedTableColumn<T>): Record<string, string> {
    if (!column.width) {
      return {};
    }

    return {
      width: column.width,
      minWidth: column.width,
    };
  }

  // ==================================================
  // GLOBAL EVENTS
  // ==================================================

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeActionMenu();
  }

  // ==================================================
  // PRIVATE HELPERS
  // ==================================================

  private getRowKey(row: T, index: number): string | number {
    if (this.rowKeyGetter) {
      return this.rowKeyGetter(row, index);
    }

    const value = this.getNestedValue(row, String(this.rowKey));

    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    return index;
  }

  private getNestedValue(object: unknown, path: string): unknown {
    if (!object || !path) {
      return undefined;
    }

    return path.split('.').reduce<unknown>((value, key) => {
      if (value !== null && value !== undefined && typeof value === 'object') {
        return (value as Record<string, unknown>)[key];
      }

      return undefined;
    }, object);
  }

  private normalizeValue(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  private compareValues(firstValue: unknown, secondValue: unknown): number {
    if (firstValue === secondValue) {
      return 0;
    }

    if (firstValue === null || firstValue === undefined) {
      return 1;
    }

    if (secondValue === null || secondValue === undefined) {
      return -1;
    }

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      return firstValue - secondValue;
    }

    return String(firstValue).localeCompare(String(secondValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  private getNextSortDirection(direction: SharedTableSortDirection): SharedTableSortDirection {
    if (direction === null) {
      return 'asc';
    }

    if (direction === 'asc') {
      return 'desc';
    }

    return null;
  }
}
