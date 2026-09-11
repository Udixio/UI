import type { MenuVariant } from './menu.interface';

/**
 * Menu groups gather related choices under an optional label.
 */
export interface MenuGroupProps {
  /** Overrides the color treatment inherited from the parent Menu. */
  variant?: MenuVariant;
  /** Visible and accessible label for the group. */
  label?: string;
}

export interface MenuGroupInterface {
  type: 'div';
  props: MenuGroupProps;
  states: object;
  elements: ['menuGroup', 'groupLabel'];
}
