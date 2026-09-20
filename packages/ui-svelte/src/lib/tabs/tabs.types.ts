import type { ClassNameComponent, ElementClasses, TabsInterface, TabsVariant } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof TabsInterface['props'] | 'class' | 'children' | 'onkeydown'>;
type SharedTabsProps = TabsInterface['props'];

/**
 * Tabs organize content across different screens and views.
 * @status beta
 * @category Navigation
 * @devx Use `selectedTab`/`onSelectedTabChange` for controlled selection, or `defaultSelectedTab` for uncontrolled use. A TabGroup shares the selection with TabPanels.
 * @a11y Renders a tablist with roving tabindex and a shared sliding indicator.
 * @limitations Horizontal orientation only.
 */
export interface SvelteTabsProps extends SharedTabsProps, ForwardedAttributes {
  /** Classes merged onto the tablist root. */
  class?: string;
  /** State-aware classes for the tablist and indicator. */
  classes?: ElementClasses<TabsInterface> | ClassNameComponent<TabsInterface>;
  children?: Snippet;
  variant?: TabsVariant;
  selectedTab?: number | null;
  defaultSelectedTab?: number | null;
  /** Notifies an accepted selected-tab transition. */
  onSelectedTabChange?: (index: number | null) => void;
  /** Notifies the selected tab with its resolved index and metadata. */
  onTabSelected?: (event: { index: number; label?: string; icon?: unknown }) => void;
  /** Native keydown handler for tab navigation. */
  onkeydown?: (event: KeyboardEvent) => void;
}
