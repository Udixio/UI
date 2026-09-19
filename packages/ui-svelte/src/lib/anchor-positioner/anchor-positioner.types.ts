import type { AnchorPositionerProps } from '@udixio/core';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/**
 * Floats `children` next to an anchor element using native CSS Anchor
 * Positioning where supported, falling back to a `position: fixed` element
 * tracked against the anchor's rect. The positioning math is implemented
 * once in `@udixio/core/dom` and shared with the React and Angular adapters.
 * @status beta
 * @category Communication
 * @devx
 * - Internal building block for `tooltip`; not yet documented as a
 *   standalone public component.
 * - Portals `children` to `document.body`.
 * @a11y
 * - Renders no semantics of its own; the caller's content and the tooltip's
 *   own `role="tooltip"` carry accessibility meaning.
 * @limitations
 * - Falls back to tracking `getBoundingClientRect()` on scroll and resize
 *   in browsers without native CSS Anchor Positioning support.
 */
export interface SvelteAnchorPositionerProps
  extends AnchorPositionerProps,
    Omit<HTMLAttributes<HTMLDivElement>, keyof AnchorPositionerProps | 'children'> {
  /** The element the floating content is positioned relative to. */
  anchor: HTMLElement;
  children?: Snippet;
}
