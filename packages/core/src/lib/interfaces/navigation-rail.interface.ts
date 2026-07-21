import { Icon } from '../icon';

type MenuState = {
  icon: Icon;
  label: string;
};

type Props = {
  variant?: 'standard' | 'modal';
  /** Controlled index of the selected item. */
  selectedItem?: number | null;
  /** Controlled extended state of the rail. */
  extended?: boolean;
  onExtendedChange?: (extended: boolean) => void;
  alignment?: 'middle' | 'top';
  menu?: {
    closed: MenuState;
    opened: MenuState;
  };
};

export type NavigationRailStates = {
  /** Resolved extended state (controlled prop or internal state). */
  isExtended: boolean;
  /** Resolved selected index (controlled prop or internal state). */
  selectedIndex: number | null;
};

type Elements = ['navigationRail', 'header', 'menuIcon', 'segments'];

export interface NavigationRailInterface {
  type: 'div';
  props: Props;
  states: NavigationRailStates;
  elements: Elements;
}
