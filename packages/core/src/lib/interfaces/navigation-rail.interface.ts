import { Icon } from '../icon';

export type NavigationRailMenuState = {
  icon: Icon;
  label: string;
};

export type NavigationRailProps = {
  /** Visual density of the rail; `modal` is meant for a temporary overlay presentation. */
  variant?: 'standard' | 'modal';
  /** Controlled index of the selected item. */
  selectedItem?: number | null;
  /** Controlled extended state of the rail. */
  extended?: boolean;
  /** Initial extended state when uncontrolled. */
  defaultExtended?: boolean;
  onExtendedChange?: (extended: boolean) => void;
  /** Vertical distribution of items: `top`-anchored or `middle` of the rail. */
  alignment?: 'middle' | 'top';
  /** Icon and label shown by the menu toggle button in each extended/closed state. */
  menu?: {
    closed: NavigationRailMenuState;
    opened: NavigationRailMenuState;
  };
};

export type NavigationRailStates = {
  /** Resolved extended state (controlled prop or internal state). */
  isExtended: boolean;
  /** Resolved selected index (controlled prop or internal state). */
  selectedIndex: number | null;
};

type Elements = ['navigationRail', 'header', 'menuIcon', 'segments', 'footer'];

export interface NavigationRailInterface {
  type: 'div';
  props: NavigationRailProps;
  states: NavigationRailStates;
  elements: Elements;
}
