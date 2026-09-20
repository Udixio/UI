import type { TabGroupInterface } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'>;

/**
 * TabGroup shares one selection between a Tabs tablist and its TabPanels.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx Wrap `Tabs` and `TabPanels`; `selectedTab` is bindable and `defaultSelectedTab` seeds uncontrolled use.
 * @a11y Renders no DOM element or ARIA role itself.
 * @limitations No URL/hash syncing or persistence is built in.
 */
export interface SvelteTabGroupProps extends Omit<TabGroupInterface['props'], never>, ForwardedAttributes {
  children?: Snippet;
  selectedTab?: number | null;
  defaultSelectedTab?: number | null;
  /** Notifies an accepted selected-tab transition. */
  onSelectedTabChange?: (index: number | null) => void;
}
