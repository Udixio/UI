import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  addMonthsClamped,
  classNames,
  type ButtonVariant,
  type DatePickerInterface,
  datePickerStyle,
  type DatePickerValue,
  type DateRange,
  formatMonthLabel,
  getCalendarWeeks,
  getDaySelectionState,
  getStartOfWeek,
  getWeekDayLabels,
  getYearRange,
  isDateDisabled,
  resolveDatePickerSelection,
  type ReactProps,
} from '@udixio/core';
import { createMonthTransitionController } from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iChevronLeft } from '@udixio/icons-rounded-400/chevron_left';
import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Icon } from '../icon';

export type ReactDatePickerProps = ReactProps<DatePickerInterface>;

export const useDatePickerStyle = createUseStyle(datePickerStyle);

function extractAnchorDate(value: DatePickerValue | undefined): Date | null {
  if (value instanceof Date) return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return null;
}

/**
 * DatePickers let users select a date, or a range of dates.
 * @status beta
 * @category Selection
 * @devx
 * - `mode="range"` discriminates `value`/`defaultValue`/`onChange` to `DateRange` at the type level; `mode="single"` (the default) discriminates them to `Date`.
 * - `value`/`onChange` are controlled; `defaultValue` initializes uncontrolled usage.
 * - `minDate`/`maxDate`/`shouldDisableDate` are compared at day granularity: a boundary carrying a time-of-day (e.g. `new Date()`) never disables its own day.
 * @a11y
 * - The day grid uses the composite `grid`/`row`/`gridcell` pattern with one roving `tabIndex` per visible month; Arrow keys move focus by day/week, Home/End jump to the visible week's boundaries, PageUp/PageDown change month (Shift for year).
 * - The selected day's `gridcell` carries `aria-selected`; its focusable day button carries `aria-current="date"` when it is today. Unavailable days stay focusable with `aria-disabled` instead of the native `disabled` attribute, so keyboard users can still traverse past them.
 * @limitations
 * - Does not render its own text input or popup positioning; combine with `TextField`/`IconButton` and your own overlay for a popup picker.
 * - The year picker view is a plain scrollable button list without virtualization.
 */
export const DatePicker = ({
  value: valueProp,
  defaultValue,
  onChange,
  minDate,
  maxDate,
  shouldDisableDate,
  locale = 'default',
  weekStartDay = 0,
  className,
  style,
  mode = 'single',
  ...restProps
}: ReactDatePickerProps) => {
  const [value, setValue] = useControllableState<DatePickerValue>({
    value: valueProp,
    defaultValue: defaultValue ?? null,
    onChange: onChange as (value: DatePickerValue) => void,
    componentName: 'DatePicker',
    stateName: 'value',
  });

  const [viewDate, setViewDate] = useState(() => {
    const anchor = extractAnchorDate(valueProp) ?? extractAnchorDate(defaultValue) ?? new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });
  const [focusedDate, setFocusedDate] = useState(
    () => extractAnchorDate(valueProp) ?? extractAnchorDate(defaultValue) ?? new Date(),
  );
  const [viewMode, setViewMode] = useState<'day' | 'year'>('day');
  const shouldFocusDayRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const yearsContainerRef = useRef<HTMLDivElement>(null);
  const weeksContainerRef = useRef<HTMLDivElement>(null);
  const monthTransitionRef =
    useRef<ReturnType<typeof createMonthTransitionController>>(null);
  const previousViewDateRef = useRef(viewDate);

  const weeks = useMemo(
    () => getCalendarWeeks(viewDate, weekStartDay),
    [viewDate, weekStartDay],
  );
  const weekDayLabels = useMemo(
    () => getWeekDayLabels(locale, weekStartDay),
    [locale, weekStartDay],
  );
  const monthLabel = useMemo(
    () => formatMonthLabel(viewDate, locale),
    [viewDate, locale],
  );
  const years = useMemo(() => getYearRange(new Date().getFullYear()), []);

  useEffect(() => {
    if (viewMode === 'year' && yearsContainerRef.current) {
      const selectedYearBtn = yearsContainerRef.current.querySelector(
        '[data-selected="true"]',
      );
      selectedYearBtn?.scrollIntoView({ block: 'center' });
    }
  }, [viewMode]);

  useEffect(() => {
    if (!shouldFocusDayRef.current) return;
    shouldFocusDayRef.current = false;
    const key = focusedDate.toDateString();
    const target = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-date="${key}"]`,
    );
    target?.focus();
  }, [focusedDate, viewDate]);

  useEffect(() => {
    if (!weeksContainerRef.current) return;
    const controller = createMonthTransitionController({
      container: weeksContainerRef.current,
    });
    monthTransitionRef.current = controller;
    return () => controller.destroy();
  }, []);

  useEffect(() => {
    const previous = previousViewDateRef.current;
    previousViewDateRef.current = viewDate;
    const direction =
      viewDate.getTime() === previous.getTime()
        ? 0
        : viewDate > previous
          ? 1
          : -1;
    monthTransitionRef.current?.play(direction);
  }, [viewDate]);

  const goToDate = (next: Date) => {
    shouldFocusDayRef.current = true;
    setFocusedDate(next);
    if (
      next.getFullYear() !== viewDate.getFullYear() ||
      next.getMonth() !== viewDate.getMonth()
    ) {
      setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const handlePrevMonth = () =>
    setViewDate((d) => addMonthsClamped(d, -1));
  const handleNextMonth = () =>
    setViewDate((d) => addMonthsClamped(d, 1));

  const handleYearSelect = (year: number) => {
    setViewDate((d) => new Date(year, d.getMonth(), 1));
    setViewMode('day');
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date, { minDate, maxDate, shouldDisableDate })) return;
    goToDate(date);
    setValue(resolveDatePickerSelection(mode, value, date));
  };

  const handleDayKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    date: Date,
  ) => {
    let next: Date | undefined;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(date, -1);
        break;
      case 'ArrowRight':
        next = addDays(date, 1);
        break;
      case 'ArrowUp':
        next = addDays(date, -7);
        break;
      case 'ArrowDown':
        next = addDays(date, 7);
        break;
      case 'Home':
        next = getStartOfWeek(date, weekStartDay);
        break;
      case 'End':
        next = addDays(getStartOfWeek(date, weekStartDay), 6);
        break;
      case 'PageUp':
        next = addMonthsClamped(date, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonthsClamped(date, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    goToDate(next);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const styles = useDatePickerStyle({
    mode,
    value: valueProp,
    defaultValue,
    onChange,
    minDate,
    maxDate,
    shouldDisableDate,
    locale,
    weekStartDay,
    hasSelected: value !== null,
    className,
    // `DatePickerProps` is a mode-discriminated union so consumers can't mix
    // `mode`/`value`/`onChange` shapes; the shared style-hook signature wants
    // one flat `props & states` bag, so the merged runtime state is widened
    // back for this call only. It is never a public contract.
  } as unknown as Parameters<typeof useDatePickerStyle>[0]);

  return (
    <div className={styles.datePicker} style={style} {...(restProps as object)}>
      <div className={styles.header}>
        <Button
          variant="text"
          edgeAligned={false}
          size="small"
          onClick={() => setViewMode((m) => (m === 'day' ? 'year' : 'day'))}
          aria-live="polite"
          className={classNames(
            styles.monthLabel,
            'hover:bg-surface-container-highest',
          )}
        >
          <span className="mr-2">
            {viewMode === 'day' ? monthLabel : viewDate.getFullYear()}
          </span>
          <Icon
            icon={iKeyboardArrowDown}
            className={classNames(
              'w-3 h-3 transition-transform duration-200',
              viewMode === 'year' && 'rotate-180',
            )}
          />
        </Button>

        {viewMode === 'day' && (
          <div className={styles.monthNav}>
            <IconButton
              size="xSmall"
              shapeFeedback="none"
              onClick={handlePrevMonth}
              icon={iChevronLeft}
              label="Previous month"
            />
            <IconButton
              size="xSmall"
              shapeFeedback="none"
              onClick={handleNextMonth}
              icon={iChevronRight}
              label="Next month"
            />
          </div>
        )}
      </div>

      {viewMode === 'year' ? (
        <div
          className="h-[280px] overflow-y-auto grid grid-cols-3 gap-2 p-2 scrollbar-hide"
          ref={yearsContainerRef}
        >
          {years.map((year) => (
            <Button
              size="small"
              key={year}
              variant={year === viewDate.getFullYear() ? 'filled' : 'text'}
              edgeAligned={false}
              onClick={() => handleYearSelect(year)}
              data-selected={year === viewDate.getFullYear()}
              className={classNames('!w-full', {
                'text-on-surface': year !== viewDate.getFullYear(),
              })}
              label={year.toString()}
            />
          ))}
        </div>
      ) : (
        <div
          role="grid"
          aria-label={monthLabel}
          className="flex flex-col gap-y-2"
          ref={gridRef}
        >
          <div role="row" className={styles.weekDays}>
            {weekDayLabels.map((day, i) => (
              <div key={i} role="columnheader" className={styles.weekDay}>
                {day}
              </div>
            ))}
          </div>

          <div role="rowgroup" ref={weeksContainerRef}>
            {weeks.map((week, weekIndex) => (
              <div role="row" className={styles.daysGrid} key={weekIndex}>
                {week.map((day, dayIndex) => {
                  if (!day.isCurrentMonth) {
                    return (
                      <div
                        key={dayIndex}
                        role="gridcell"
                        aria-hidden="true"
                        className={styles.dayCell}
                      />
                    );
                  }

                  const { isSelected, isStart, isEnd, isInRange } =
                    getDaySelectionState(mode, value, day.date);
                  const isTodayDate = isToday(day.date);
                  const isDisabledDay = isDateDisabled(day.date, {
                    minDate,
                    maxDate,
                    shouldDisableDate,
                  });
                  const isFocusTarget =
                    day.date.toDateString() === focusedDate.toDateString();
                  const variant: ButtonVariant = isSelected
                    ? 'filled'
                    : isTodayDate
                      ? 'outlined'
                      : 'text';

                  return (
                    <div
                      key={dayIndex}
                      role="gridcell"
                      aria-selected={isSelected}
                      className={classNames(
                        styles.dayCell,
                        isInRange && 'bg-primary/20',
                        isStart &&
                          (value as DateRange)?.[1] &&
                          'bg-gradient-to-r from-transparent to-primary/20',
                        isEnd &&
                          (value as DateRange)?.[0] &&
                          'bg-gradient-to-l from-transparent to-primary/20',
                      )}
                    >
                      <Button
                        className={() => ({
                          button: classNames(styles.dayButton, 'p-0', {
                            'text-on-surface': !isSelected && !isTodayDate,
                            'opacity-50': isDisabledDay,
                          }),
                          stateLayer: classNames({
                            '!bg-transparent': isDisabledDay,
                          }),
                        })}
                        size="small"
                        shapeFeedback="none"
                        variant={variant}
                        label={day.date.getDate().toString()}
                        onClick={() => handleDateClick(day.date)}
                        onKeyDown={(event) =>
                          handleDayKeyDown(event, day.date)
                        }
                        data-date={day.date.toDateString()}
                        tabIndex={isFocusTarget ? 0 : -1}
                        aria-current={isTodayDate ? 'date' : undefined}
                        aria-disabled={isDisabledDay || undefined}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
