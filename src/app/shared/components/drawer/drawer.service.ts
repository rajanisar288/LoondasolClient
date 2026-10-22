import { Injectable, signal } from '@angular/core';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerOptions {
  id?: string;
  title: string;
  subtitle?: string;
  position?: DrawerPosition;
  width?: string;
  hasBackdrop?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showFooter?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
  private readonly _activeDrawer = signal<DrawerOptions | null>(null);
  readonly activeDrawer = this._activeDrawer.asReadonly();

  open(options: DrawerOptions): void {
    this._activeDrawer.set({
      position: 'right',
      width: '420px',
      hasBackdrop: true,
      closeOnBackdrop: true,
      closeOnEscape: true,
      showFooter: true,
      primaryLabel: 'Apply',
      secondaryLabel: 'Cancel',
      ...options,
    });
  }

  close(): void {
    this._activeDrawer.set(null);
  }

  isOpen(): boolean {
    return this._activeDrawer() !== null;
  }
}
