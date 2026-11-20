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
 * @devx Inactive panels stay in the DOM, hidden; pass `lazy` for heavy content that should mount only while the panel is selected.
 * @limitations A `lazy` panel unmounts when it stops being selected; its state is not kept.
 */
export interface SvelteTabPanelProps extends SharedTabPanelProps, ForwardedAttributes {
  /** Classes merged onto the panel root. */
  class?: string;
  /** Renders the content only while this panel is selected. By default every panel stays in the DOM, hidden while inactive. */
  lazy?: boolean;
  /** State-aware classes for the panel. */
  classes?: ElementClasses<TabPanelInterface> | ClassNameComponent<TabPanelInterface>;
  children?: Snippet;
}
