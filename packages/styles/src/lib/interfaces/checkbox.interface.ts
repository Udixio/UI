import React from 'react';

type Props = {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  error?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  name?: string;
  id?: string;
  value?: string;
  style?: React.CSSProperties;
  className?: string;
};

export type CheckboxStates = {
  isChecked: boolean;
  isIndeterminate: boolean;
  isDisabled: boolean;
  isError: boolean;
  isFocused: boolean;
  isHovered: boolean;
};

export interface CheckboxInterface {
  type: 'div';
  props: Props;
  states: CheckboxStates;
  elements: [
    'checkbox',
    'input',
    'container',
    'box',
    'icon',
    'stateLayer',
    'ripple',
  ];
}
