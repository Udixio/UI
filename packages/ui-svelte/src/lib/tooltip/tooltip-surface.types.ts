import type { AnchorPosition, TooltipProps } from '@udixio/core';
import type { Snippet } from 'svelte';
import type { TooltipButtonAction } from './tooltip.types';

/**
 * The floating panel a `tooltip` attachment owns.
 * @status beta
 * @category Communication
 * @devx
 * - Building block for the `tooltip` attachment, which mounts it; not meant
 *   to be placed in a template directly.
 * - Renders `title`/`text`/`buttons`, or `content` when a snippet is given.
 * @a11y
 * - Carries `role="tooltip"`, and hides itself with `aria-hidden` plus `inert`
 *   while closed.
 * @limitations
 * - Stays mounted while closed so it can animate out; expensive `content` is
 *   not torn down until the attachment is.
 */
export interface SvelteTooltipSurfaceProps {
  anchor: HTMLElement;
  surfaceId: string;
  position: AnchorPosition;
  title?: TooltipProps['title'];
  text?: TooltipProps['text'];
  buttons?: TooltipButtonAction | TooltipButtonAction[];
  content?: Snippet;
  isOpen: boolean;
  /** Resolved element classes; the attachment owns the style contract. */
  styles: Record<string, string>;
  /** Called when the pointer enters or leaves the panel. */
  onSurfaceHovered?: (hovered: boolean) => void;
}
