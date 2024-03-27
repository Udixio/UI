import { StylingHelper } from '../utils';
import React, { useEffect, useState } from 'react';
import { IconButton } from '../button';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Icon } from '../icon';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';

export type TextFieldVariant =
  | 'linear-determinate'
  | 'linear-indeterminate'
  | 'circular-determinate'
  | 'circular-indeterminate';

export interface TextFieldProps {
  variant?: TextFieldVariant;
  placeholder: string;
  value?: string;
  name: string;
  enabled: boolean;
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
}

export const TextField: React.FC<TextFieldProps> = (args: TextFieldProps) => {
  const {
    variant = 'linear-determinate',
    enabled = true,
    errorText,
    placeholder,
    name,
    inputClassName,
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

  const handleChange = (event: {
    target: { value: React.SetStateAction<string | undefined> };
  }) => {
    setValue(event.target.value); // Mettre à jour l'état 'value'
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
    'content  relative rounded-t overflow-hidden',
    { 'bg-surface-container-highest': enabled },
    { 'bg-on-surface/[0.04]': !enabled },
  ]);

  const labelClass = StylingHelper.classNames([
    labelClassName,
    'label  outline-none transition-all duration-300 absolute left-4',
    { 'text-on-surface-variant': enabled && !errorText?.length },
    { 'text-on-surface': !enabled },
    { 'text-error': !!errorText?.length },
    {
      'left-12': !!leadingIcon,
      'pr-12': !!trailingIcon,
    },
    {
      applyWhen: !isFocused && (value?.length ?? 0) == 0,
      styles: [
        'text-body-large top-2/4 -translate-y-2/4',
        { 'cursor-text': enabled },
      ],
    },
    {
      applyWhen: isFocused || (value?.length ?? 0) !== 0,
      styles: ['text-body-small top-2'],
    },
  ]);

  const inputClass = StylingHelper.classNames([
    inputClassName,
    'input text-body-large bg-[inherit] outline-none',
    'border-b-[1px]',
    'pl-4 pb-2 pt-6',
    {
      'border-on-surface-variant': !errorText?.length && !isFocused,
      'border-primary': !errorText?.length && isFocused,
    },
    { 'border-error': !!errorText?.length },
    {
      'state-on-surface text-on-surface-variant placeholder:text-on-surface-variant':
        enabled,
      'placeholder:text-on-surface text-on-surface': !enabled,
    },
    {
      'pl-12': !!leadingIcon,
      'pr-12': !!trailingIcon,
    },
  ]);
  const activeIndicatorClass = StylingHelper.classNames([
    activeIndicatorClassName,
    'absolute w-0 inset-x-0 border-rounded mx-auto transition-all duration-300 bottom-0 active-indicator  h-[3px]',
    { 'bg-primary': !errorText?.length },
    { 'bg-error': !!errorText?.length },
    {
      applyWhen: isFocused,
      styles: ['!w-full'],
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
        <label htmlFor={name} className={labelClass}>
          label
        </label>
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
