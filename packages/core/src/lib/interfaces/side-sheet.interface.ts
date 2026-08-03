import type { Transition } from 'motion';
import { Icon } from '../icon';

export type SideSheetVariant = 'standard' | 'modal';

export type SideSheetPosition = 'left' | 'right';

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
  /** Motion transition shared by every framework for the open/close width and opacity animation. */
  transition?: Transition;
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
