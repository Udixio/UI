import type {
  ClassNameComponent,
  ElementClasses,
  TooltipInterface,
  TooltipProps,
} from '@udixio/core';
import type { Snippet } from 'svelte';

export interface TooltipButtonAction {
  label: string;
  onclick?: () => void;
}

/**
 * Tooltips display brief labels or messages
 * @status beta
 * @category Communication
 * @devx
 * - Attach it to the trigger: `<Button label="Copy" {@attach tooltip(() => ({ text: 'Copy' }))} />`.
 *   The options are read through a function so a change updates the open
 *   tooltip in place instead of tearing it down.
 * - `content` (a snippet) overrides `title`/`text`/`buttons` for fully custom content.
 * - Supports controlled `open` plus `openDelay`/`closeDelay`; the owner updates
 *   `open` from `onOpenChange`.
 * - A touch long press opens after 500ms and remains visible for 1.5s after
 *   release, following Material 3 guidance.
 * - Opening one tooltip closes the currently visible tooltip in the document.
 * - The open/close opacity/height transition is implemented once with
 *   Anime.js in `@udixio/core/dom`, so every adapter shares the same timing,
 *   reduced-motion behavior, and cleanup.
 * - The tooltip surface stays mounted at all times (hidden via `inert` and
 *   `aria-hidden`) rather than mounting only while open, so it can animate
 *   out.
 * @a11y
 * - Provides `role="tooltip"` and `aria-describedby` on the trigger when open.
 * @limitations
 * - The surface stays mounted while closed, since it is always present for
 *   its open/close animation; expensive `content` is not torn down until the
 *   trigger element is.
 * - `position` falls back to tracking `getBoundingClientRect()` on scroll and
 *   resize in browsers without native CSS Anchor Positioning support.
 */
export interface SvelteTooltipProps extends TooltipProps {
  /** `'plain'` is a small text bubble; `'rich'` is a card-like surface. @default 'plain' */
  variant?: TooltipProps['variant'];
  /** Placement relative to the trigger. Defaults to `bottom-right` for `rich`. @default 'bottom' */
  position?: TooltipProps['position'];
  /** Interaction(s) that open the tooltip. @default ['hover', 'focus'] */
  trigger?: TooltipProps['trigger'];
  /** Delay in milliseconds before showing the tooltip. @default 400 */
  openDelay?: number;
  /** Delay in milliseconds before hiding the tooltip. @default 150 */
  closeDelay?: number;
  /** Initial open state when `open` is not controlled. @default false */
  defaultOpen?: boolean;
  /** Custom content snippet that replaces title/text/buttons when provided. */
  content?: Snippet;
  /** Small text-variant action button(s) in the built-in rich layout. */
  buttons?: TooltipButtonAction | TooltipButtonAction[];
  /** Custom anchor for positioning. Defaults to the trigger element. */
  anchor?: HTMLElement;
  /** Notifies an accepted open-state request. */
  onOpenChange?: (open: boolean) => void;
  /** Classes applied to the surface root, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the surface's internal elements, keyed by element name. */
  classes?: ElementClasses<TooltipInterface> | ClassNameComponent<TooltipInterface>;
}
