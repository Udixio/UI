import { Icon } from '../icon';
import type { ComponentMotion } from './motion.interface';

export type SideSheetVariant = 'standard' | 'modal';

export type SideSheetPosition = 'left' | 'right';

/**
 * Side sheets show secondary content anchored to the side of the screen.
 */
export interface SideSheetProps {
  /** Rendering mode: `'standard'` for persistent layout chrome, `'modal'` for a dismissible overlay. */
  variant?: SideSheetVariant;
  /** Headline displayed in the side sheet header. */
  title?: string;
  /** Edge of the screen the panel is anchored to. */
  position?: SideSheetPosition;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Icon for the built-in close button. */
  closeIcon?: Icon;
  /**
   * Show the trailing divider. Defaults to `true` for the standard variant.
   * Ignored for `variant="modal"`, which never renders a divider.
   */
  divider?: boolean;
  /**
   * The motion of the open/close width; the backdrop fades on its own effects spring. Shared by every framework.
   * Defaults to the default spatial spring.
   */
  motion?: ComponentMotion;
}

export type SideSheetStates = {
  /** Computed open state (controlled value or internal state). */
  isOpen: boolean;
};

type Elements = [
  'sideSheet',
  'container',
  'title',
  'content',
  'header',
  'closeButton',
  'divider',
  'overlay',
];

export interface SideSheetInterface {
  type: 'div';
  props: SideSheetProps;
  states: SideSheetStates;
  elements: Elements;
}
