import type { ClassNameComponent, ElementClasses, SnackbarInterface, SnackbarProps } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof SnackbarProps | 'class' | 'children' | 'style'>;

/**
 * Snackbars show a brief, non-blocking status message about an app process.
 * @status beta
 * @category Communication
 * @devx `open` is bindable; `defaultOpen` initializes uncontrolled use. `duration` auto-dismisses in milliseconds.
 * @a11y Renders a polite status live region and stays mounted while closed.
 * @limitations Queueing and positioning multiple snackbars remain the caller's responsibility.
 */
export interface SvelteSnackbarProps extends SnackbarProps, ForwardedAttributes {
  /** Classes merged onto the snackbar root. */
  class?: string;
  /** Inline style merged onto the snackbar root. */
  style?: string;
  /** State-aware classes for the snackbar elements. */
  classes?: ElementClasses<SnackbarInterface> | ClassNameComponent<SnackbarInterface>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
