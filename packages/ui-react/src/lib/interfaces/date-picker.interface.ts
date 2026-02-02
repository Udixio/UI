import React from 'react';

export type DateRange = [Date | null, Date | null];

type Props = {
  /**
   * Selection mode: 'single' for one date, 'range' for start/end period.
   * @default 'single'
   */
  mode?: 'single' | 'range';

  /**
   * The currently selected date(s).
   * Date for single mode, [start, end] tuple for range mode.
   */
  value?: Date | DateRange | null;
  
  /**
   * Default selected date(s) for uncontrolled usage.
   */
  defaultValue?: Date | DateRange | null;

  /**
   * Callback fired when selection changes.
   * Returns Date in single mode, DateRange in range mode.
   */
  onChange?: (value: any) => void;

  /**
   * Minimum selectable date.
   */
  minDate?: Date;

  /**
   * Maximum selectable date.
   */
  maxDate?: Date;

  /**
   * Disables specific dates.
   */
  shouldDisableDate?: (date: Date) => boolean;

  /**
   * Locale for formatting dates.
   */
  locale?: string;

  /**
   * First day of the week (0=Sunday, 1=Monday).
   * @default 0
   */
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  className?: string;
  style?: React.CSSProperties;
};

export type DatePickerStates = {
  // Can be expanded if we need specific state-driven styles exposed to the config
  hasSelected: boolean;
};

export interface DatePickerInterface {
  type: 'div';
  props: Props;
  states: DatePickerStates;
  elements: [
    'datePicker',
    'header',
    'monthNav',
    'monthLabel',
    'weekDays',
    'weekDay',
    'daysGrid',
    'dayCell',
    'dayButton', // The interactive part of the day
  ];
}
