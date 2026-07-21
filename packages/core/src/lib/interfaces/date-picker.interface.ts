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
};

export type DatePickerStates = {
  /** Computed: whether a date (or range start) is currently selected. */
  hasSelected: boolean;
};

type Elements = [
  'datePicker',
  'header',
  'monthNav',
  'monthLabel',
  'weekDays',
  'weekDay',
  'daysGrid',
  'dayCell',
  'dayButton',
];

export interface DatePickerInterface {
  type: 'div';
  props: Props;
  states: DatePickerStates;
  elements: Elements;
}
