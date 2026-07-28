import type { DateRange } from '../interfaces/date-picker.interface';

export type DatePickerMode = 'single' | 'range';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

export interface DateDisableRule {
  minDate?: Date;
  maxDate?: Date;
  shouldDisableDate?: (date: Date) => boolean;
}

export interface DaySelectionState {
  isSelected: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function asRange(value: Date | DateRange | null | undefined): DateRange {
  return Array.isArray(value) ? value : [null, null];
}

/** Compares calendar days, ignoring time-of-day. */
export function isSameDay(
  a: Date | null | undefined,
  b: Date | null | undefined,
): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Resolves whether `date` is blocked, normalizing every boundary to
 * day-granularity so a `minDate`/`maxDate` carrying a time-of-day (the common
 * `new Date()` case) never disables its own boundary day.
 */
export function isDateDisabled(
  date: Date,
  { minDate, maxDate, shouldDisableDate }: DateDisableRule,
): boolean {
  const day = startOfDay(date);
  if (minDate && day < startOfDay(minDate)) return true;
  if (maxDate && day > startOfDay(maxDate)) return true;
  return Boolean(shouldDisableDate?.(date));
}

/** Resolved selection state of one calendar day, for both modes. */
export function getDaySelectionState(
  mode: DatePickerMode,
  value: Date | DateRange | null | undefined,
  date: Date,
): DaySelectionState {
  if (mode === 'single') {
    const isSelected = isSameDay(value as Date | null | undefined, date);
    return { isSelected, isStart: false, isEnd: false, isInRange: false };
  }

  const [start, end] = asRange(value);
  const isStart = isSameDay(start, date);
  const isEnd = isSameDay(end, date);
  let isInRange = false;
  if (start && end) {
    const day = startOfDay(date);
    isInRange = day > startOfDay(start) && day < startOfDay(end);
  }
  return { isSelected: isStart || isEnd, isStart, isEnd, isInRange };
}

/**
 * Pure transition: given the current value and an activated day, returns the
 * next value. Single mode always replaces the value; range mode starts a new
 * range once a full [start, end] pair (or a bare single click) is active, and
 * otherwise completes the pending range in chronological order.
 */
export function resolveDatePickerSelection(
  mode: DatePickerMode,
  value: Date | DateRange | null | undefined,
  date: Date,
): Date | DateRange {
  if (mode === 'single') return date;

  const [start, end] = asRange(value);
  if (!start || (start && end)) return [date, null];
  return date < start ? [date, start] : [start, date];
}

/**
 * Builds a fixed 6-week (42-day) calendar grid for `viewDate`'s month,
 * padded with the trailing days of the previous/next month.
 */
export function getCalendarWeeks(
  viewDate: Date,
  weekStartDay: number,
): CalendarDay[][] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysCount = daysInMonth(year, month);
  const startDay = new Date(year, month, 1).getDay();
  const startIndex = (startDay - weekStartDay + 7) % 7;

  const days: CalendarDay[] = [];

  const prevMonthDaysCount = daysInMonth(year, month - 1);
  for (let i = startIndex - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDaysCount - i),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysCount; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

/** Single-letter weekday header labels, ordered from `weekStartDay`. */
export function getWeekDayLabels(
  locale: string,
  weekStartDay: number,
): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const baseDate = new Date(2023, 0, 1 + weekStartDay);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() + i);
    return formatter.format(day).charAt(0).toUpperCase();
  });
}

/** Localized "Month YYYY" label for the header. */
export function formatMonthLabel(viewDate: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(viewDate);
}

/** Year list for the year picker, centered on `centerYear`. */
export function getYearRange(centerYear: number, span = 100): number[] {
  const start = centerYear - span;
  const end = centerYear + span;
  const years: number[] = [];
  for (let year = start; year <= end; year++) years.push(year);
  return years;
}
