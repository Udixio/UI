import { ActionOrLink } from '../utils/component';

type Props = {
  value: string | number;
  label?: string;
  children?: React.ReactNode;
  leadingIcon?: any;
  trailingIcon?: any;
  disabled?: boolean;
  selected?: boolean; // Injected by parent
  variant?: 'standard' | 'vibrant'; // Injected by parent
  onClick?: (e?: React.MouseEvent) => void;
  onItemSelect?: (value: string | number) => void; // Injected
};

type Elements = [
  'menuItem',
  'selectedItem',
  'itemLabel',
  'itemIcon',
  'leadingIcon',
  'trailingIcon',
];

export type MenuItemInterface = ActionOrLink<Props> & {
  states: Record<string, any>;
  elements: Elements;
};
