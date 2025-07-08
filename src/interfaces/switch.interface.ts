import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface SwitchInterface {
  type: 'div';
  props: {
    selected?: boolean;
    activeIcon?: IconDefinition;
    inactiveIcon?: IconDefinition;
    disabled?: boolean;
    onChange?: (checked: boolean) => void;
  };
  states: { isSelected: boolean };
  defaultProps: {};
  elements: ['switch', 'handleContainer', 'icon', 'handleStateLayer', 'handle'];
}
