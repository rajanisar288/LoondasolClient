import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly router = inject(Router);

  // Mobile drawer open/closed state
  readonly isMobileOpen = signal<boolean>(false);

  // Desktop sidebar collapsed/expanded state
  readonly isDesktopCollapsed = signal<boolean>(false);

  constructor() {
    // Restore collapsed state from localStorage if available
    try {
      const saved = localStorage.getItem('workivlab_sidebar_collapsed');
      if (saved !== null) {
        this.isDesktopCollapsed.set(saved === 'true');
      }
    } catch {
      // Ignore storage access errors in private browsing
    }

    // Automatically close mobile drawer upon navigation
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.closeMobile();
      });
  }

  toggleMobile(): void {
    this.isMobileOpen.update((v) => !v);
  }

  openMobile(): void {
    this.isMobileOpen.set(true);
  }

  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  toggleCollapse(): void {
    const next = !this.isDesktopCollapsed();
    this.isDesktopCollapsed.set(next);
    try {
      localStorage.setItem('workivlab_sidebar_collapsed', String(next));
    } catch {
      // Ignore storage access errors
    }
  }

  setCollapsed(val: boolean): void {
    this.isDesktopCollapsed.set(val);
    try {
      localStorage.setItem('workivlab_sidebar_collapsed', String(val));
    } catch {
      // Ignore storage access errors
    }
  }
}
