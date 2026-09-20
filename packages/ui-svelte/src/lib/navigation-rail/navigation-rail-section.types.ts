import type { HTMLAttributes } from 'svelte/elements';

/**
 * A non-interactive label that groups the destinations following it.
 * @status beta
 * @parent NavigationRail
 * @devx Place the section between destination items to name the following group.
 * @a11y The section label is non-interactive and remains outside the destination focus order.
 * @limitations It does not alter selection or keyboard navigation.
 */
export interface SvelteNavigationRailSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  /** Visible grouping label. */
  label: string;
  /** Classes merged onto the section root. */
  class?: string;
}
