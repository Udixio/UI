import { Icon } from '../icon';
import type { ComponentMotion } from './motion.interface';

/**
 * Snackbars show short updates about app processes at the bottom of the
 * screen.
 */
export interface SnackbarProps {
  /** Message announced through the snackbar. */
  message: string;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Defaults to `true`. */
  defaultOpen?: boolean;
  /** Auto-dismiss delay in milliseconds. Omit to require an explicit close. */
  duration?: number;
  /** Icon for the built-in close button. */
  closeIcon?: Icon;
  /**
   * The motion of the open/close scale, shared by every framework. Defaults to the fast spatial spring; the opacity fades on the fast effects spring.
   */
  motion?: ComponentMotion;
}

export type SnackbarStates = {
  /** Computed open state (controlled value or internal state). */
  isOpen: boolean;
};

export interface SnackbarInterface {
  type: 'div';
  props: SnackbarProps;
  states: SnackbarStates;
  elements: ['snackbar', 'container', 'supportingText', 'icon'];
}
