import type { MenuVariant } from './menu.interface';

/**
 * Groups related menu items under an optional visible label.
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
