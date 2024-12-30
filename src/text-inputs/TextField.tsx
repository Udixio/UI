import { StyleProps, StylesHelper } from '../utils';
import React, { forwardRef, useEffect, useState } from 'react';
import { IconButton } from '../action/button';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Icon } from '../icon';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { TextFieldStyle } from './TextFieldStyle';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import classNames from 'classnames';
import TextareaAutosize from 'react-textarea-autosize';

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
  textLine: 'singleLine' | 'multiLine' | 'textAreas';
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
  | 'suffix'
  | 'stateLayer';

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
    textLine = 'singleLine',
    autoComplete = 'on',
  } = args;

  const [value, setValue] = useState(args.value ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const [showErrorIcon, setShowErrorIcon] = useState(false);
  const [showSupportingText, setShowSupportingText] = useState(
    !!args.showSupportingText
  );

  useEffect(() => {
    setValue(args.value ?? '');
  }, [args.value]);

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

  const inputRef = React.useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const focusInput = () => {
    if (inputRef.current && !isFocused) {
      inputRef.current.focus();
    }
  };

  const handleOnFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>
  ) => {
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
        suffix,
        textLine,
      },
    });
  })();

  const [uuid] = useState(uuidv4());

  let textComponentProps: object;
  let TextComponent;
  switch (textLine) {
    case 'multiLine':
      TextComponent = TextareaAutosize;
      textComponentProps = {};
      break;
    case 'textAreas':
      TextComponent = 'textarea';
      textComponentProps = {};
      break;
    case 'singleLine':
    default:
      TextComponent = 'input';
      textComponentProps = { type: type };
      break;
  }

  return (
    <div className={getClassNames.textField}>
      <fieldset onClick={focusInput} className={getClassNames.content}>
        <div className={getClassNames.stateLayer}></div>
        {leadingIcon && (
          <div className={getClassNames.leadingIcon}>
            {React.isValidElement(leadingIcon) ? (
              leadingIcon
            ) : (
              <Icon className={'w-5 h-5'} icon={leadingIcon}></Icon>
            )}
          </div>
        )}

        {!((!isFocused && !value.length) || variant == 'filled') && (
          <motion.legend
            variants={{
              hidden: { width: 0, padding: 0 },
              visible: { width: 'auto', padding: '0 8px' },
            }}
            initial={'hidden'}
            animate={!(!isFocused && !value.length) ? 'visible' : 'hidden'}
            className={'max-w-full ml-2 px-2 text-body-small h-0'}
            transition={{ duration: 0.2 }}
          >
            <span className={'transform inline-flex -translate-y-1/2'}>
              <motion.span
                className={getClassNames.label}
                transition={{ duration: 0.3 }}
                layoutId={uuid}
              >
                {label}
              </motion.span>
            </span>
          </motion.legend>
        )}
        <div className={'flex-1 relative'}>
          {((!isFocused && !value.length) || variant == 'filled') && (
            <motion.label
              htmlFor={name}
              className={classNames(
                'absolute left-4  transition-all duration-300',
                {
                  'text-body-small top-2':
                    variant == 'filled' && !(!isFocused && !value.length),
                  'text-body-large top-1/2 transform -translate-y-1/2': !(
                    variant == 'filled' && !(!isFocused && !value.length)
                  ),
                }
              )}
              transition={{ duration: 0.3 }}
            >
              <motion.span
                className={getClassNames.label}
                transition={{ duration: 0.3 }}
                layoutId={variant == 'outlined' ? uuid : undefined}
              >
                {label}
              </motion.span>
            </motion.label>
          )}
          <TextComponent
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
            autoComplete={autoComplete}
            aria-invalid={!!errorText?.length}
            aria-label={label}
            {...textComponentProps}
          />
        </div>

        <div className={getClassNames.activeIndicator}></div>

        {!showErrorIcon && (
          <>
            {trailingIcon && (
              <div
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className={getClassNames.trailingIcon}
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
            className={classNames(getClassNames.trailingIcon, {
              ' absolute right-0': !trailingIcon,
            })}
          >
            <Icon
              className={'h-5 text-error'}
              icon={faCircleExclamation}
            ></Icon>
          </div>
        )}
      </fieldset>
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
