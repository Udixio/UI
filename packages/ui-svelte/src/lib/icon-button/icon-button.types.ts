import type {
  ClassNameComponent,
  ElementClasses,
  IconButtonInterface,
  IconButtonProps,
} from '@udixio/core';
import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  keyof IconButtonProps | 'class' | 'children' | 'onclick'
>;

/**
 * Icon buttons expose a frequent action through one unambiguous icon.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires `label` and `icon`; arbitrary children are not accepted.
 * - Shows `label` in a tooltip by default; `tooltip` overrides or disables it.
 * - `pressed` is bindable (`bind:pressed`); `defaultPressed` initializes uncontrolled usage.
 * - `toggleable` enables `aria-pressed` and `onPressedChange` on action buttons.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * @limitations
 * - Disabled links are inert and removed from the tab order.
 * - Navigation links ignore toggle state; use `aria-current` for the current destination.
 */
export interface SvelteIconButtonProps extends IconButtonProps, ForwardedAttributes {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<IconButtonInterface> | ClassNameComponent<IconButtonInterface>;
  /** Notifies an accepted toggle-state request. */
  onPressedChange?: (pressed: boolean) => void;
  /** Navigation destination; switches the native element from button to link. */
  href?: string;
  /** Native link browsing-context target. */
  target?: HTMLAnchorAttributes['target'];
  /** Native link relationship tokens. */
  rel?: string;
  /** The HTML button type attribute. Only applies when rendered as `<button>`. @default 'button' */
  type?: 'button' | 'submit' | 'reset';
  /** Handles clicks accepted by the button or link interaction contract. */
  onclick?: (
    event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) },
  ) => void;
}
