import { FabInterface } from './fab.interface';

export interface FabMenuInterface {
  type: 'div';
  props: FabInterface['props'] & {
    variant?: 'primary' | 'secondary' | 'tertiary';
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
  };
  elements: ['fabMenu', 'fab', 'actions', 'action'];
}
