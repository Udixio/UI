import { useMemo, useState } from 'react';
import { useDatePickerStyle } from '../styles/date-picker.style';
import { classNames, ReactProps } from '../utils';
import {
  DatePickerInterface,
  DateRange,
} from '../interfaces/date-picker.interface';
import { Icon } from '../icon';
import { State } from '../effects';
import {
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from './Button';

/**
 * DatePickers let users select a date, or a range of dates.
 * @status beta
 * @category Selection
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
}: ReactProps<DatePickerInterface>) => {
  // State for the currently displayed month (always set to the 1st of the month)
  const [viewDate, setViewDate] = useState(() => {
    // Try to find a valid start date from value to focus
    const extractDate = (v: any): Date | null => {
      if (v instanceof Date) return v;
      if (Array.isArray(v) && v[0]) return v[0];
      return null;
    };
    const start =
      extractDate(valueProp) || extractDate(defaultValue) || new Date();
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });

  // State for selected date
  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState<Date | DateRange | null>(
    defaultValue || null,
  );
  const selectedValue = isControlled ? valueProp || null : internalValue;

  // Calendar generation logic
  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = new Date(year, month, 1).getDay(); // 0=Sun (Fixed JS getDay)

    // Adjust start index based on weekStartDay
    // shift: logic to map standard JS Day (0=Sun) to our week start
    // If weekStart=1 (Mon): Sun(0) -> 6, Mon(1) -> 0, Tue(2) -> 1
    const startIndex = (startDay - weekStartDay + 7) % 7;

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Prev month
    const prevMonthDaysCount = daysInMonth(year, month - 1);
    for (let i = startIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDaysCount - i),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= daysCount; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding
    const currentLen = days.length;
    const remaining = 7 - (currentLen % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }
    return days;
  }, [viewDate, weekStartDay]);

  // Formatters
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const weekDayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }),
    [locale],
  );

  const weekDays = useMemo(() => {
    const baseDate = new Date(2023, 0, 1 + weekStartDay); // Jan 1 2023 was Sun. Jan (1+1)=2 is Mon.
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      return weekDayFormatter.format(d).charAt(0).toUpperCase();
    });
  }, [weekDayFormatter, weekStartDay]);

  // Handlers
  const handlePrevMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const isSameDay = (d1: Date | null | undefined, d2: Date) => {
    if (!d1) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isToday = (date: Date) => isSameDay(new Date(), date);

  const handleDateClick = (date: Date) => {
    let newValue: Date | DateRange | null = date;

    if (mode === 'single') {
      newValue = date;
      // Single mode always sets date
    } else {
      // Range mode
      const current = selectedValue as DateRange | null;
      const [start, end] = Array.isArray(current) ? current : [null, null];

      if (!start || (start && end)) {
        // Start new range (if was simple date or full range)
        newValue = [date, null];
      } else {
        // Complete range
        if (date < start) {
          newValue = [date, start];
        } else {
          newValue = [start, date];
        }
      }
    }

    if (!isControlled) {
      setInternalValue(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
  };

  const checkSelection = (date: Date) => {
    if (mode === 'single') {
      return {
        isSelected: isSameDay(selectedValue as Date, date),
        isStart: false,
        isEnd: false,
        isInRange: false,
      };
    }
    const safeRange = Array.isArray(selectedValue)
      ? selectedValue
      : [selectedValue, null];
    const [start, end] = safeRange as DateRange;
    const isStart = isSameDay(start, date);
    const isEnd = isSameDay(end, date);

    // Check range
    let isInRange = false;
    if (start && end) {
      // Simple range check (ignore time components for safety)
      // Normalize to midnight for strict day comparison
      const s = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      ).getTime();
      const e = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
      ).getTime();
      const d = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ).getTime();
      isInRange = d > s && d < e;
    }

    return { isSelected: isStart || isEnd, isStart, isEnd, isInRange };
  };

  const styles = useDatePickerStyle({
    hasSelected: !!selectedValue,
  });

  return (
    <div
      className={classNames(styles.datePicker, className)}
      style={style}
      {...(restProps as any)}
    >
      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.monthNav}
          onClick={handlePrevMonth}
          type="button"
        >
          <State
            stateClassName="state-ripple-group-[nav-prev] rounded-full"
            colorName="on-surface-variant"
          />
          <Icon icon={faChevronLeft} className="w-5 h-5" />
        </button>
        <span className={styles.monthLabel}>
          {monthFormatter.format(viewDate)}
        </span>
        <button
          className={styles.monthNav}
          onClick={handleNextMonth}
          type="button"
        >
          <State
            stateClassName="state-ripple-group-[nav-next] rounded-full"
            colorName="on-surface-variant"
          />
          <Icon icon={faChevronRight} className="w-5 h-5" />
        </button>
      </div>

      {/* Week Days */}
      <div className={styles.weekDays}>
        {weekDays.map((day, i) => (
          <div key={i} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className={styles.daysGrid}>
        {calendarDays.map((item, index) => {
          const { isSelected, isStart, isEnd, isInRange } = checkSelection(
            item.date,
          );
          const isTodayDate = isToday(item.date);
          const isDisabled =
            (minDate && item.date < minDate) ||
            (maxDate && item.date > maxDate) ||
            shouldDisableDate?.(item.date);

          return (
            <div
              key={index}
              className={classNames(
                styles.dayCell,
                // Range background styles applied to the cell wrapper
                isInRange && 'bg-primary/20',
                isStart &&
                  (selectedValue as DateRange)?.[1] &&
                  'bg-gradient-to-r from-transparent to-primary/20',
                isEnd &&
                  (selectedValue as DateRange)?.[0] &&
                  'bg-gradient-to-l from-transparent to-primary/20',
              )}
            >
              <Button
                className={classNames('aspect-square h-[40px] p-0', {
                  'text-on-surface': !isSelected && !isTodayDate,
                })}
                size="small"
                allowShapeTransformation={false}
                variant={
                  classNames({
                    filled: isSelected,
                    outlined: isTodayDate,
                    text: !isSelected && !isTodayDate,
                  }) as any
                }
                label={item.date.getDate().toString()}
                onClick={() => handleDateClick(item.date)}
                disabled={isDisabled}
              >
                {item.date.getDate().toString()}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper for generic check - removed unused
