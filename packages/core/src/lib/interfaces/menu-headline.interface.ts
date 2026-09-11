import type { MenuVariant } from './menu.interface';

/**
 * A non-interactive visual heading inside a Menu.
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
