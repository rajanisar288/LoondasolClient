import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import {
  DatePickerMode,
  DateRange,
  DatePreset,
  CalendarDay,
} from './date-picker.types';

export * from './date-picker.types';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDatePickerComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./date-picker.component.html",
  styleUrl: "./date-picker.component.scss",
})
export class AppDatePickerComponent implements OnInit, ControlValueAccessor {
  private readonly el = inject(ElementRef);

  @Input() mode: DatePickerMode = 'single';
  @Input() placeholder = 'Select date';
  @Input() label = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() showTime = false;
  @Input() showEndTime = false;
  @Input() showPresets = true;
  @Input() showQuickPills = true;
  @Input() align: 'left' | 'right' = 'right';
  @Input() minDate?: Date | string;
  @Input() maxDate?: Date | string;
  @Input() set value(v: any) {
    this.writeValue(v);
  }

  @Output() dateChange = new EventEmitter<Date | null>();
  @Output() rangeChange = new EventEmitter<DateRange>();
  @Output() timeRangeChange = new EventEmitter<{ startTime: string; endTime: string }>();

  readonly isOpen = signal(false);
  readonly isDropUp = signal(false);
  readonly isViewingMonths = signal(false);

  // Calendar State
  readonly activeYear = signal(new Date().getFullYear());
  readonly activeMonth = signal(new Date().getMonth());

  // Dual Pane Calendars (for Range)
  readonly pane1Year = signal(new Date().getFullYear());
  readonly pane1Month = signal(new Date().getMonth());
  readonly pane2Year = signal(new Date().getMonth() === 11 ? new Date().getFullYear() + 1 : new Date().getFullYear());
  readonly pane2Month = signal((new Date().getMonth() + 1) % 12);

  // Selected State
  readonly selectedDate = signal<Date | null>(null);
  readonly selectedRange = signal<DateRange>({ start: null, end: null });
  readonly activePresetId = signal<string | null>(null);

  // Time inputs
  startTimeStr = '09:00';
  startTimeAmpm = 'AM';
  endTimeStr = '06:00';
  endTimeAmpm = 'PM';

  readonly weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  readonly allMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  readonly presets: DatePreset[] = [
    {
      id: 'today',
      label: 'Today',
      getRange: () => {
        const d = new Date();
        return { start: d, end: d };
      },
    },
    {
      id: 'this_week',
      label: 'This week',
      getRange: () => {
        const now = new Date();
        const first = now.getDate() - now.getDay() + 1;
        const start = new Date(now.setDate(first));
        const end = new Date(now.setDate(first + 6));
        return { start, end };
      },
    },
    {
      id: 'last_7_days',
      label: 'Last 7 days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { start, end };
      },
    },
    {
      id: 'last_14_days',
      label: 'Last 14 days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 13);
        return { start, end };
      },
    },
    {
      id: 'last_90_days',
      label: 'Last 90 days',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 89);
        return { start, end };
      },
    },
    {
      id: 'last_12_months',
      label: 'Last 12 months',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 1);
        return { start, end };
      },
    },
    {
      id: 'last_year',
      label: 'Last year',
      getRange: () => {
        const y = new Date().getFullYear() - 1;
        return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
      },
    },
    {
      id: 'all_time',
      label: 'All time',
      getRange: () => {
        return { start: new Date(2020, 0, 1), end: new Date() };
      },
    },
  ];

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    if (this.mode === 'range' && !this.selectedRange().start && !this.selectedRange().end) {
      const p = this.presets.find((x) => x.id === 'last_14_days');
      if (p) {
        this.activePresetId.set(p.id);
        this.selectedRange.set(p.getRange());
      }
    }
  }

  /** Closes this date picker when another dropdown opens anywhere in the application. */
  @HostListener('window:app:dropdown-open', ['$event'])
  onOtherDropdownOpen(event: Event): void {
    const customEvent = event as CustomEvent;
    if (this.isOpen() && customEvent.detail !== this.el.nativeElement) {
      this.isOpen.set(false);
    }
  }

  /** Closes the date picker when clicking outside the host element. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  readonly dropdownStyle = signal<Record<string, string>>({});

  /** Recalculates fixed screen coordinates for the floating date picker popover. */
  updateDropdownPosition(): void {
    const targetEl = (this.el.nativeElement.querySelector('button') || this.el.nativeElement) as HTMLElement;
    const rect = targetEl.getBoundingClientRect();

    // Calculate parent container offset if ancestor has a CSS transform containing block
    let containerTop = 0;
    let containerLeft = 0;
    let parent = targetEl.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      if (
        style.transform !== 'none' ||
        style.perspective !== 'none' ||
        style.filter !== 'none' ||
        style.contain === 'paint' ||
        style.willChange?.includes('transform')
      ) {
        const parentRect = parent.getBoundingClientRect();
        containerTop = parentRect.top;
        containerLeft = parentRect.left;
        break;
      }
      parent = parent.parentElement;
    }

    const pickerWidth = this.mode === 'range' 
      ? Math.min(700, window.innerWidth - 32) 
      : Math.min(360, window.innerWidth - 32);
    
    let leftPos = this.align === 'right' 
      ? rect.right - pickerWidth 
      : rect.left;

    if (leftPos < 16) leftPos = 16;
    if (leftPos + pickerWidth > window.innerWidth - 16) {
      leftPos = Math.max(16, window.innerWidth - pickerWidth - 16);
    }

    const minHeightRequired = this.mode === 'range' ? 440 : (this.showTime ? 420 : 380);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < minHeightRequired && spaceAbove > spaceBelow;
    this.isDropUp.set(dropUp);

    const relativeLeft = leftPos - containerLeft;

    if (dropUp) {
      const relativeBottom = containerTop 
        ? (window.innerHeight - rect.top - containerTop) 
        : (window.innerHeight - rect.top);
      this.dropdownStyle.set({
        position: 'fixed',
        top: 'auto',
        bottom: `${Math.max(8, relativeBottom + 6)}px`,
        left: `${relativeLeft}px`,
        right: 'auto',
        maxHeight: `${Math.max(280, rect.top - 16)}px`,
        overflowY: 'auto',
        zIndex: '99999',
      });
    } else {
      const relativeTop = rect.bottom + 6 - containerTop;
      this.dropdownStyle.set({
        position: 'fixed',
        top: `${relativeTop}px`,
        bottom: 'auto',
        left: `${relativeLeft}px`,
        right: 'auto',
        maxHeight: `${Math.max(280, window.innerHeight - rect.bottom - 16)}px`,
        overflowY: 'auto',
        zIndex: '99999',
      });
    }
  }

  /** Updates position on scroll or window resize. */
  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize')
  onWindowScrollOrResize(): void {
    if (this.isOpen()) {
      this.updateDropdownPosition();
    }
  }

  /** Closes the date picker when pressing the Escape key. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }

  /** Toggles the date picker popover and notifies other dropdowns to close. */
  toggleOpen(tab?: string): void {
    if (this.disabled) return;
    const nextState = !this.isOpen();
    if (nextState) {
      this.isOpen.set(true);
      setTimeout(() => this.updateDropdownPosition(), 0);
      window.dispatchEvent(new CustomEvent('app:dropdown-open', { detail: this.el.nativeElement }));
    } else {
      this.isOpen.set(false);
    }
  }

  toggleMonthView(paneIndex?: number): void {
    this.isViewingMonths.update((v) => !v);
  }

  toggleViewMode(paneIndex?: number): void {
    this.toggleMonthView(paneIndex);
  }

  getMonthName(monthIndex: number): string {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return names[monthIndex] || '';
  }

  prevMonth(): void {
    let m = this.pane1Month() - 1;
    let y = this.pane1Year();
    if (m < 0) {
      m = 11;
      y--;
    }
    this.pane1Month.set(m);
    this.pane1Year.set(y);

    let m2 = m + 1;
    let y2 = y;
    if (m2 > 11) {
      m2 = 0;
      y2++;
    }
    this.pane2Month.set(m2);
    this.pane2Year.set(y2);
  }

  nextMonth(): void {
    let m = this.pane1Month() + 1;
    let y = this.pane1Year();
    if (m > 11) {
      m = 0;
      y++;
    }
    this.pane1Month.set(m);
    this.pane1Year.set(y);

    let m2 = m + 1;
    let y2 = y;
    if (m2 > 11) {
      m2 = 0;
      y2++;
    }
    this.pane2Month.set(m2);
    this.pane2Year.set(y2);
  }

  prevMonthSingle(): void {
    let m = this.activeMonth() - 1;
    let y = this.activeYear();
    if (m < 0) {
      m = 11;
      y--;
    }
    this.activeMonth.set(m);
    this.activeYear.set(y);
  }

  nextMonthSingle(): void {
    let m = this.activeMonth() + 1;
    let y = this.activeYear();
    if (m > 11) {
      m = 0;
      y++;
    }
    this.activeMonth.set(m);
    this.activeYear.set(y);
  }

  prevYear(): void {
    this.activeYear.update((y) => y - 1);
  }

  nextYear(): void {
    this.activeYear.update((y) => y + 1);
  }

  selectMonth(monthIndex: number): void {
    this.activeMonth.set(monthIndex);
    this.isViewingMonths.set(false);
  }

  selectQuickDate(daysOffset: number): void {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(0, 0, 0, 0);
    this.selectedDate.set(d);
    this.activeMonth.set(d.getMonth());
    this.activeYear.set(d.getFullYear());
    this.dateChange.emit(d);
  }

  isQuickDateSelected(daysOffset: number): boolean {
    const cur = this.selectedDate();
    if (!cur) return false;
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    return cur.toDateString() === target.toDateString();
  }

  selectSingleDate(date: Date): void {
    const copy = new Date(date);
    this.selectedDate.set(copy);
    this.dateChange.emit(copy);
  }

  selectRangeDate(date: Date): void {
    const current = this.selectedRange();
    this.activePresetId.set(null);

    if (!current.start || (current.start && current.end)) {
      this.selectedRange.set({ start: new Date(date), end: null });
    } else {
      if (date < current.start) {
        this.selectedRange.set({ start: new Date(date), end: current.start });
      } else {
        this.selectedRange.set({ start: current.start, end: new Date(date) });
      }
    }
  }

  applyPreset(preset: DatePreset): void {
    this.activePresetId.set(preset.id);
    const range = preset.getRange();
    this.selectedRange.set(range);

    if (range.start) {
      this.pane1Month.set(range.start.getMonth());
      this.pane1Year.set(range.start.getFullYear());
      let m2 = range.start.getMonth() + 1;
      let y2 = range.start.getFullYear();
      if (m2 > 11) {
        m2 = 0;
        y2++;
      }
      this.pane2Month.set(m2);
      this.pane2Year.set(y2);
    }
  }

  applySingle(): void {
    const d = this.selectedDate();
    this.onChange(d ? d.toISOString() : null);
    this.dateChange.emit(d);
    if (this.showTime) {
      this.timeRangeChange.emit({
        startTime: this.convertTo24Hour(this.startTimeStr, this.startTimeAmpm),
        endTime: this.convertTo24Hour(this.endTimeStr, this.endTimeAmpm),
      });
    }
    this.isOpen.set(false);
  }

  private convertTo24Hour(timeStr: string, ampm: string): string {
    const parts = (timeStr || '09:00').trim().split(':');
    let h = Number(parts[0] || 9);
    const m = Number((parts[1] || '0').replace(/[^0-9]/g, ''));
    if (isNaN(h)) h = 9;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(isNaN(m) ? 0 : m).padStart(2, '0')}`;
  }

  applyRange(): void {
    const r = this.selectedRange();
    this.onChange({
      start: r.start ? r.start.toISOString() : null,
      end: r.end ? r.end.toISOString() : null,
    });
    this.rangeChange.emit(r);
    this.isOpen.set(false);
  }

  cancel(): void {
    this.isOpen.set(false);
  }

  // Days calculations
  readonly singleCalendarDays = computed<CalendarDay[]>(() => {
    return this.generateMonthDays(this.activeYear(), this.activeMonth());
  });

  readonly pane1Days = computed<CalendarDay[]>(() => {
    return this.generateMonthDays(this.pane1Year(), this.pane1Month(), this.selectedRange());
  });

  readonly pane2Days = computed<CalendarDay[]>(() => {
    return this.generateMonthDays(this.pane2Year(), this.pane2Month(), this.selectedRange());
  });

  private generateMonthDays(year: number, month: number, range?: DateRange): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1; // 0=Mon, 6=Sun
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this.createCalendarDay(d, false, today, range));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push(this.createCalendarDay(d, true, today, range));
    }

    // Next month padding to fill 35 or 42 grid
    const totalCount = days.length <= 35 ? 35 : 42;
    const remaining = totalCount - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.createCalendarDay(d, false, today, range));
    }

    return days;
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date, range?: DateRange): CalendarDay {
    date.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();

    let isSelected = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;

    if (this.mode === 'single') {
      const cur = this.selectedDate();
      if (cur) {
        const copy = new Date(cur);
        copy.setHours(0, 0, 0, 0);
        isSelected = copy.getTime() === date.getTime();
      }
    } else if (range) {
      if (range.start) {
        const s = new Date(range.start);
        s.setHours(0, 0, 0, 0);
        isRangeStart = s.getTime() === date.getTime();
      }
      if (range.end) {
        const e = new Date(range.end);
        e.setHours(0, 0, 0, 0);
        isRangeEnd = e.getTime() === date.getTime();
      }
      if (range.start && range.end) {
        const s = new Date(range.start);
        s.setHours(0, 0, 0, 0);
        const e = new Date(range.end);
        e.setHours(0, 0, 0, 0);
        isInRange = date >= s && date <= e;
      }
      isSelected = isRangeStart || isRangeEnd;
    }

    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      isRangeStart,
      isRangeEnd,
      isInRange,
      isDisabled: false,
    };
  }

  getDayClasses(d: CalendarDay): string {
    if (d.isSelected) {
      return 'bg-[#2A65F6] text-white font-bold shadow-xs';
    }
    if (!d.isCurrentMonth) {
      return 'text-slate-300 dark:text-slate-600 hover:text-slate-800 dark:hover:text-slate-200';
    }
    if (d.isInRange) {
      return 'text-[#2A65F6] font-semibold';
    }
    return 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2d3035]';
  }

  readonly activePresetLabel = computed(() => {
    const id = this.activePresetId();
    if (!id) return null;
    const p = this.presets.find((x) => x.id === id);
    return p ? p.label : null;
  });

  readonly formattedDisplayRange = computed(() => {
    const r = this.selectedRange();
    if (!r.start && !r.end) return '';
    if (r.start && !r.end) {
      return `${this.formatDate(r.start)} - ...`;
    }
    if (r.start && r.end) {
      return `${this.formatDate(r.start)} - ${this.formatDate(r.end)}`;
    }
    return '';
  });

  readonly formattedSingleDate = computed(() => {
    const d = this.selectedDate();
    return d ? this.formatDate(d) : '';
  });

  private formatDate(d: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  // ControlValueAccessor
  writeValue(value: any): void {
    if (!value) {
      this.selectedDate.set(null);
      this.selectedRange.set({ start: null, end: null });
      return;
    }
    if (typeof value === 'string' || value instanceof Date) {
      const d = new Date(value);
      this.selectedDate.set(d);
      this.activeYear.set(d.getFullYear());
      this.activeMonth.set(d.getMonth());
    } else if (value.start || value.end) {
      this.selectedRange.set({
        start: value.start ? new Date(value.start) : null,
        end: value.end ? new Date(value.end) : null,
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
