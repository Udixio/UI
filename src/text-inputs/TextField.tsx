import { StylingHelper } from '../utils';
import React, { useEffect, useState } from 'react';
import { IconButton } from '../button';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Icon } from '../icon';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

export type TextFieldVariant = 'filled' | 'outlined';

export interface TextFieldProps {
  variant?: TextFieldVariant;
  placeholder: string;
  value?: string;
  name: string;
  label: string;
  enabled?: boolean;
  className?: string;
  contentClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  activeIndicatorClassName?: string;
  supportingTextClassName?: string;
  errorText?: string;
  supportingText?: string;
  trailingIconClassName?: string;
  trailingIcon?: React.ReactElement<typeof IconButton> | IconDefinition;
  leadingIconClassName?: string;
  leadingIcon?: React.ReactElement<typeof IconButton> | IconDefinition;
  type: 'text' | 'password' | 'number';
  onChange?: (value: string) => void;
}

export const TextField: React.FC<TextFieldProps> = (args: TextFieldProps) => {
  const {
    variant = 'filled',
    enabled = true,
    errorText,
    placeholder,
    name,
    inputClassName,
    label,
    labelClassName,
    activeIndicatorClassName,
    className,
    supportingTextClassName,
    trailingIcon,
    trailingIconClassName,
    leadingIcon,
    leadingIconClassName,
    supportingText,
    type = 'text',
  } = args;

  const [value, setValue] = useState(args.value); // Déclare un nouvel état 'value'
  const [isFocused, setIsFocused] = useState(false);
  const [showErrorIcon, setShowErrorIcon] = useState(false);

  useEffect(() => {
    if (errorText) {
      setShowErrorIcon(true);
    }
  }, [errorText]);

  useEffect(() => {
    if (isFocused) {
      setShowErrorIcon(false);
    }
  }, [isFocused]);

  const inputRef = React.useRef<HTMLInputElement>(null);

  const focusInput = () => {
    if (inputRef.current && !isFocused) {
      inputRef.current.focus();
    }
  };

  const handleOnFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue); // Update local state

    // If external onChange prop is provided, call it with the new value
    if (typeof args.onChange === 'function') {
      args.onChange(newValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const textFieldClass = StylingHelper.classNames([
    className,
    'text-field ',
    {
      'opacity-[.38]': !enabled,
    },
  ]);

  const contentClass = StylingHelper.classNames([
    inputClassName,
    'content  relative rounded-t',

    { 'bg-on-surface/[0.04]': !enabled },
    {
      applyWhen: variant == 'filled',
      styles: ['overflow-hidden', { 'bg-surface-container-highest': enabled }],
    },
  ]);

  const labelClass = StylingHelper.classNames([
    labelClassName,
    'label relative outline-none transition-all  flex items-center whitespace-nowrap',
    { 'text-on-surface-variant': enabled && !errorText?.length },
    { 'text-on-surface': !enabled },
    { 'text-error': !!errorText?.length },
    { 'text-primary': !errorText?.length && isFocused },
    {
      applyWhen: !isFocused && !value?.length,
      styles: [
        'max-w-0 -left-5 text-body-large top-2/4 translate-y-0',
        { 'cursor-text': enabled },
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
  ]);

  const inputClass = StylingHelper.classNames([
    inputClassName,
    'input text-body-large bg-[inherit] outline-none',
    {
      ' text-on-surface-variant placeholder:text-on-surface-variant': enabled,
      'placeholder:text-on-surface text-on-surface': !enabled,
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
      styles: ['py-4'],
    },
  ]);
  const activeIndicatorClass = StylingHelper.classNames([
    activeIndicatorClassName,
    'active-indicator absolute w-0 inset-x-0 border-rounded mx-auto  bottom-0 active-indicator  ',
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
        'border-[1px] border-t-0 h-1/2 w-full -z-10 rounded-b border-outline transition-all duration-500',
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
  ]);
  const supportingTextClass = StylingHelper.classNames([
    supportingTextClassName,
    'text-body-small px-4 pt-1',
    { 'text-on-surface-variant': enabled && !errorText?.length },
    { 'text-on-surface': !enabled },
    {
      applyWhen: isFocused,
      styles: ['!w-full'],
    },
    { 'text-error': !!errorText?.length },
  ]);

  const leadingIconClass = StylingHelper.classNames([
    leadingIconClassName,
    'absolute top-2/4 -translate-y-2/4 left-0 h-12 w-12 flex items-center justify-center',
    { 'cursor-text': !React.isValidElement(leadingIcon) },
  ]);

  const trailingIconClass = StylingHelper.classNames([
    trailingIconClassName,
    'absolute top-2/4 -translate-y-2/4 right-0 h-12 w-12 flex items-center justify-center',
    { 'cursor-text': !React.isValidElement(trailingIcon) },
  ]);

  return (
    <div className={textFieldClass}>
      <div className={contentClass}>
        {leadingIcon && (
          <div
            className={leadingIconClass}
            onClick={() => {
              !React.isValidElement(leadingIcon) && focusInput();
            }}
          >
            {React.isValidElement(leadingIcon) ? (
              leadingIcon
            ) : (
              <Icon className={'h-5'} icon={leadingIcon}></Icon>
            )}
          </div>
        )}
        <div
          className={StylingHelper.classNames([
            'flex transition-all duration-500  absolute w-full  h-1/2',

            {
              applyWhen: variant == 'outlined',
              styles: [
                '-z-10',
                {
                  'gap-x-0': !isFocused && !value?.length,
                  'gap-x-1': isFocused || !!value?.length,
                },
              ],
            },
          ])}
        >
          <div
            className={StylingHelper.classNames([
              'active-indicator transition-all border-r-0 border-outline border-b-0  h-full rounded-tl border-[1px] left-0 top-0',
              {
                '!border-error': !!errorText?.length,
                'border-primary border-[3px]': isFocused,
              },
              {
                applyWhen: !leadingIcon,
                styles: [{ 'w-8': !isFocused && !value?.length }],
              },
              {
                applyWhen: !!leadingIcon,
                styles: [{ 'w-[68px]': !isFocused && !value?.length }],
              },
              {
                applyWhen: variant == 'filled',
                styles: [
                  'duration-300 invisible',
                  { 'w-4': (isFocused || !!value?.length) && !leadingIcon },
                  { 'w-12': (isFocused || !!value?.length) && !!leadingIcon },
                ],
              },
              {
                applyWhen: variant == 'outlined',
                styles: [
                  'duration-500 ',
                  { 'w-3': isFocused || !!value?.length },
                ],
              },
            ])}
          ></div>
          <label htmlFor={name} className={labelClass}>
            {label}
          </label>
          <div
            className={StylingHelper.classNames([
              'active-indicator transition-all duration-500 flex-1 border-l-0 border-outline border-b-0 w-[calc(100%-32px)] h-full rounded-tr border-[1px] right-0 top-0',
              { '!border-error': !!errorText?.length },
              {
                'border-primary border-[3px]': isFocused,
                '': !isFocused && !value?.length,
                '': isFocused || !!value?.length,
              },
              { invisible: variant == 'filled' },
            ])}
          ></div>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          className={inputClass}
          id={name}
          placeholder={isFocused ? placeholder : ''}
          onFocus={handleOnFocus}
          onBlur={handleBlur}
          disabled={!enabled}
          type={type}
        />
        <div className={activeIndicatorClass}></div>
        {trailingIcon && !showErrorIcon && (
          <div
            className={trailingIconClass}
            onClick={() => {
              !React.isValidElement(trailingIcon) && focusInput();
            }}
          >
            {React.isValidElement(trailingIcon) ? (
              trailingIcon
            ) : (
              <Icon className={'h-5'} icon={trailingIcon}></Icon>
            )}
          </div>
        )}
        {showErrorIcon && (
          <div
            className={trailingIconClass}
            onClick={() => {
              focusInput();
            }}
          >
            <Icon
              className={'h-5 text-error'}
              icon={faCircleExclamation}
            ></Icon>
          </div>
        )}
      </div>
      <p className={supportingTextClass}>
        {errorText ?? (supportingText?.length != 0 ? supportingText : '\u00A0')}
      </p>
    </div>
  );
};
