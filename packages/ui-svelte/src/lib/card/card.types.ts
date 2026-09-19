import type {
  CardInterface,
  CardProps,
  ClassNameComponent,
  ElementClasses,
} from '@udixio/core';
import type { Snippet } from 'svelte';
import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';

/**
 * Cards display content and actions about a single subject
 * @status stable
 * @category Layout
 * @devx
 * - `href` renders the card as a native link and always applies the interactive treatment.
 * - `interactive` without `href` renders `role="button"` with `tabindex="0"` and Enter/Space activation; provide the action with `onclick`.
 * @a11y
 * - Actionable cards are focusable, expose native link or button semantics, and show a visible focus outline.
 * - The accessible name of an actionable card comes from its content; keep meaningful text inside it.
 * @limitations
 * - No built-in header/actions slots; layout is fully custom via the `children` snippet.
 * - An actionable card is one action target: do not nest interactive elements inside it; compose inner controls in a non-interactive card instead.
 */
export interface SvelteCardProps
  extends CardProps,
    Omit<HTMLAttributes<HTMLElement>, keyof CardProps | 'class' | 'children'> {
  /** Custom card content; layout is fully owned by the consumer. */
  children?: Snippet;
  /** Classes applied to the root element, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<CardInterface> | ClassNameComponent<CardInterface>;
  /** Navigation destination; switches the native element from div to link. */
  href?: string;
  /** Native link browsing-context target. */
  target?: HTMLAnchorAttributes['target'];
  /** Native link relationship tokens. */
  rel?: string;
}
