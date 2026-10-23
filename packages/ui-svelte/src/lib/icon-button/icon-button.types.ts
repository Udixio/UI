import type {
  ClassNameComponent,
  ElementClasses,
  IconButtonInterface,
  IconButtonProps,
} from '@udixio/core';
import type {
  HTMLAnchorAttributes,
  HTMLAttributes,
  HTMLButtonAttributes,
} from 'svelte/elements';

type CommonForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  keyof IconButtonProps | 'class' | 'children' | 'onclick' | 'title'
>;

type ButtonForwardedAttributes = Omit<
  HTMLButtonAttributes,
  keyof IconButtonProps | 'class' | 'children' | 'onclick' | 'title' | 'form'
>;

type LinkForwardedAttributes = Omit<
  HTMLAnchorAttributes,
  | keyof IconButtonProps
  | 'class'
  | 'children'
  | 'onclick'
  | 'title'
  | 'href'
  | 'target'
  | 'rel'
  | 'type'
>;

interface SvelteIconButtonCommonProps
  extends IconButtonProps, CommonForwardedAttributes {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?:
    | ElementClasses<IconButtonInterface>
    | ClassNameComponent<IconButtonInterface>;
  /** Notifies an accepted toggle-state request. */
  onPressedChange?: (pressed: boolean) => void;
  /** Native advisory title used as the tooltip fallback; it is not forwarded to the root. */
  title?: string;
  /** Handles clicks accepted by the button or link interaction contract. */
  onclick?: (
    event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) },
  ) => void;
}

type SvelteIconButtonActionProps = SvelteIconButtonCommonProps &
  ButtonForwardedAttributes & {
    href?: undefined;
    target?: undefined;
    rel?: undefined;
    /** The HTML button type attribute. Only applies when rendered as `<button>`. @default 'button' */
    type?: 'button' | 'submit' | 'reset';
    /** Id of an external `<form>` associated with the native button. */
    form?: HTMLButtonAttributes['form'];
  };

type SvelteIconButtonLinkProps = SvelteIconButtonCommonProps &
  LinkForwardedAttributes & {
    /** Navigation destination; switches the native element from button to link. */
    href: string;
    /** Native link browsing-context target. */
    target?: HTMLAnchorAttributes['target'];
    /** Native link relationship tokens. */
    rel?: string;
    /** Button-only attributes are not valid on a navigation link. */
    form?: never;
    type?: never;
  };

/**
 * Icon buttons expose a frequent action through one unambiguous icon.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires `label` and `icon`; arbitrary children are not accepted.
 * - Shows `label` in a tooltip by default; `tooltip` overrides or disables it.
 * - `stateColor` overrides the state-layer color when custom classes repaint the icon button.
 * - `pressed` is bindable (`bind:pressed`); `defaultPressed` initializes uncontrolled usage.
 * - `toggleable` enables `aria-pressed` and `onPressedChange` on action buttons.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * @limitations
 * - Disabled links are inert and removed from the tab order.
 * - Navigation links ignore toggle state; use `aria-current` for the current destination.
 */
export type SvelteIconButtonProps =
  | SvelteIconButtonActionProps
  | SvelteIconButtonLinkProps;
