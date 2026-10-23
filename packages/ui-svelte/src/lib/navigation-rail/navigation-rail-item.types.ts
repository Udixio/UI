import type {
  BadgeProps,
  ClassNameComponent,
  ElementClasses,
  Icon,
  NavigationRailItemInterface,
  NavigationRailItemProps,
} from '@udixio/core';
import type {
  HTMLAnchorAttributes,
  HTMLAttributes,
  HTMLButtonAttributes,
} from 'svelte/elements';
import type { Snippet } from 'svelte';

type CommonForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  keyof NavigationRailItemProps | 'class' | 'children' | 'style' | 'onclick'
>;

type SvelteNavigationRailItemCommonProps = Omit<
  NavigationRailItemProps,
  'icon' | 'iconSelected'
> &
  CommonForwardedAttributes & {
    /** Classes merged onto the destination root. */
    class?: string;
    /** Inline style merged onto the destination root. */
    style?: string;
    /** State-aware classes for the destination elements. */
    classes?:
      | ElementClasses<NavigationRailItemInterface>
      | ClassNameComponent<NavigationRailItemInterface>;
    /** String or snippet content used as the visible label. */
    children?: Snippet;
    /** Visible destination label. */
    label?: string;
    /** Icon shown while the destination is not selected. */
    icon?: Icon;
    /** Optional icon shown while the destination is selected. */
    iconSelected?: Icon;
    badge?: BadgeProps;
    /** Native activation handler. */
    onclick?: (
      event: MouseEvent & {
        currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement);
      },
    ) => void;
    /** Notifies activation of an already selected destination. */
    onItemSelected?: (event: { index: number; label?: string; icon?: Icon }) => void;
  };

type ButtonForwardedAttributes = Omit<
  HTMLButtonAttributes,
  keyof SvelteNavigationRailItemCommonProps | 'class' | 'children' | 'style' | 'form'
>;

type LinkForwardedAttributes = Omit<
  HTMLAnchorAttributes,
  keyof SvelteNavigationRailItemCommonProps | 'class' | 'children' | 'style' | 'href' | 'target' | 'rel'
>;

type SvelteNavigationRailItemActionProps =
  SvelteNavigationRailItemCommonProps &
    ButtonForwardedAttributes & {
      href?: undefined;
      target?: undefined;
      rel?: undefined;
      /** Id of an external `<form>` associated with the native button. */
      form?: HTMLButtonAttributes['form'];
    };

type SvelteNavigationRailItemLinkProps =
  SvelteNavigationRailItemCommonProps &
    LinkForwardedAttributes & {
      /** Navigation destination; switches the native element from button to link. */
      href: string;
      /** Native link browsing-context target. */
      target?: HTMLAnchorAttributes['target'];
      /** Native link relationship tokens. */
      rel?: string;
      /** Button-only attributes are not valid on a navigation link. */
      form?: never;
    };

/**
 * A single destination inside a NavigationRail.
 *
 * @status beta
 * @parent NavigationRail
 * @devx Selection is index-based and resolved from the parent rail; standalone usage falls back to `selected`.
 * @a11y Exposes `aria-current="page"` when selected.
 * @limitations No arrow-key navigation between destinations.
 */
export type SvelteNavigationRailItemProps =
  | SvelteNavigationRailItemActionProps
  | SvelteNavigationRailItemLinkProps;
