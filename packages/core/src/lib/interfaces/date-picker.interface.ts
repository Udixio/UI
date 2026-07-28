export type DateRange = [Date | null, Date | null];

export type DatePickerSharedProps = {
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

export type DatePickerSingleProps = DatePickerSharedProps & {
  /**
   * Selects one date.
   * @default 'single'
   */
  mode?: 'single';

  /**
   * The currently selected date.
   */
  value?: Date | null;

  /**
   * Default selected date for uncontrolled usage.
   */
  defaultValue?: Date | null;

  /**
   * Called once for each accepted selection transition.
   */
  onChange?: (value: Date | null) => void;
};

export type DatePickerRangeProps = DatePickerSharedProps & {
  /**
   * Selects a start/end date period.
   */
  mode: 'range';

  /**
   * The currently selected [start, end] period.
   */
  value?: DateRange | null;

  /**
   * Default selected [start, end] period for uncontrolled usage.
   */
  defaultValue?: DateRange | null;

  /**
   * Called once for each accepted selection transition.
   */
  onChange?: (value: DateRange | null) => void;
};

/**
 * `mode` discriminates the shape of `value`/`defaultValue`/`onChange`: a
 * consumer cannot pass a `DateRange` under `mode="single"` or a `Date` under
 * `mode="range"` without a compile error.
 */
export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

/**
 * Runtime union of every value shape the component can carry, regardless of
 * `mode`. Framework adapters whose input model cannot express a discriminated
 * union (for example Angular's independent `input()` bindings) type their
 * `value`/`defaultValue` inputs with this alias instead.
 */
export type DatePickerValue = Date | DateRange | null;

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
  props: DatePickerProps;
  states: DatePickerStates;
  elements: Elements;
}
