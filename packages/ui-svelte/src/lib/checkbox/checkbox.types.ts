import type {
  CheckboxInterface,
  CheckboxProps,
  ClassNameComponent,
  ElementClasses,
} from '@udixio/core';
import type { HTMLInputAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<
  HTMLInputAttributes,
  | keyof CheckboxProps
  | 'class'
  | 'children'
  | 'checked'
  | 'defaultChecked'
  | 'indeterminate'
  | 'id'
  | 'name'
  | 'value'
  | 'required'
  | 'disabled'
  | 'onchange'
  | 'onfocus'
  | 'onblur'
  | 'style'
>;

/**
 * Checkboxes let people select one or more independent options.
 *
 * @status beta
 * @category Selection
 * @devx
 * - `checked` is bindable (`bind:checked`); `defaultChecked` initializes uncontrolled use. To
 *   reject a change, bind with a function binding whose setter decides.
 * - `indeterminate` marks a parent option whose child selection is mixed without changing its
 *   checked value.
 * @a11y
 * - Renders a native checkbox with standard keyboard and form behavior, a 40px touch target, and
 *   the native mixed state.
 * - `invalid` sets `aria-invalid`; provide an accessible description with `aria-describedby` when
 *   explaining the error.
 * @limitations
 * - The component does not render a visible label; associate one with `id` and `<label for>`, or
 *   provide `aria-label`/`aria-labelledby`.
 */
export interface SvelteCheckboxProps extends CheckboxProps, ForwardedAttributes {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Inline styles applied to the root touch target. */
  style?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<CheckboxInterface> | ClassNameComponent<CheckboxInterface>;
  /** Notifies an accepted checked-state request. */
  onCheckedChange?: (checked: boolean) => void;
  /** Runs when the native checkbox receives focus. */
  onfocus?: (event: FocusEvent) => void;
  /** Runs when the native checkbox loses focus. */
  onblur?: (event: FocusEvent) => void;
}
