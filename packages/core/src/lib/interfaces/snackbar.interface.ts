import type { Transition } from 'motion';
import { Icon } from '../icon';

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
  /** Motion transition shared by every framework for the open/close height animation. */
  transition?: Transition;
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
