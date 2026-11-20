import type { Icon } from '../icon';
import type { MenuItemVariant } from './menu-item.interface';

/** A menu item that opens a nested actions menu. */
export type MenuSubmenuProps = {
  /** Visible name for the submenu trigger. */
  label: string;
  /** Optional icon displayed before the trigger label. */
  leadingIcon?: Icon;
  /** Prevents opening the nested menu and removes the trigger from navigation. */
  disabled?: boolean;
  /** Overrides the color treatment inherited from the parent Menu. */
  variant?: MenuItemVariant;
  /** Accessible name for the nested menu; defaults to "{label} submenu". */
  accessibleLabel?: string;
  /** Renders the nested menu only while the submenu is open. By default it stays in the DOM, hidden, so its links are in the server HTML. */
  lazy?: boolean;
};

export interface MenuSubmenuInterface {
  type: 'div';
  props: MenuSubmenuProps;
  states: { isOpen: boolean };
  elements: ['menuSubmenu', 'submenuTrigger', 'submenuSurface'];
}
