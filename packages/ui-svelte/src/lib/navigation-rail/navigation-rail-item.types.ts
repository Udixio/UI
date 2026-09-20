import type {
  BadgeProps,
  ClassNameComponent,
  ElementClasses,
  Icon,
  NavigationRailItemInterface,
  NavigationRailItemProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLElement>, keyof NavigationRailItemProps | 'class' | 'children' | 'style' | 'onclick'>;

/**
 * A single destination inside a NavigationRail.
 *
 * @status beta
 * @parent NavigationRail
 * @devx Selection is index-based and resolved from the parent rail; standalone usage falls back to `selected`.
 * @a11y Exposes `aria-current="page"` when selected.
 * @limitations No arrow-key navigation between destinations.
 */
export interface SvelteNavigationRailItemProps extends Omit<NavigationRailItemProps, 'icon' | 'iconSelected'>, ForwardedAttributes {
  /** Classes merged onto the destination root. */
  class?: string;
  /** Inline style merged onto the destination root. */
  style?: string;
  /** State-aware classes for the destination elements. */
  classes?: ElementClasses<NavigationRailItemInterface> | ClassNameComponent<NavigationRailItemInterface>;
  /** String or snippet content used as the visible label. */
  children?: Snippet;
  /** Visible destination label. */
  label?: string;
  /** Icon shown while the destination is not selected. */
  icon?: Icon;
  /** Optional icon shown while the destination is selected. */
  iconSelected?: Icon;
  badge?: BadgeProps;
  /** Navigation destination; switches the inner element to a native link. */
  href?: string;
  /** Native activation handler. */
  onclick?: (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => void;
  /** Notifies activation of an already selected destination. */
  onItemSelected?: (event: { index: number; label?: string; icon?: Icon }) => void;
}
