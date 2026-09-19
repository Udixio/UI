import type {
  ClassNameComponent,
  ElementClasses,
  TextFieldInterface,
  TextFieldProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof TextFieldProps | 'class' | 'children' | 'style' | 'onfocus' | 'onblur'
>;

/**
 * Text fields let users enter text into a UI.
 *
 * @status beta
 * @category Input
 * @devx
 * - `value` is bindable (`bind:value`); `defaultValue` initializes uncontrolled
 *   usage. To reject a change, bind with a function binding whose setter decides.
 * - `multiline` switches to an auto-growing textarea.
 * - `type="select"` switches to a listbox populated by `options`.
 * - `type="date"` opens an internally positioned calendar surface and keeps the
 *   field directly typable as `YYYY-MM-DD`.
 * - `mask` transforms typed or pasted input on every keystroke. It defaults to
 *   the built-in date mask for `type="date"`.
 * - The outlined legend notch and multiline resize use the shared
 *   `@udixio/core/dom` controllers.
 * @a11y
 * - `aria-describedby` links supporting text/error to the input.
 * - `aria-invalid` reflects `errorText`.
 * - The date/select trailing affordance is a real keyboard-reachable button.
 * - Select options expose `listbox`/`option` semantics and the calendar exposes
 *   the shared `grid`/`gridcell` structure, a roving day focus, and a year view.
 * @limitations
 * - Svelte does not project React `MenuItem` children; use `options` for select mode.
 * - The date and select popup surfaces are owned by TextField rather than exported
 *   as standalone Svelte components.
 */
export interface SvelteTextFieldProps extends TextFieldProps, ForwardedAttributes {
  /** Classes applied to the field root, merged with the component's own classes. */
  class?: string;
  /** Inline styles applied to the field root. */
  style?: string;
  /** Static or state-aware classes for the component's internal elements. */
  classes?: ElementClasses<TextFieldInterface> | ClassNameComponent<TextFieldInterface>;
  /** Runs when the underlying input or textarea gains focus. */
  onfocus?: (event: FocusEvent) => void;
  /** Runs when the underlying input or textarea loses focus. */
  onblur?: (event: FocusEvent) => void;
  /** Native lower bound forwarded to a non-multiline input. */
  min?: number | string;
  /** Native upper bound forwarded to a non-multiline input. */
  max?: number | string;
  /** Native increment forwarded to a non-multiline input. */
  step?: number | string;
}
