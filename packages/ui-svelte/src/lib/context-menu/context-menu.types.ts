import type { ContextMenuProps, MenuVariant } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof ContextMenuProps | 'class' | 'children'>;

/**
 * Opens a Menu at the pointer or keyboard context-menu position.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Provide `trigger` and Menu-family content snippets.
 * @a11y Supports native context-menu events and Shift+F10, focuses the first item, and restores focus after Escape.
 * @limitations Popup positioning is internally owned and not controllable.
 */
export interface SvelteContextMenuProps extends ContextMenuProps, ForwardedAttributes {
  /** Classes merged onto the context-menu host. */
  class?: string;
  /** Snippet rendered as the context-menu trigger. */
  trigger?: Snippet;
  /** Snippet rendered as the popup content. */
  children?: Snippet;
  /** Visual color treatment shared by the menu family. */
  variant?: MenuVariant;
  /** Notifies visibility changes caused by user interaction. */
  onOpenChange?: (open: boolean) => void;
}
