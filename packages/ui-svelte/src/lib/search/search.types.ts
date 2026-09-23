import type {
  ClassNameComponent,
  ElementClasses,
  SearchInterface,
  SearchProps,
} from '@udixio/core';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof SearchProps | 'class' | 'children' | 'style' | 'onclick' | 'onkeydown'
>;

/**
 * Search lets people enter a query and optionally browse projected results.
 *
 * @status beta
 * @category Input
 * @devx
 * - `query` and `expanded` are bindable; `defaultQuery` and `defaultExpanded` initialize uncontrolled use.
 * - Render result content as a snippet; give selectable children `role="option"` for the default listbox.
 * @a11y Renders a named search landmark and exposes combobox keyboard behavior when results exist.
 * @limitations Search does not filter data or own modal layout.
 */
export interface SvelteSearchProps extends SearchProps, ForwardedAttributes {
  /** Classes merged onto the search root. */
  class?: string;
  /** Inline style merged onto the search root. */
  style?: string;
  /** State-aware classes for the search elements. */
  classes?:
    ElementClasses<SearchInterface> | ClassNameComponent<SearchInterface>;
  children?: Snippet;
  /** Additional content rendered at the trailing edge of the input. */
  trailingActions?: Snippet;
  /** Optional non-interactive avatar rendered in one of the two trailing slots. */
  avatar?: Snippet;
  query?: string;
  expanded?: boolean;
  onQueryChange?: (query: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  onSearch?: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Native click handler for the search host. */
  onclick?: (event: MouseEvent) => void;
  /** Native keydown handler for the search host. */
  onkeydown?: (event: KeyboardEvent) => void;
  'aria-describedby'?: HTMLInputAttributes['aria-describedby'];
}
