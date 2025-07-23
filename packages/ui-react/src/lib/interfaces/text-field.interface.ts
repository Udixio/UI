import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import React from 'react';
import { IconButton } from '../components/IconButton';

export type TextFieldVariant = 'filled' | 'outlined';

type Props = {
  placeholder?: string;
  name: string;
  label: string;
  disabled?: boolean;
  errorText?: string | null;
  supportingText?: string;
  trailingIcon?: React.ReactElement<typeof IconButton> | IconDefinition;
  leadingIcon?: React.ReactElement<typeof IconButton> | IconDefinition;
  onChange?: (value: string) => void;
  showSupportingText?: boolean;
  suffix?: string;

  value: string;
  variant?: TextFieldVariant;
  type?: 'text' | 'password' | 'number';
  autoComplete?: 'on' | 'off' | string;
  textLine?: 'singleLine' | 'multiLine' | 'textAreas';
};
export type TextFieldStates = {
  isFocused: boolean;
  showErrorIcon: boolean;
  showSupportingText: boolean;
};

export interface TextFieldInterface {
  type: 'div';
  props: Props;
  states: TextFieldStates;
  elements: [
    'textField',
    'content',
    'label',
    'input',
    'activeIndicator',
    'supportingText',
    'leadingIcon',
    'trailingIcon',
    'suffix',
    'stateLayer',
  ];
}
