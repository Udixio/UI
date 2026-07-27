import { Icon } from '../icon';
import type { MenuPurpose, MenuVariant } from './menu.interface';

export type MenuItemVariant = MenuVariant;
export type MenuItemSelectionType = 'none' | 'single' | 'multiple';

export type MenuItemProps = {
  /** Text label used when an adapter does not project custom content. */
  label?: string;
  /** Stable application value emitted or consumed by a parent selection surface. */
  value?: string | number;
  /** Optional icon displayed before the label. */
  leadingIcon?: Icon;
  /** Optional icon displayed after the label. */
  trailingIcon?: Icon;
  /** Prevents activation, selection changes, and keyboard focus. */
  disabled?: boolean;
  /** Overrides the color treatment inherited from the parent Menu. */
  variant?: MenuItemVariant;
  /** Declares whether the item is an action, radio-like choice, or checkbox-like choice. */
  selectionType?: MenuItemSelectionType;
  /** Controlled selection state. */
  selected?: boolean;
  /** Initial selection state when uncontrolled. */
  defaultSelected?: boolean;
  /** Notifies each accepted selection transition exactly once. */
  onSelectedChange?: (selected: boolean) => void;
};

export type MenuItemStates = {
  /** Resolved selection state. */
  isSelected: boolean;
  /** Semantic purpose inherited from the parent Menu. */
  purpose: MenuPurpose;
};

type Elements = [
  'menuItem',
  'selectedItem',
  'stateLayer',
  'itemLabel',
  'itemIcon',
  'leadingIcon',
  'trailingIcon',
];

export interface MenuItemInterface {
  type: 'button';
  props: MenuItemProps;
  states: MenuItemStates;
  elements: Elements;
}
