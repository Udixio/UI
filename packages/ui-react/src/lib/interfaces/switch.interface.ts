import { Icon } from '../icon';

export interface SwitchInterface {
  type: 'div';
  props: {
    selected?: boolean;
    activeIcon?: Icon;
    inactiveIcon?: Icon;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
  };
  states: { isSelected: boolean };
  elements: ['switch', 'handleContainer', 'icon', 'handleStateLayer', 'handle'];
}
