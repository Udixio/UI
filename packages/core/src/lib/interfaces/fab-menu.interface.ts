import { Icon } from '../icon';

export type FabMenuVariant = 'primary' | 'secondary' | 'tertiary';

type Props = {
  variant?: FabMenuVariant;
  label?: string;
  icon: Icon;
  size?: 'small' | 'medium' | 'large';
  extended?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type FabMenuStates = {
  isOpen: boolean;
};

export interface FabMenuInterface {
  type: 'div';
  props: Props;
  states: FabMenuStates;
  elements: ['fabMenu', 'fab', 'actions', 'action'];
}
