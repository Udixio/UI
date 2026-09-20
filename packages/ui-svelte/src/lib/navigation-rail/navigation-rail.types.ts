import type {
  ClassNameComponent,
  ElementClasses,
  Icon,
  NavigationRailInterface,
  NavigationRailProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof NavigationRailProps | 'class' | 'children' | 'style'>;

/**
 * Navigation rails let people switch between UI views on mid-sized devices.
 *
 * @status beta
 * @category Navigation
 * @devx Project `NavigationRailItem`, `NavigationRailSection`, and optionally `fab`/`footer` snippets.
 * `selectedItem` and `extended` are bindable; the corresponding defaults seed uncontrolled use.
 * @a11y The menu toggle exposes its open/closed label; selected destinations expose `aria-current="page"`.
 * @limitations Keyboard roving navigation between destinations is not implemented.
 */
export interface SvelteNavigationRailProps extends NavigationRailProps, ForwardedAttributes {
  /** Classes merged onto the rail root. */
  class?: string;
  /** Inline style merged onto the rail root. */
  style?: string;
  /** State-aware classes for the rail elements. */
  classes?: ElementClasses<NavigationRailInterface> | ClassNameComponent<NavigationRailInterface>;
  children?: Snippet;
  /** Content rendered in the rail footer. */
  footer?: Snippet;
  /** Content rendered above the rail destinations. */
  fab?: Snippet;
  selectedItem?: number | null;
  /** Initial selected item for uncontrolled use. */
  defaultSelectedItem?: number | null;
  extended?: boolean;
  /** Notifies an accepted selected-item transition. */
  onSelectedItemChange?: (index: number | null) => void;
  /** Notifies activation of an already selected destination. */
  onItemSelected?: (event: { index: number; label?: string; icon?: Icon }) => void;
  /** Notifies an accepted extended-state transition. */
  onExtendedChange?: (extended: boolean) => void;
}
