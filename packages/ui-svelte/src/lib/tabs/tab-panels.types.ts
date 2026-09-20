import type { ClassNameComponent, ElementClasses, TabPanelsInterface } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof TabPanelsInterface['props'] | 'class' | 'children'>;
type SharedTabPanelsProps = TabPanelsInterface['props'];

/**
 * TabPanels hosts the panel belonging to the selected tab.
 * @status beta
 * @parent Tabs
 * @devx Wrap `TabPanel` children in the same order as the parent `Tabs`.
 * @a11y Provides the panel region's structural container without adding a competing role.
 * @limitations It must be used inside a `TabGroup` to connect panels to tabs.
 */
export interface SvelteTabPanelsProps extends SharedTabPanelsProps, ForwardedAttributes {
  /** Classes merged onto the panels root. */
  class?: string;
  /** State-aware classes for the panels container. */
  classes?: ElementClasses<TabPanelsInterface> | ClassNameComponent<TabPanelsInterface>;
  children?: Snippet;
}
