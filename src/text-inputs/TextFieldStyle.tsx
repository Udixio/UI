import {
  TextFieldConfigurableProps,
  TextFieldElement,
  TextFieldInternalState,
} from './TextField';
import { ClassNameComponent, StylesHelper } from '../utils';
import React from 'react';

export const TextFieldStyle: ClassNameComponent<
  TextFieldConfigurableProps & TextFieldInternalState,
  TextFieldElement
> = ({
  disabled,
  leadingIcon,
  trailingIcon,
  variant,
  errorText,
  isFocused,
  value,
  suffix,
}) => {
  return {
    textField: StylesHelper.classNames([
      {
        'opacity-[.38]': disabled,
      },
    ]),
    content: StylesHelper.classNames([
      'group relative  flex rounded-t items-center ',
      {
        'border-on-surface-variant':
          !errorText?.length && !isFocused && variant == 'filled',
        'border-outline':
          !errorText?.length && !isFocused && variant == 'outlined',
        'border-primary': !errorText?.length && isFocused,
        'border-error': !!errorText?.length,
      },
      { 'bg-on-surface/[0.04]': disabled },
      {
        applyWhen: variant == 'filled',
        styles: [
          'overflow-hidden border-b',
          { 'bg-surface-container-highest': !disabled },
        ],
      },
      { applyWhen: variant == 'outlined', styles: ['border'] },
    ]),
    stateLayer: StylesHelper.classNames([
      'absolute w-full h-full top-0 left-0',
      {
        hidden: variant == 'outlined',
      },
      {
        'group-state-on-surface': !disabled,
        'focus-state-on-surface': isFocused,
      },
    ]),
    label: StylesHelper.classNames([
      'inline-flex outline-none  whitespace-nowrap',
      { 'text-on-surface-variant': !disabled && !errorText?.length },
      { 'text-on-surface': disabled },
      { 'text-error': !!errorText?.length },
      { 'text-primary': !errorText?.length && isFocused },
      {
        applyWhen: !isFocused && !value?.length,
        styles: [''],
      },
      {
        applyWhen: isFocused || !!value?.length,
        styles: [''],
      },
    ]),
    input: StylesHelper.classNames([
      'w-full px-4 text-body-large bg-[inherit] outline-none autofill:transition-colors autofill:duration-[5000000ms]',
      {
        ' text-on-surface placeholder:text-on-surface-variant': !disabled,
        'placeholder:text-on-surface text-on-surface': disabled,
      },
      {
        'pr-0': !!suffix,
      },
      {
        applyWhen: variant == 'filled',
        styles: [' pb-2 pt-6'],
      },
      {
        applyWhen: variant == 'outlined',
        styles: ['py-4 relative z-10'],
      },
    ]),
    activeIndicator: StylesHelper.classNames([
      'absolute w-0 inset-x-0 border-rounded mx-auto bottom-0',
      {
        applyWhen: variant == 'filled',
        styles: [
          'h-[2px] transition-all duration-300',
          { 'bg-primary': !errorText?.length },
          { 'bg-error': !!errorText?.length },
          {
            applyWhen: isFocused,
            styles: ['!w-full'],
          },
        ],
      },
    ]),
    supportingText: StylesHelper.classNames([
      ' text-body-small px-4 pt-1',
      { 'text-on-surface-variant': !disabled && !errorText?.length },
      { 'text-on-surface': disabled },
      {
        applyWhen: isFocused,
        styles: ['!w-full'],
      },

      { 'text-error': !!errorText?.length },
    ]),
    leadingIcon: StylesHelper.classNames([
      'h-12 w-12 flex items-center justify-center',
      { 'cursor-text': !React.isValidElement(leadingIcon) },
    ]),
    trailingIcon: StylesHelper.classNames([
      'h-12 w-12 flex items-center justify-center',
      { 'cursor-text': !React.isValidElement(trailingIcon) },
    ]),
    suffix: StylesHelper.classNames([
      'text-on-surface-variant pl-0 pr-4',
      {
        applyWhen: variant == 'filled',
        styles: [' pb-2 pt-6'],
      },
      {
        applyWhen: variant == 'outlined',
        styles: ['py-4 relative z-10'],
      },
    ]),
  };
};
