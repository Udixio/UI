import type { ClassNameComponent, ElementClasses, Icon, TabInterface } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLElement>, keyof TabInterface['props'] | 'class' | 'children' | 'onclick'>;
type SharedTabProps = TabInterface['props'];

/**
 * A single tab inside a Tabs tablist.
 * @status beta
 * @parent Tabs
 * @devx Selection is index-based and owned by the parent; there is no standalone selected prop.
 * @a11y Exposes roving tabindex and `aria-controls` when connected to TabPanels.
 * @limitations Horizontal layout only.
 */
export interface SvelteTabProps extends SharedTabProps, ForwardedAttributes {
  /** Classes merged onto the tab root. */
  class?: string;
  /** State-aware classes for the tab and its indicator content. */
  classes?: ElementClasses<TabInterface> | ClassNameComponent<TabInterface>;
  children?: Snippet;
  label?: string;
  icon?: Icon;
  disabled?: boolean;
  href?: string;
  /** Native activation handler. */
  onclick?: (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => void;
}
