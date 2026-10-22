import { TemplateRef } from '@angular/core';

export type SharedTableAlign = 'left' | 'center' | 'right';

export type SharedTableSortDirection = 'asc' | 'desc' | null;

export interface SharedTableColumn<T = any> {
  /**
   * Property name or nested property path.
   * Examples: "name", "customer.name", "status"
   */
  key: keyof T | string;

  /**
   * Column heading text.
   */
  header: string;

  /**
   * Optional fixed or minimum column width.
   * Examples: "120px", "18rem", "20%"
   */
  width?: string;

  /**
   * Cell alignment. Default is 'left'.
   */
  align?: SharedTableAlign;

  /**
   * Whether this column can be sorted.
   */
  sortable?: boolean;

  /**
   * Whether this column should be included in client-side search.
   */
  searchable?: boolean;

  /**
   * Whether this column should be hidden on smaller screens.
   */
  hideOnMobile?: boolean;

  /**
   * Fallback value when the cell is empty.
   */
  emptyValue?: string;

  /**
   * Custom value accessor function.
   */
  valueGetter?: (row: T) => unknown;

  /**
   * Custom display formatter function.
   */
  formatter?: (value: unknown, row: T) => string;

  /**
   * Custom Angular template for cell rendering.
   */
  template?: TemplateRef<SharedTableCellContext<T>>;

  /**
   * Custom Angular template for header rendering.
   */
  headerTemplate?: TemplateRef<unknown>;
}

export interface SharedTableCellContext<T = any> {
  $implicit: T;
  row: T;
  value: unknown;
  column: SharedTableColumn<T>;
}

export interface SharedTableAction<T = any> {
  /**
   * Unique action identifier (e.g. 'view', 'edit', 'delete').
   */
  id: string;

  /**
   * Text displayed inside the action menu, or a function returning the text for a given row.
   */
  label: string | ((row: T) => string);

  /**
   * Optional icon (emoji or svg string) displayed next to the label.
   */
  icon?: string;

  /**
   * Optional CSS class for the action item.
   */
  className?: string;

  /**
   * Marks the action as destructive/danger.
   */
  danger?: boolean;

  /**
   * Determines whether the action is visible for a row.
   */
  visible?: (row: T) => boolean;

  /**
   * Determines whether the action is disabled for a row.
   */
  disabled?: (row: T) => boolean;
}

export interface SharedTableActionEvent<T = any> {
  action: SharedTableAction<T>;
  row: T;
}

export interface SharedTableSortEvent<T = any> {
  column: SharedTableColumn<T>;
  direction: SharedTableSortDirection;
}

export interface SharedTablePageEvent {
  page: number;
  pageSize: number;
}
