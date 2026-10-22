export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DrawerAnimationType = 'slide' | 'fade' | 'scale' | 'bounce';

export interface DrawerConfig {
  position?: DrawerPosition;
  size?: DrawerSize;
  animation?: DrawerAnimationType;
  duration?: number;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  preventBodyScroll?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}
