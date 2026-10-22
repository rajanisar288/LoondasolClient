import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { DrawerAnimationType, DrawerPosition, DrawerSize } from './drawer.types';

export * from './drawer.types';

@Component({
  selector: 'shared-drawer, app-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedDrawerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly renderer = inject(Renderer2);
  private readonly el = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() position: DrawerPosition = 'right';
  @Input() size: DrawerSize = 'md';
  @Input() animation: DrawerAnimationType = 'slide';
  @Input() closeOnBackdrop = true;
  @Input() closeOnEscape = true;
  @Input() showCloseButton = true;
  @Input() preventBodyScroll = true;
  @Input() customClass = '';
  @Input() overlayClass = '';
  @Input() duration = 300;
  @Input() showHeader = true;
  @Input() showFooter = true;
  @Input() data: any = null;
  @Input() hasBackdrop = true;
  @Input() customWidth = '';
  @Input() customHeight = '';
  @Input() showDefaultFooterActions = true;
  @Input() primaryLabel = 'Apply';
  @Input() secondaryLabel = 'Cancel';
  @Input() resetLabel = 'Reset All';
  @Input() showResetButton = false;
  @Input() primaryLoading = false;
  @Input() primaryDisabled = false;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() opened = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() backdropClick = new EventEmitter<void>();
  @Output() primaryAction = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
  @Output() resetAction = new EventEmitter<void>();
  @Output() animationStart = new EventEmitter<any>();
  @Output() animationDone = new EventEmitter<any>();

  @ContentChild('drawerHeader') headerTemplate: TemplateRef<any> | null = null;
  @ContentChild('drawerContent') contentTemplate: TemplateRef<any> | null = null;
  @ContentChild('drawerFooter') footerTemplate: TemplateRef<any> | null = null;
  @ContentChild('drawerFooterLeft') footerLeftTemplate: TemplateRef<any> | null = null;

  @ViewChild('drawerContainer') drawerContainer?: ElementRef;

  private bodyScrollTop = 0;
  private isCurrentlyOpen = false;
  private closeTimeout: any = null;
  isClosing = false;

  ngOnInit(): void {
    if (this.isOpen) {
      this.onOpen();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.handleOpenStateChange();
    }
  }

  ngAfterViewInit(): void {
    // Initial view hook
  }

  ngOnDestroy(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.restoreBodyScroll();
  }

  private handleOpenStateChange(): void {
    if (this.isOpen) {
      if (this.closeTimeout) {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }
      this.isClosing = false;
      this.onOpen();
    } else if (this.isCurrentlyOpen) {
      this.startClosingTransition();
    }
  }

  private onOpen(): void {
    if (this.isCurrentlyOpen) {
      return;
    }
    this.isCurrentlyOpen = true;
    this.isClosing = false;
    if (this.preventBodyScroll) {
      this.disableBodyScroll();
    }
    this.animationStart.emit({ toState: 'open' });
    this.opened.emit();
    setTimeout(() => {
      this.animationDone.emit({ toState: 'open' });
    }, this.duration);
    this.cdr.markForCheck();
  }

  private startClosingTransition(): void {
    this.isClosing = true;
    this.animationStart.emit({ toState: 'close' });
    this.cdr.markForCheck();

    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }

    this.closeTimeout = setTimeout(() => {
      this.isCurrentlyOpen = false;
      this.isClosing = false;
      if (this.preventBodyScroll) {
        this.restoreBodyScroll();
      }
      this.animationDone.emit({ toState: 'close' });
      this.closed.emit();
      this.cdr.markForCheck();
    }, Math.min(220, this.duration));
  }

  close(): void {
    if (!this.isOpen && !this.isCurrentlyOpen) {
      return;
    }
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.startClosingTransition();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop) {
      this.backdropClick.emit();
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.closeOnEscape && (this.isOpen || this.isCurrentlyOpen)) {
      this.close();
    }
  }

  onPrimaryClick(): void {
    this.primaryAction.emit();
  }

  onSecondaryClick(): void {
    this.secondaryAction.emit();
    this.close();
  }

  onResetClick(): void {
    this.resetAction.emit();
  }

  private disableBodyScroll(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.bodyScrollTop = window.scrollY || document.documentElement.scrollTop;
    this.renderer.setStyle(document.body, 'position', 'fixed');
    this.renderer.setStyle(document.body, 'top', `-${this.bodyScrollTop}px`);
    this.renderer.setStyle(document.body, 'width', '100%');
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  private restoreBodyScroll(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.renderer.removeStyle(document.body, 'position');
    this.renderer.removeStyle(document.body, 'top');
    this.renderer.removeStyle(document.body, 'width');
    this.renderer.removeStyle(document.body, 'overflow');
    window.scrollTo(0, this.bodyScrollTop);
  }

  getSizeClasses(): string {
    const sizeMap: Record<DrawerSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full',
    };

    if (this.position === 'top' || this.position === 'bottom') {
      const heightMap: Record<DrawerSize, string> = {
        sm: 'max-h-[35vh]',
        md: 'max-h-[55vh]',
        lg: 'max-h-[75vh]',
        xl: 'max-h-[90vh]',
        full: 'max-h-full',
      };
      return heightMap[this.size] || heightMap['md'];
    }

    return sizeMap[this.size] || sizeMap['md'];
  }

  getPositionClasses(): string {
    const positionMap: Record<DrawerPosition, string> = {
      right: 'inset-y-0 right-0',
      left: 'inset-y-0 left-0',
      top: 'inset-x-0 top-0',
      bottom: 'inset-x-0 bottom-0',
    };
    return positionMap[this.position] || positionMap['right'];
  }

  getPanelClasses(): string {
    const basePos = this.getPositionClasses();
    const baseSize = this.getSizeClasses();
    const animClass = this.getAnimationClass();
    const closingClass = this.isClosing ? 'shared-drawer-panel--closing' : '';

    return `${basePos} ${baseSize} ${animClass} ${closingClass} ${this.customClass}`.trim();
  }

  getAnimationClass(): string {
    if (this.animation === 'scale') {
      return 'shared-drawer-panel--scale';
    }
    if (this.animation === 'bounce') {
      return 'shared-drawer-panel--bounce';
    }
    if (this.animation === 'fade') {
      return 'shared-drawer-panel--fade';
    }

    // Default 'slide'
    switch (this.position) {
      case 'left':
        return 'shared-drawer-panel--slide-left';
      case 'top':
        return 'shared-drawer-panel--slide-top';
      case 'bottom':
        return 'shared-drawer-panel--slide-bottom';
      case 'right':
      default:
        return 'shared-drawer-panel--slide-right';
    }
  }

  getTransformOrigin(): string {
    const originMap: Record<DrawerPosition, string> = {
      right: 'right center',
      left: 'left center',
      top: 'center top',
      bottom: 'center bottom',
    };
    return originMap[this.position] || 'right center';
  }

  getCustomWidth(): string {
    if (this.customWidth) {
      return this.customWidth;
    }
    return '98%';
  }

  getCustomHeight(): string {
    if (this.customHeight) {
      return this.customHeight;
    }
    return this.position === 'top' || this.position === 'bottom' ? 'auto' : '98dvh';
  }

  hasHeaderTemplate(): boolean {
    return Boolean(this.headerTemplate);
  }

  hasContentTemplate(): boolean {
    return Boolean(this.contentTemplate);
  }

  hasFooterTemplate(): boolean {
    return Boolean(this.footerTemplate);
  }

  hasFooterLeftTemplate(): boolean {
    return Boolean(this.footerLeftTemplate);
  }
}

// Re-export as AppDrawerComponent for backward compatibility
export { SharedDrawerComponent as AppDrawerComponent };
