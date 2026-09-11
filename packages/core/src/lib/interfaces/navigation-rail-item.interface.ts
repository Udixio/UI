import { Icon } from '../icon';
import type { BadgeProps } from './badge.interface';

/**
 * Navigation rail items are the destinations a navigation rail switches
 * between.
 */
export type NavigationRailItemProps = {
  label?: string;
  icon: Icon;
  iconSelected: Icon;
  /**
   * A badge on the icon, the way Material 3 shows notifications on a
   * destination: `{}` is the small dot, `{ label: 3 }` the count. Material
   * recommends removing it once the destination has been viewed, which is
   * the caller's call -- pass `undefined` when the item is selected.
   */
  badge?: BadgeProps;
  /** Controlled selected state, used when no parent drives the selection. */
  selected?: boolean;
  /** Injected by the parent NavigationRail: layout direction of the item. */
  variant?: 'vertical' | 'horizontal';
  /** Injected by the parent NavigationRail: position of this item in the rail. */
  index?: number;
  /** Injected by the parent NavigationRail: index of the currently selected item. */
  selectedItem?: number | null;
  /** Injected by the parent NavigationRail: whether the rail is extended. */
  isExtended?: boolean;
  /** Injected by the parent NavigationRail: hide the item while the rail is collapsed. */
  extendedOnly?: boolean;
};

export type NavigationRailItemStates = {
  isSelected: boolean;
};

type Elements = [
  'navigationRailItem',
  'stateLayer',
  'icon',
  'label',
  'container',
];

export interface NavigationRailItemInterface {
  type: 'button';
  props: NavigationRailItemProps;
  states: NavigationRailItemStates;
  elements: Elements;
}
