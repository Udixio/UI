import { StyleProps, StylesHelper } from '../utils';
import React, { forwardRef, useEffect, useState } from 'react';
import { IconButton } from '../button';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Icon } from '../icon';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { TextFieldStyle } from './TextFieldStyle';

export type TextFieldVariant = 'filled' | 'outlined';

export interface TextFieldInternalState {
  isFocused: boolean;
  showErrorIcon: boolean;
  showSupportingText: boolean;
}
export interface TextFieldDefaultProps {
  value: string;
  variant: TextFieldVariant;
  type: 'text' | 'password' | 'number';
  autoComplete: 'on' | 'off' | string;
}
export interface TextFieldExternalProps {
  placeholder?: string;
  name: string;
  label: string;
  disabled?: boolean;
  errorText?: string;
  supportingText?: string;
  trailingIcon?: React.ReactElement<typeof IconButton> | IconDefinition;
  leadingIcon?: React.ReactElement<typeof IconButton> | IconDefinition;
  onChange?: (value: string) => void;
  showSupportingText?: boolean;
  suffix?: string;
}

export type TextFieldElement =
  | 'textField'
  | 'content'
  | 'label'
  | 'input'
  | 'activeIndicator'
  | 'supportingText'
  | 'leadingIcon'
  | 'trailingIcon'
  | 'suffix';

export type TextFieldConfigurableProps = TextFieldExternalProps &
  Partial<TextFieldDefaultProps>;

export type TextFieldAttributes = Omit<
  React.InputHTMLAttributes<HTMLDivElement>,
  'className' | 'autoComplete' | 'name' | 'onChange' | 'type' | 'value'
>;

export interface TextFieldProps
  extends TextFieldConfigurableProps,
    StyleProps<
      TextFieldConfigurableProps & TextFieldInternalState,
      TextFieldElement
    >,
    TextFieldAttributes {}

export const TextField: React.FC<TextFieldProps> = forwardRef<
  HTMLDivElement,
  TextFieldProps
>((args, ref) => {
  const {
    variant = 'filled',
    disabled,
    errorText,
    placeholder,
    suffix,
    name,
    label,
    className,
    supportingText,
    trailingIcon,
    leadingIcon,
    type = 'text',
    autoComplete = 'on',
  } = args;

  const [value, setValue] = useState(args.value); // Déclare un nouvel état 'value'
  const [isFocused, setIsFocused] = useState(false);
  const [showErrorIcon, setShowErrorIcon] = useState(false);
  const [showSupportingText, setShowSupportingText] = useState(
    !!args.showSupportingText
  );

  useEffect(() => {
    if (errorText?.length) {
      setShowErrorIcon(true);
    } else {
      setShowErrorIcon(false);
    }
  }, [errorText]);

  useEffect(() => {
    if (args.showSupportingText !== undefined) {
      setShowSupportingText(args.showSupportingText);
    } else {
      if (supportingText?.length) {
        setShowSupportingText(true);
      } else {
        setShowSupportingText(false);
      }
    }
  }, [showSupportingText, supportingText]);

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

    setShowErrorIcon(false);

    // If external onChange prop is provided, call it with the new value
    if (typeof args.onChange === 'function') {
      args.onChange(newValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getClassNames = (() => {
    return StylesHelper.classNamesElements<
      TextFieldConfigurableProps & TextFieldInternalState,
      TextFieldElement
    >({
      default: 'textField',
      classNameList: [className, TextFieldStyle],
      states: {
        showSupportingText,
        isFocused,
        showErrorIcon,
        disabled,
        name,
        label,
        leadingIcon,
        trailingIcon,
        variant,
        errorText,
        value,
      },
    });
  })();

  return (
    <div className={getClassNames.textField}>
      <div className={getClassNames.content}>
        {leadingIcon && (
          <div
            className={getClassNames.leadingIcon}
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
          onClick={() => focusInput()}
          className={StylesHelper.classNames([
            'flex cursor-text transition-all duration-500  absolute w-full  h-1/2',

            {
              applyWhen: variant == 'outlined',
              styles: [
                '',
                {
                  'gap-x-0': !isFocused && !value?.length,
                  'gap-x-1': isFocused || !!value?.length,
                },
              ],
            },
          ])}
        >
          <div
            className={StylesHelper.classNames([
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
          <label htmlFor={name} className={getClassNames.label}>
            {label}
          </label>
          <div
            className={StylesHelper.classNames([
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
          className={getClassNames.input}
          id={name}
          name={name}
          placeholder={isFocused ? placeholder : ''}
          onFocus={handleOnFocus}
          onBlur={handleBlur}
          disabled={disabled}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={!!errorText?.length}
          aria-label={label}
        />

        <div className={getClassNames.activeIndicator}></div>

        {!showErrorIcon && (
          <>
            {trailingIcon && (
              <div
                className={getClassNames.trailingIcon}
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
            {!trailingIcon && suffix && (
              <span className={getClassNames.suffix}>{suffix}</span>
            )}
          </>
        )}

        {showErrorIcon && (
          <div
            className={getClassNames.trailingIcon}
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
      {showSupportingText && (
        <p className={getClassNames.supportingText}>
          {errorText?.length
            ? errorText
            : supportingText?.length
              ? supportingText
              : '\u00A0'}
        </p>
      )}
    </div>
  );
});
