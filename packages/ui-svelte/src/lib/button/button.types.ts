import type {
  ButtonInterface,
  ButtonProps,
  ClassNameComponent,
  ElementClasses,
} from '@udixio/core';
import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';

/**
 * Native attributes forwarded to the root element, which is a `button` or an
 * `a` depending on `href`; only the attributes both accept are exposed, plus
 * the link-only ones declared below.
 */
type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  keyof ButtonProps | 'class' | 'children' | 'onclick'
>;

/**
 * Buttons prompt most actions in a UI.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires exactly one visible-content source: `label` or the `children` snippet.
 * - Custom non-text children require an explicit accessible name such as `aria-label`.
 * - `pressed` is bindable (`bind:pressed`); `defaultPressed` initializes uncontrolled usage. To
 *   reject a change, bind with a function binding whose setter decides.
 * - `toggleable` enables `aria-pressed` and `onPressedChange` on action buttons.
 * - `type` defaults to `'button'` to prevent accidental form submits.
 * @a11y
 * - Uses native button/link semantics and preserves its accessible name while loading.
 * - Provides a 48px touch target and a visible `:focus-visible` outline.
 * @limitations
 * - When `href` is set with `disabled`, the link is made inert via `aria-disabled` and `tabindex="-1"`.
 * - Navigation links ignore toggle state; use `aria-current` for the current destination.
 */
export interface SvelteButtonProps extends Omit<ButtonProps, 'label'>, ForwardedAttributes {
  /** Visible text content. Ignored when `children` is provided. */
  label?: string;
  /** Custom visible content. Use `aria-label` when it has no accessible text. */
  children?: Snippet;
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<ButtonInterface> | ClassNameComponent<ButtonInterface>;
  /** Notifies an accepted toggle-state request. */
  onPressedChange?: (pressed: boolean) => void;
  /** Navigation destination; switches the native element from button to link. */
  href?: string;
  /** Native link browsing-context target. */
  target?: HTMLAnchorAttributes['target'];
  /** Native link relationship tokens. */
  rel?: string;
  /** Handles clicks accepted by the button or link interaction contract. */
  onclick?: (
    event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) },
  ) => void;
}
