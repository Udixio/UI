import type { MenuVariant } from './menu.interface';

/**
 * Menu headlines label a menu or one of its groups.
 */
export interface MenuHeadlineProps {
  /** Visible section heading. */
  label: string;
  /** Overrides the color treatment inherited from the parent Menu. */
  variant?: MenuVariant;
}

export interface MenuHeadlineInterface {
  type: 'div';
  props: MenuHeadlineProps;
  states: object;
  elements: ['headline'];
}
