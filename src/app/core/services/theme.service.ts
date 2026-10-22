import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem('workivlab_theme');
    if (saved === 'dark') {
      this.setDark(true);
    }
  }

  toggleTheme(): void {
    this.setDark(!this.isDarkMode());
  }

  private setDark(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('workivlab_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('workivlab_theme', 'light');
    }
  }
}
