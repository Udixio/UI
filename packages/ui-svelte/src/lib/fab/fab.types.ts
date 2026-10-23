import type {
  ClassNameComponent,
  ElementClasses,
  FabInterface,
  FabProps,
} from '@udixio/core';
import type {
  HTMLAnchorAttributes,
  HTMLAttributes,
  HTMLButtonAttributes,
} from 'svelte/elements';

type CommonForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  keyof FabProps | 'class' | 'children' | 'onclick' | 'title'
>;

type ButtonForwardedAttributes = Omit<
  HTMLButtonAttributes,
  keyof FabProps | 'class' | 'children' | 'onclick' | 'title' | 'form'
>;

type LinkForwardedAttributes = Omit<
  HTMLAnchorAttributes,
  | keyof FabProps
  | 'class'
  | 'children'
  | 'onclick'
  | 'title'
  | 'href'
  | 'target'
  | 'rel'
  | 'type'
>;

interface SvelteFabCommonProps extends FabProps, CommonForwardedAttributes {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<FabInterface> | ClassNameComponent<FabInterface>;
  /** Optional native advisory title; it also supplies the compact tooltip fallback. */
  title?: string;
  /** Handles clicks accepted by the button or link interaction contract. */
  onclick?: (
    event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) },
  ) => void;
}

type SvelteFabActionProps = SvelteFabCommonProps &
  ButtonForwardedAttributes & {
    href?: undefined;
    target?: undefined;
    rel?: undefined;
    /** Native action button type. Only applies when rendered as `<button>`. */
    type?: 'button' | 'submit' | 'reset';
    /** Id of an external `<form>` associated with the native button. */
    form?: HTMLButtonAttributes['form'];
  };

type SvelteFabLinkProps = SvelteFabCommonProps &
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
 * Floating action buttons expose the primary action on a screen.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires `label` and `icon`; arbitrary children are not accepted.
 * - `type` defaults to `'button'` to prevent accidental form submissions.
 * - Shows `label` in a tooltip while compact; `tooltip` overrides or disables it.
 * - `extended` keeps the label mounted while the shared controller animates its
 *   width and opacity, so toggling the prop does not interrupt the exit state.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * - A compact fab names its icon in a tooltip on hover and focus, as Material 3 requires; it only
 *   describes the target when its text says something the accessible name does not.
 * @limitations
 * - No built-in positioning; placement is handled by layout.
 * - Disabled links are inert and removed from the tab order.
 */
export type SvelteFabProps = SvelteFabActionProps | SvelteFabLinkProps;
