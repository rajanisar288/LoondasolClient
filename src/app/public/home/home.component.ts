import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent {
  readonly authService = inject(AuthService);
  readonly isDark = signal<boolean>(
    typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  readonly calculatorSeats = signal<number>(10);

  // setCalculatorSeats: updates calculator seat count
  setCalculatorSeats(count: number): void {
    this.calculatorSeats.set(Math.max(1, count));
  }

  // getSeatTotal: computes total monthly cost for seats at given price rate
  getSeatTotal(rate: number): number {
    return this.calculatorSeats() * rate;
  }

  // toggleDarkMode: toggles dark and light mode stylesheet classes
  toggleDarkMode(): void {
    if (typeof window === 'undefined') return;
    const isNowDark = !this.isDark();
    this.isDark.set(isNowDark);
    if (isNowDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
