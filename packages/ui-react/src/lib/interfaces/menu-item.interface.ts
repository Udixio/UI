
import { ComponentInterface } from '../utils/component';

export interface MenuItemInterface {
  label?: string; // Optional if using children
  children?: React.ReactNode;
  value: string | number;
  leadingIcon?: any;
  trailingIcon?: any;
  disabled?: boolean;
  subMenu?: React.ReactNode;
  selected?: boolean; // Injected by parent
  variant?: 'standard' | 'vibrant'; // Injected by parent
  onClick?: (e?: React.MouseEvent) => void;
  // ComponentInterface implementation
  type: 'div';
  props: {
    label?: string;
    value: string | number;
    leadingIcon?: any;
    trailingIcon?: any;
    disabled?: boolean;
    selected?: boolean;
    variant?: 'standard' | 'vibrant';
    onItemSelect?: (value: string | number) => void; // Injected
  };
  states: Record<string, any>;
  elements: ['item', 'selectedItem', 'itemLabel', 'itemIcon', 'leadingIcon', 'trailingIcon'];
}
