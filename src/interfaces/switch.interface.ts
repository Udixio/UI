import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Component } from '../utils/component';

export type SwitchInterface = Component<{
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
}>;
