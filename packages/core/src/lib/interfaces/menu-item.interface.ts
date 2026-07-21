import { Icon } from '../icon';

export type MenuItemVariant = 'standard' | 'vibrant';

type Props = {
  label?: string;
  leadingIcon?: Icon;
  trailingIcon?: Icon;
  disabled?: boolean;
  /** Injected by the parent menu. */
  variant?: MenuItemVariant;
  onToggle?: (activated: boolean) => void;
  activated?: boolean;
};

export type MenuItemStates = {
  isActive: boolean;
};

type Elements = [
  'menuItem',
  'selectedItem',
  'itemLabel',
  'itemIcon',
  'leadingIcon',
  'trailingIcon',
];

export interface MenuItemInterface {
  type: 'button';
  props: Props;
  states: MenuItemStates;
  elements: Elements;
}
