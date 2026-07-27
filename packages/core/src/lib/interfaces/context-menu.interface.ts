import type { MenuProps } from './menu.interface';

export type ContextMenuProps = Pick<
  MenuProps,
  'variant' | 'accessibleLabel'
> & {
  /** Prevents pointer and keyboard context-menu activation. */
  disabled?: boolean;
  /** Notifies visibility changes caused by user interaction. */
  onOpenChange?: (open: boolean) => void;
};

export type ContextMenuStates = {
  /** Resolved visibility state. */
  isOpen: boolean;
};

export interface ContextMenuInterface {
  type: 'div';
  props: ContextMenuProps;
  states: ContextMenuStates;
  elements: ['root', 'trigger', 'anchor'];
}
