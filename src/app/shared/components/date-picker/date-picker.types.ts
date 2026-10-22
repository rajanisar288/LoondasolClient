export type DatePickerMode = 'single' | 'range' | 'month';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangeString {
  start: string | null;
  end: string | null;
}

export interface DatePreset {
  id: string;
  label: string;
  getRange: () => { start: Date; end: Date };
}

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isDisabled: boolean;
}
