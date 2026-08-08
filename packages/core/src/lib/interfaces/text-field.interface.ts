import { Icon } from '../icon';

export type TextFieldVariant = 'filled' | 'outlined';

export type TextFieldType =
  | 'text'
  | 'password'
  | 'number'
  | 'email'
  | 'tel'
  | 'url'
  | 'date'
  | 'select';

export type TextFieldOption = {
  /** Stable application value. */
  value: string | number;
  /** Visible option label. */
  label?: string;
  /** Renders a non-interactive divider or section headline instead of a selectable option. */
  type?: 'divider' | 'headline';
  /** Optional icon shown before the option label. */
  leadingIcon?: Icon;
  /** Optional icon shown after the option label. */
  trailingIcon?: Icon;
  /** Prevents selecting this option. */
  disabled?: boolean;
};

export type TextFieldProps = {
  /** Field label, floated above the value or notched into the outlined legend. */
  label: string;
  /** Visual style. @default 'filled' */
  variant?: TextFieldVariant;
  /**
   * Native input kind, or a UI mode: `'date'` opens a date picker and
   * `'select'` opens a menu of `options`.
   * @default 'text'
   */
  type?: TextFieldType;
  /** Switches to an auto-growing multiline textarea. @default false */
  multiline?: boolean;
  /** Controlled value. Providing it makes the field controlled for its lifetime. */
  value?: string;
  /** Initial value for uncontrolled usage. */
  defaultValue?: string;
  /** Called once for each accepted value transition. */
  onChange?: (value: string) => void;
  /** Prevents interaction and form submission. */
  disabled?: boolean;
  /** Name of the underlying form control. */
  name?: string;
  /** Id of the underlying form control. Auto-generated if not provided. */
  id?: string;
  /** Placeholder shown only while the field is focused and empty. */
  placeholder?: string;
  /** Native autocomplete hint. @default 'on' */
  autoComplete?: string;
  /** Focuses the field once, on mount. */
  autoFocus?: boolean;
  /** Fires when the underlying control gains focus. */
  onFocus?: () => void;
  /** Fires when the underlying control loses focus. */
  onBlur?: () => void;
  /** Optional icon shown before the value. */
  leadingIcon?: Icon;
  /**
   * Optional icon shown after the value. Defaults to a calendar indicator
   * for `type="date"` and a chevron indicator for `type="select"`.
   */
  trailingIcon?: Icon;
  /** Static text appended after the value, for example a unit. Hidden while an error icon is shown. */
  suffix?: string;
  /** Message shown below the field. */
  supportingText?: string;
  /** Error message. Also switches the field to its error color treatment and shows an error icon. */
  errorText?: string | null;
  /** Forces the supporting text row. @default computed from `errorText`/`supportingText` */
  showSupportingText?: boolean;
  /** Selectable options for `type="select"`. */
  options?: TextFieldOption[];
  /**
   * Transforms typed or pasted input into the value, on every keystroke --
   * for example inserting separators as digits accumulate, or rejecting
   * characters outside an expected format (a card number, a phone number,
   * an ID). Defaults to the built-in `YYYY-MM-DD` mask
   * (`sanitizeTextFieldDateInput`) for `type="date"`; unset for every other
   * type. Providing one for `type="date"` replaces the built-in mask.
   *
   * Must be idempotent (`mask(mask(x)) === mask(x)`): the field is
   * controlled, so `mask` receives its own previous output back as `raw` on
   * every subsequent keystroke. A literal you inject (a `+33` country code,
   * a fixed digit group) will be mistaken for freshly typed input on the
   * next call unless you strip it back out first -- inserted separators
   * that aren't valid data characters (a `-`, a space) don't need this,
   * since a naive filter already excludes them.
   */
  mask?: (raw: string) => string;
};

export type TextFieldStates = {
  /** The underlying control has focus, or an open date/select popover keeps the field visually focused. */
  isFocused: boolean;
  /** Resolved: an error icon replaces the trailing icon/suffix. */
  showErrorIcon: boolean;
  /** Resolved: whether the supporting text row is rendered. */
  hasSupportingText: boolean;
  /** Resolved: the label floats out of the value area instead of resting inside it. */
  isFloating: boolean;
};

export interface TextFieldInterface {
  type: 'div';
  props: TextFieldProps;
  states: TextFieldStates;
  elements: [
    'textField',
    'content',
    'label',
    'legend',
    'input',
    'activeIndicator',
    'supportingText',
    'leadingIcon',
    'trailingIcon',
    'suffix',
    'stateLayer',
  ];
}
