import { Component, Input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative inline-flex items-center justify-center select-none flex-shrink-0 font-semibold uppercase"
      [ngClass]="[getSizeClass(), getShapeClass()]"
      [title]="name || ''"
    >
      <div
        class="w-full h-full flex items-center justify-center overflow-hidden"
        [ngClass]="[getShapeClass(), !hasValidImage() ? getBgColorClass() : 'bg-slate-200 dark:bg-slate-700']"
      >
        @if (hasValidImage()) {
          <img
            [src]="src"
            [alt]="name || 'Avatar'"
            (error)="onImageError()"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        } @else {
          <span class="text-white tracking-wider font-medium" [ngClass]="getTextSizeClass()">
            {{ initials() }}
          </span>
        }
      </div>

      @if (status) {
        <span
          class="absolute -bottom-0.5 -right-0.5 rounded-full border-white dark:border-slate-900 shadow-xs z-10"
          [ngClass]="[getStatusClass(), getStatusSizeClass()]"
          [title]="status === 'online' ? 'Active now' : 'Offline'"
        ></span>
      }
    </div>
  `,
})
export class AppAvatarComponent {
  @Input() src?: string | null = null;
  @Input() set imageUrl(val: string | null | undefined) {
    this.src = val;
  }
  get imageUrl(): string | null | undefined {
    return this.src;
  }
  @Input() name?: string = '';
  @Input() size: AvatarSize = 'md';
  @Input() shape: 'circle' | 'rounded' = 'circle';
  @Input() status?: AvatarStatus | null = null;

  imageError = signal(false);

  /** Checks if a valid avatar image URL is available. */
  hasValidImage(): boolean {
    return Boolean(this.src && this.src.trim().length > 0 && !this.imageError());
  }

  /** Marks image loading error to fallback to initials. */
  onImageError(): void {
    this.imageError.set(true);
  }

  initials = computed(() => {
    const raw = (this.name || '').trim();
    if (!raw) return '?';

    const clean = raw.includes('@') ? raw.split('@')[0].replace(/[._-]/g, ' ') : raw;
    const parts = clean.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  /** Returns width and height classes for the avatar container. */
  getSizeClass(): string {
    switch (this.size) {
      case 'xs':
        return 'w-6 h-6 text-[10px]';
      case 'sm':
        return 'w-8 h-8 text-xs';
      case 'md':
        return 'w-10 h-10 text-sm';
      case 'lg':
        return 'w-12 h-12 text-base';
      case 'xl':
        return 'w-16 h-16 text-xl';
      default:
        return 'w-10 h-10 text-sm';
    }
  }

  /** Returns font size classes for initials fallback text. */
  getTextSizeClass(): string {
    switch (this.size) {
      case 'xs':
        return 'text-[9px]';
      case 'sm':
        return 'text-[11px]';
      case 'md':
        return 'text-xs';
      case 'lg':
        return 'text-sm';
      case 'xl':
        return 'text-base';
      default:
        return 'text-xs';
    }
  }

  /** Returns border radius class based on avatar shape. */
  getShapeClass(): string {
    return this.shape === 'circle' ? 'rounded-full' : 'rounded-[8px]';
  }

  /** Returns background color class for the status indicator dot. */
  getStatusClass(): string {
    switch (this.status) {
      case 'online':
        return 'bg-emerald-500';
      case 'offline':
        return 'bg-slate-400 dark:bg-slate-500';
      case 'busy':
        return 'bg-rose-500';
      case 'away':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  }

  /** Returns dimensions and border width for the status indicator dot. */
  getStatusSizeClass(): string {
    switch (this.size) {
      case 'xs':
        return 'w-2 h-2 border-[1.5px]';
      case 'sm':
        return 'w-2.5 h-2.5 border-2';
      case 'md':
        return 'w-3 h-3 border-2';
      case 'lg':
      case 'xl':
        return 'w-3.5 h-3.5 border-2';
      default:
        return 'w-3 h-3 border-2';
    }
  }

  getBgColorClass(): string {
    const colors = [
      'bg-blue-600',
      'bg-indigo-600',
      'bg-violet-600',
      'bg-purple-600',
      'bg-fuchsia-600',
      'bg-pink-600',
      'bg-rose-600',
      'bg-teal-600',
      'bg-emerald-600',
      'bg-amber-600',
    ];
    let hash = 0;
    const str = this.name || 'avatar';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
