import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonthsClamped,
  formatMonthLabel,
  getCalendarWeeks,
  getDaySelectionState,
  getStartOfWeek,
  getWeekDayLabels,
  getYearRange,
  isDateDisabled,
  isSameDay,
  resolveDatePickerSelection,
} from './date-picker.behavior';

describe('isSameDay', () => {
  it('ignores time-of-day', () => {
    expect(isSameDay(new Date(2024, 0, 15, 8), new Date(2024, 0, 15, 23))).toBe(
      true,
    );
  });

  it('rejects a different day', () => {
    expect(isSameDay(new Date(2024, 0, 15), new Date(2024, 0, 16))).toBe(false);
  });

  it('rejects null/undefined', () => {
    expect(isSameDay(null, new Date())).toBe(false);
    expect(isSameDay(undefined, new Date())).toBe(false);
  });
});

describe('isDateDisabled', () => {
  it('does not disable the minDate day itself when minDate carries a time-of-day', () => {
    // Regression: `new Date()` (now) as minDate must not disable "today".
    const now = new Date(2024, 5, 10, 14, 30);
    const today = new Date(2024, 5, 10);
    expect(isDateDisabled(today, { minDate: now })).toBe(false);
  });

  it('disables a day before minDate', () => {
    const minDate = new Date(2024, 5, 10, 14, 30);
    const dayBefore = new Date(2024, 5, 9);
    expect(isDateDisabled(dayBefore, { minDate })).toBe(true);
  });

  it('does not disable the maxDate day itself when maxDate carries a time-of-day', () => {
    const maxDate = new Date(2024, 5, 20, 3, 0);
    const sameDay = new Date(2024, 5, 20);
    expect(isDateDisabled(sameDay, { maxDate })).toBe(false);
  });

  it('disables a day after maxDate', () => {
    const maxDate = new Date(2024, 5, 20, 3, 0);
    const dayAfter = new Date(2024, 5, 21);
    expect(isDateDisabled(dayAfter, { maxDate })).toBe(true);
  });

  it('applies shouldDisableDate', () => {
    const isWeekend = (date: Date) =>
      date.getDay() === 0 || date.getDay() === 6;
    expect(
      isDateDisabled(new Date(2024, 5, 15), { shouldDisableDate: isWeekend }),
    ).toBe(true);
    expect(
      isDateDisabled(new Date(2024, 5, 17), { shouldDisableDate: isWeekend }),
    ).toBe(false);
  });
});

describe('getDaySelectionState (single mode)', () => {
  it('marks only the selected day', () => {
    const selected = new Date(2024, 5, 15);
    expect(getDaySelectionState('single', selected, selected)).toEqual({
      isSelected: true,
      isStart: false,
      isEnd: false,
      isInRange: false,
    });
    expect(
      getDaySelectionState('single', selected, new Date(2024, 5, 16)),
    ).toEqual({
      isSelected: false,
      isStart: false,
      isEnd: false,
      isInRange: false,
    });
  });
});

describe('getDaySelectionState (range mode)', () => {
  const start = new Date(2024, 5, 10);
  const end = new Date(2024, 5, 20);

  it('marks the boundaries and the days strictly between them', () => {
    expect(getDaySelectionState('range', [start, end], start)).toEqual({
      isSelected: true,
      isStart: true,
      isEnd: false,
      isInRange: false,
    });
    expect(getDaySelectionState('range', [start, end], end)).toEqual({
      isSelected: true,
      isStart: false,
      isEnd: true,
      isInRange: false,
    });
    expect(
      getDaySelectionState('range', [start, end], new Date(2024, 5, 15)),
    ).toEqual({
      isSelected: false,
      isStart: false,
      isEnd: false,
      isInRange: true,
    });
  });

  it('reports no range while only a start is selected', () => {
    expect(getDaySelectionState('range', [start, null], end)).toEqual({
      isSelected: false,
      isStart: false,
      isEnd: false,
      isInRange: false,
    });
  });

  it('treats a non-array value as an empty range', () => {
    expect(getDaySelectionState('range', null, start)).toEqual({
      isSelected: false,
      isStart: false,
      isEnd: false,
      isInRange: false,
    });
  });
});

describe('resolveDatePickerSelection (single mode)', () => {
  it('always replaces the value with the activated day', () => {
    const date = new Date(2024, 5, 15);
    expect(
      resolveDatePickerSelection('single', new Date(2024, 0, 1), date),
    ).toBe(date);
  });
});

describe('resolveDatePickerSelection (range mode)', () => {
  it('starts a new range from an empty value', () => {
    const date = new Date(2024, 5, 10);
    expect(resolveDatePickerSelection('range', null, date)).toEqual([
      date,
      null,
    ]);
  });

  it('starts a new range once the previous one is complete', () => {
    const start = new Date(2024, 5, 10);
    const end = new Date(2024, 5, 20);
    const date = new Date(2024, 6, 1);
    expect(resolveDatePickerSelection('range', [start, end], date)).toEqual([
      date,
      null,
    ]);
  });

  it('completes the range in chronological order regardless of click order', () => {
    const start = new Date(2024, 5, 15);
    const earlier = new Date(2024, 5, 10);
    const later = new Date(2024, 5, 20);
    expect(resolveDatePickerSelection('range', [start, null], later)).toEqual([
      start,
      later,
    ]);
    expect(resolveDatePickerSelection('range', [start, null], earlier)).toEqual(
      [earlier, start],
    );
  });
});

describe('getCalendarWeeks', () => {
  it('returns 6 weeks of 7 days each', () => {
    const weeks = getCalendarWeeks(new Date(2024, 1, 1), 0);
    expect(weeks).toHaveLength(6);
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it('marks only the requested month as current', () => {
    const weeks = getCalendarWeeks(new Date(2024, 1, 1), 0);
    const flat = weeks.flat();
    const currentMonthDays = flat.filter((day) => day.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(29); // February 2024 (leap year)
    currentMonthDays.forEach((day) => expect(day.date.getMonth()).toBe(1));
  });

  it('shifts the leading offset with weekStartDay', () => {
    // June 1 2024 is a Saturday.
    const sundayStart = getCalendarWeeks(new Date(2024, 5, 1), 0)[0];
    const mondayStart = getCalendarWeeks(new Date(2024, 5, 1), 1)[0];
    expect(sundayStart[6].date.getDate()).toBe(1);
    expect(mondayStart[5].date.getDate()).toBe(1);
  });
});

describe('getWeekDayLabels', () => {
  it('returns 7 single-character labels starting from weekStartDay', () => {
    const labels = getWeekDayLabels('en-US', 1);
    expect(labels).toHaveLength(7);
    labels.forEach((label) => expect(label).toHaveLength(1));
  });
});

describe('formatMonthLabel', () => {
  it('formats month and year for the given locale', () => {
    expect(formatMonthLabel(new Date(2024, 0, 1), 'en-US')).toMatch(/2024/);
  });
});

describe('getYearRange', () => {
  it('centers the list on centerYear with the given span', () => {
    const years = getYearRange(2024, 2);
    expect(years).toEqual([2022, 2023, 2024, 2025, 2026]);
  });
});

describe('addDays', () => {
  it('adds and subtracts days across month/year boundaries', () => {
    expect(addDays(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 1));
    expect(addDays(new Date(2024, 0, 1), -1)).toEqual(new Date(2023, 11, 31));
  });
});

describe('addMonthsClamped', () => {
  it('adds whole months', () => {
    expect(addMonthsClamped(new Date(2024, 0, 15), 1)).toEqual(
      new Date(2024, 1, 15),
    );
  });

  it('clamps to the last day instead of rolling into the next month', () => {
    expect(addMonthsClamped(new Date(2024, 0, 31), 1)).toEqual(
      new Date(2024, 1, 29), // 2024 is a leap year
    );
  });

  it('crosses a year boundary', () => {
    expect(addMonthsClamped(new Date(2024, 11, 15), 1)).toEqual(
      new Date(2025, 0, 15),
    );
    expect(addMonthsClamped(new Date(2024, 0, 15), -1)).toEqual(
      new Date(2023, 11, 15),
    );
  });
});

describe('getStartOfWeek', () => {
  it('returns the same date when it is already the week start', () => {
    // June 10 2024 is a Monday.
    expect(getStartOfWeek(new Date(2024, 5, 10), 1)).toEqual(
      new Date(2024, 5, 10),
    );
  });

  it('walks back to the configured week start day', () => {
    // June 13 2024 is a Thursday.
    expect(getStartOfWeek(new Date(2024, 5, 13), 1)).toEqual(
      new Date(2024, 5, 10),
    );
    expect(getStartOfWeek(new Date(2024, 5, 13), 0)).toEqual(
      new Date(2024, 5, 9),
    );
  });
});
