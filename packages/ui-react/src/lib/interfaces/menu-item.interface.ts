import { ActionOrLink } from '../utils/component';

type Props = {
  label?: string;
  children?: React.ReactNode;
  leadingIcon?: any;
  trailingIcon?: any;
  disabled?: boolean;
  variant?: 'standard' | 'vibrant'; // Injected by parent
  onClick?: (e?: React.MouseEvent) => void;
  onToggle?: (activated: boolean) => void;
  activated?: boolean;
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
  states: {
    isActive: boolean;
  };
  elements: Elements;
};
