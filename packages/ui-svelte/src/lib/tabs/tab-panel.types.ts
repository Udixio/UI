import type { ClassNameComponent, ElementClasses, TabPanelInterface } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof TabPanelInterface['props'] | 'class' | 'children'>;
type SharedTabPanelProps = TabPanelInterface['props'];

/**
 * A panel holding the content for one selected tab.
 * @status beta
 * @parent Tabs
 * @devx Place panels in `TabPanels` in the same order as their `Tab` components.
 * @a11y Exposes `tabpanel` semantics and is labelled by its selected tab.
 * @limitations Only the selected panel is mounted in the DOM.
 */
export interface SvelteTabPanelProps extends SharedTabPanelProps, ForwardedAttributes {
  /** Classes merged onto the panel root. */
  class?: string;
  /** State-aware classes for the panel. */
  classes?: ElementClasses<TabPanelInterface> | ClassNameComponent<TabPanelInterface>;
  children?: Snippet;
}
