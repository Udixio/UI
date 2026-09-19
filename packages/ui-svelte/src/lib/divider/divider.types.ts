import type {
  ClassNameComponent,
  DividerInterface,
  DividerProps,
  ElementClasses,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

/**
 * Dividers are thin lines that group content in lists or other containers
 * @status beta
 * @category Layout
 * @devx
 * - Renders a semantic `<hr>`; use `orientation` for vertical dividers.
 * @a11y
 * - Renders a native `<hr>`, exposing the implicit `separator` role without extra ARIA.
 * - Sets `aria-orientation="vertical"` when `orientation="vertical"`, since the implicit default for `separator` is horizontal.
 * @limitations
 * - Purely decorative; there is no `decorative`/`aria-hidden` escape hatch, so every divider is announced as a separator to assistive technology.
 */
export interface SvelteDividerProps
  extends DividerProps,
    Omit<HTMLAttributes<HTMLHRElement>, keyof DividerProps | 'class' | 'children'> {
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<DividerInterface> | ClassNameComponent<DividerInterface>;
}
