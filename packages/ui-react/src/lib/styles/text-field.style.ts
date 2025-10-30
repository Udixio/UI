import React from 'react';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';
import { TextFieldInterface } from '../interfaces';

const textFieldConfig: ClassNameComponent<TextFieldInterface> = ({
  disabled,
  leadingIcon,
  trailingIcon,
  variant,
  errorText,
  isFocused,
  value,
  suffix,
  textLine,
}) => ({
  textField: classNames({
    'opacity-[.38]': disabled,
  }),
  content: classNames(
    'group  transition-border duration-200 relative  flex  items-center ',
    { 'h-14': textLine == 'singleLine' },
    {
      'border-on-surface-variant':
        !errorText?.length && !isFocused && variant == 'filled',
      'border-outline':
        !errorText?.length && !isFocused && variant == 'outlined',
      'border-primary': !errorText?.length && isFocused,
      'border-error': !!errorText?.length,
    },
    { 'bg-on-surface/[0.04]': disabled },
    variant == 'filled' && [
      'rounded-t overflow-hidden border-b',
      { 'bg-surface-container-highest': !disabled },
    ],

    variant == 'outlined' && [
      'border rounded box-border',
      {
        'border-[3px]': isFocused,
      },
    ],
  ),
  stateLayer: classNames(
    'absolute -z-10 w-full h-full top-0 left-0',
    {
      hidden: variant == 'outlined',
    },
    {
      'group-state-on-surface': !disabled,
      'focus-state-on-surface': isFocused,
    },
  ),
  label: classNames(
    'inline-flex outline-none  whitespace-nowrap',
    { 'text-on-surface-variant': !disabled && !errorText?.length },
    { 'text-on-surface': disabled },
    { 'text-error': !!errorText?.length },
    { 'text-primary': !errorText?.length && isFocused },
  ),
  input: classNames(
    'w-full resize-none px-4 text-body-large bg-[inherit] outline-none autofill:transition-colors autofill:duration-[5000000ms]',
    {
      ' text-on-surface placeholder:text-on-surface-variant': !disabled,
      'placeholder:text-on-surface text-on-surface': disabled,
    },
    {
      'pr-0': !!suffix,
    },
    variant == 'filled' && ' pb-2 pt-6',
    variant == 'outlined' && 'py-4 relative z-10',
  ),
  activeIndicator: classNames(
    'absolute w-0 inset-x-0 border-rounded mx-auto bottom-0',
    variant == 'filled' && [
      'h-[2px] transition-all duration-300',
      { 'bg-primary': !errorText?.length },
      { 'bg-error': !!errorText?.length },
      { '!w-full': isFocused },
    ],
  ),
  supportingText: classNames(
    ' text-body-small px-4 pt-1',
    { 'text-on-surface-variant': !disabled && !errorText?.length },
    { 'text-on-surface': disabled },
    { '!w-full': isFocused },
    { 'text-error': !!errorText?.length },
  ),
  leadingIcon: classNames([
    'h-12 ml-3 flex items-center justify-center',
    { 'cursor-text': !React.isValidElement(leadingIcon) },
  ]),
  trailingIcon: classNames('h-12 w-12 flex items-center justify-center', {
    'cursor-text': !React.isValidElement(trailingIcon),
  }),
  suffix: classNames(
    'text-on-surface-variant pl-0 pr-4',
    variant == 'filled' && ' pb-2 pt-6',
    variant == 'outlined' && 'py-4 relative z-10',
  ),
});

export const textFieldStyle = defaultClassNames<TextFieldInterface>(
  'textField',
  textFieldConfig,
);

export const useTextFieldStyle = createUseClassNames<TextFieldInterface>(
  'textField',
  textFieldConfig,
);
