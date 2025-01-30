import { ComponentProps } from '@utils/index';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import React from 'react';
import { IconButton } from '@components/action/icon-button';


export type TextFieldVariant = 'filled' | 'outlined';

export type TextFieldBaseProps = {
  placeholder?: string | null;
  name: string;
  label: string;
  disabled?: boolean;
  errorText?: string | null;
  supportingText?: string | null;
  trailingIcon?:
    | (React.ReactElement<typeof IconButton> | IconDefinition)
    | null;
  leadingIcon?: (React.ReactElement<typeof IconButton> | IconDefinition) | null;
  onChange?: ((value: string) => void) | null;
  showSupportingText?: boolean;
  suffix?: string | null;

  value: string;
  variant: TextFieldVariant;
  type: 'text' | 'password' | 'number';
  autoComplete: 'on' | 'off' | string;
  textLine: 'singleLine' | 'multiLine' | 'textAreas';
};
export type TextFieldStates = {
  isFocused: boolean;
  showErrorIcon: boolean;
  showSupportingText: boolean;
};
export type TextFieldElements =
  | 'textField'
  | 'content'
  | 'label'
  | 'input'
  | 'activeIndicator'
  | 'supportingText'
  | 'leadingIcon'
  | 'trailingIcon'
  | 'suffix'
  | 'stateLayer';

export type TextFieldElementType = 'div';

export type TextFieldProps = Omit<
  ComponentProps<
    TextFieldBaseProps,
    TextFieldStates,
    TextFieldElements,
    TextFieldElementType
  >,
  'onChange'
> &
  TextFieldBaseProps;
