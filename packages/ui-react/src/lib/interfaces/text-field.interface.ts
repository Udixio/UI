import React from 'react';
import { IconButton } from '../components/IconButton';
import { Icon } from '../icon';

export type TextFieldVariant = 'filled' | 'outlined';

type Props = {
  placeholder?: string;
  name?: string;
  label: string;
  disabled?: boolean;
  errorText?: string | null;
  supportingText?: string;
  trailingIcon?: React.ReactElement<typeof IconButton> | Icon;
  leadingIcon?: React.ReactElement<typeof IconButton> | Icon;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  showSupportingText?: boolean;
  suffix?: string;

  value?: string;
  defaultValue?: string;
  id?: string;
  style?: React.CSSProperties;
  variant?: TextFieldVariant;
  type?: 'text' | 'password' | 'number' | 'date';
  autoComplete?: 'on' | 'off' | string;
  multiline?: boolean;
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
