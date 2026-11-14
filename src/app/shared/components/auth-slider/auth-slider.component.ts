import {
  Component,
  OnInit,
  OnDestroy,
  input,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface AuthSlide {
  badge: string;
  badgeIcon: string;
  title: string;
  description: string;
  cardTitle: string;
  cardQuote: string;
  cardAuthor: string;
  cardRole: string;
  cardInitials: string;
  rating: number;
  statValue: string;
  statLabel: string;
}

@Component({
  selector: 'app-auth-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./auth-slider.component.html",
  styleUrl: "./auth-slider.component.scss",
})
export class AppAuthSliderComponent implements OnInit, OnDestroy {
  readonly isInvitation = input<boolean>(false);
  readonly companyName = input<string | undefined>(undefined);

  readonly currentIndex = signal<number>(0);
  readonly isPaused = signal<boolean>(false);
  readonly currentYear = new Date().getFullYear();

  readonly slides: AuthSlide[] = [
    {
      badge: 'Streamline Operations',
      badgeIcon: '✦',
      title: 'Streamline Your Business Operations',
      description:
        'Manage regional branches, multi-tenant departments, shifts, and team permissions seamlessly from a unified cloud dashboard.',
      cardTitle: 'Game changer for our business',
      cardQuote:
        'The onboarding flow was effortless. We configured our entire workspace, roles, and branch office times in under ten minutes.',
      cardAuthor: 'Marcus Vance',
      cardRole: 'Co-Founder @ TechPulse',
      cardInitials: 'MV',
      rating: 5,
      statValue: '99.9%',
      statLabel: 'Platform Uptime',
    },
    {
      badge: 'Team Collaboration',
      badgeIcon: '⚡',
      title: 'Connect Distributed Teams',
      description:
        'Collaborate on Jira-style Kanban sprint boards, direct & channel chat with unread indicators, and instant video meetings with join codes.',
      cardTitle: 'Keeps our distributed team in sync',
      cardQuote:
        'Instant channel messaging, task assignment notifications, and scheduled meeting codes keep our branches completely synchronized.',
      cardAuthor: 'Alex Chen',
      cardRole: 'VP of Engineering @ NovaDynamics',
      cardInitials: 'AC',
      rating: 5,
      statValue: '10x',
      statLabel: 'Task Turnaround',
    },
    {
      badge: 'Smart Attendance',
      badgeIcon: '⏱',
      title: 'Automated Shifts & Attendance',
      description:
        'Track branch-level punch in/out, regional holidays, shift rosters, and payroll calculations automatically with zero manual overhead.',
      cardTitle: 'Payroll & shift tracking made simple',
      cardQuote:
        'Shift attendance, overtime calculation, and regional payroll formulas run flawlessly across our overseas and local branches.',
      cardAuthor: 'Sarah Jenkins',
      cardRole: 'Head of People @ ApexCorp',
      cardInitials: 'SJ',
      rating: 5,
      statValue: '350+ hrs',
      statLabel: 'Saved Monthly',
    },
    {
      badge: 'Enterprise Security',
      badgeIcon: '🛡',
      title: 'Multi-Tenant Data Isolation',
      description:
        'Built on MongoDB sharded clusters, role-based access control (RBAC), and enterprise encryption to guarantee strict regional data sovereignty.',
      cardTitle: 'Enterprise security built-in',
      cardQuote:
        'WorkivLab gave us the exact security architecture we needed to satisfy international compliance across multiple countries.',
      cardAuthor: 'David Ross',
      cardRole: 'Chief Information Security Officer',
      cardInitials: 'DR',
      rating: 5,
      statValue: 'SOC2 & GDPR',
      statLabel: 'Compliant Design',
    },
  ];

  readonly currentSlide = computed(() => this.slides[this.currentIndex()]);

  private timerRef: any = null;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    this.stopAutoPlay();
    this.timerRef = setInterval(() => {
      if (!this.isPaused()) {
        this.next();
      }
    }, 5500);
  }

  stopAutoPlay(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  next(): void {
    this.currentIndex.update((i) => (i + 1) % this.slides.length);
  }

  prev(): void {
    this.currentIndex.update((i) => (i - 1 + this.slides.length) % this.slides.length);
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.slides.length) {
      this.currentIndex.set(index);
    }
  }

  pause(): void {
    this.isPaused.set(true);
  }

  resume(): void {
    this.isPaused.set(false);
  }
}
