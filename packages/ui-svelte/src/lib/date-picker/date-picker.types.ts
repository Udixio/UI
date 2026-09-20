import type {
  ClassNameComponent,
  DatePickerInterface,
  DatePickerValue,
  ElementClasses,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'style'>;

/**
 * DatePickers let users select a date, or a range of dates.
 *
 * @status beta
 * @category Selection
 * @devx `value` is bindable; `defaultValue` initializes uncontrolled use. Use `mode="range"` with a `[Date | null, Date | null]` value.
 * @a11y The day grid uses roving tabindex, keyboard day/month navigation, and `aria-disabled` for unavailable dates.
 * @limitations The picker does not render an input or popup; compose it with TextField and your own surface.
 */
export interface SvelteDatePickerProps extends ForwardedAttributes {
  mode?: 'single' | 'range';
  value?: DatePickerValue;
  defaultValue?: DatePickerValue;
  minDate?: Date;
  maxDate?: Date;
  shouldDisableDate?: (date: Date) => boolean;
  locale?: string;
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Classes merged onto the date-picker root. */
  class?: string;
  /** Inline style merged onto the date-picker root. */
  style?: string;
  /** State-aware classes for the calendar elements. */
  classes?: ElementClasses<DatePickerInterface> | ClassNameComponent<DatePickerInterface>;
  onChange?: (value: DatePickerValue) => void;
}
