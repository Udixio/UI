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
}) => {
  return {
    textField: StylesHelper.classNames([
      {
        'opacity-[.38]': disabled,
      },
    ]),
    content: StylesHelper.classNames([
      'relative rounded-t',

      { 'bg-on-surface/[0.04]': disabled },
      {
        applyWhen: variant == 'filled',
        styles: [
          'overflow-hidden',
          { 'bg-surface-container-highest': !disabled },
        ],
      },
    ]),
    label: StylesHelper.classNames([
      'relative outline-none transition-all  flex items-center whitespace-nowrap',
      { 'text-on-surface-variant': !disabled && !errorText?.length },
      { 'text-on-surface': disabled },
      { 'text-error': !!errorText?.length },
      { 'text-primary': !errorText?.length && isFocused },
      {
        applyWhen: !isFocused && !value?.length,
        styles: [
          'max-w-0 -left-5 text-body-large top-2/4 translate-y-0',
          { 'cursor-text': !disabled },
        ],
      },
      {
        applyWhen: isFocused || !!value?.length,
        styles: [
          'max-w-full left-0 text-body-small top-0 ',
          { '-translate-y-2/4': variant == 'outlined' },
        ],
      },
      {
        applyWhen: variant == 'filled',
        styles: ['duration-300'],
      },
      {
        applyWhen: variant == 'outlined',
        styles: ['duration-500'],
      },
    ]),
    input: StylesHelper.classNames([
      'w-full text-body-large bg-[inherit] outline-none autofill:transition-colors autofill:duration-[5000000ms]',
      {
        ' text-on-surface-variant placeholder:text-on-surface-variant':
          !disabled,
        'placeholder:text-on-surface text-on-surface': disabled,
      },
      {
        'pl-4 ': !leadingIcon,
        'pl-12': !!leadingIcon,
        'pr-4 ': !trailingIcon,
        'pr-12': !!trailingIcon,
      },
      {
        applyWhen: variant == 'filled',
        styles: [
          'state-on-surface pb-2 pt-6',
          {
            'border-b-[1px]': variant == 'filled',
            'border-on-surface-variant': !errorText?.length && !isFocused,
            'border-primary': !errorText?.length && isFocused,
          },
          { 'border-error': !!errorText?.length },
        ],
      },
      {
        applyWhen: variant == 'outlined',
        styles: ['py-4 relative z-10'],
      },
    ]),
    activeIndicator: StylesHelper.classNames([
      ' absolute w-0 inset-x-0 border-rounded mx-auto  bottom-0 active-indicator  ',
      {
        applyWhen: variant == 'filled',
        styles: [
          'h-[3px] transition-all duration-500',
          { 'bg-primary': !errorText?.length },
          { 'bg-error': !!errorText?.length },
          {
            applyWhen: isFocused,
            styles: ['!w-full'],
          },
        ],
      },
      {
        applyWhen: variant == 'outlined',
        styles: [
          'border-[1px] border-t-0 h-1/2 w-full rounded-b border-outline transition-all duration-500',
          // "before:transition-all before:duration-100 before:absolute before:border-r-0 before:border-outline before:border-b-0 before:w-8 before:h-full before:rounded-tl before:border-[1px] before:left-[-1px] before:bottom-full before:content-['']",
          // "after:transition-all after:duration-100 after:absolute after:border-l-0 after:border-outline after:border-b-0 after:w-[calc(100%-32px)] after:h-full after:rounded-tr after:border-[1px] after:right-[-1px] after:bottom-full after:content-['']",

          { '!border-error': !!errorText?.length },
          {
            applyWhen: isFocused,
            styles: [
              'border-primary border-[3px]',
              // 'before:left-[-3px] before:w-3 before:!border-primary before:border-primary before:border-[3px]',
            ],
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
      'z-20 absolute top-2/4 -translate-y-2/4 left-0 h-12 w-12 flex items-center justify-center',
      { 'cursor-text': !React.isValidElement(leadingIcon) },
    ]),
    trailingIcon: StylesHelper.classNames([
      'z-20 absolute top-2/4 -translate-y-2/4 right-0 h-12 w-12 flex items-center justify-center',
      { 'cursor-text': !React.isValidElement(trailingIcon) },
    ]),
    suffix: StylesHelper.classNames([
      'z-20 absolute top-2/4 -translate-y-2/4 right-0 h-12 w-12 flex items-center justify-center text-on-surface-variant',
    ]),
  };
};
