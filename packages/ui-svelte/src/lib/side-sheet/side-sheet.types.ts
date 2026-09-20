import type { ClassNameComponent, ElementClasses, SideSheetInterface, SideSheetProps } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof SideSheetProps | 'class' | 'children' | 'style'>;

/**
 * Side sheets show secondary content anchored to the side of the screen.
 * @status beta
 * @category Layout
 * @devx `open` is bindable; `defaultOpen` initializes uncontrolled use. Modal sheets are moved to `container` or `document.body`.
 * @a11y Modal sheets trap focus, lock body scroll, close on Escape, and restore focus.
 * @limitations Children stay mounted while closed; width animation can be less smooth for very large panels.
 */
export interface SvelteSideSheetProps extends SideSheetProps, ForwardedAttributes {
  /** Classes merged onto the side-sheet root. */
  class?: string;
  /** Inline style merged onto the side-sheet root. */
  style?: string;
  /** State-aware classes for the panel, overlay, and content. */
  classes?: ElementClasses<SideSheetInterface> | ClassNameComponent<SideSheetInterface>;
  children?: Snippet;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  container?: Element | null;
}
