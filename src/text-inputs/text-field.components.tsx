import React, { useEffect, useState } from 'react';
import { Icon } from '../icon';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import classNames from 'classnames';
import TextareaAutosize from 'react-textarea-autosize';
import { TextFieldProps } from './text-field.interface';
import { textFieldStyle } from './text-field.style';

export const TextField = ({
  variant = 'filled',
  disabled = false,
  errorText = null,
  placeholder = null,
  suffix = null,
  name,
  label,
  className,
  supportingText = null,
  trailingIcon = null,
  leadingIcon = null,
  type = 'text',
  textLine = 'singleLine',
  autoComplete = 'on',
  onChange = null,
  value: defaultValue,
  showSupportingText: defaultShowSupportingText = false,
  ...restProps
}: TextFieldProps) => {
  const [value, setValue] = useState(defaultValue ?? '');
  const [isFocused, setIsFocused] = useState(false);
  const [showErrorIcon, setShowErrorIcon] = useState(false);
  const [showSupportingText, setShowSupportingText] = useState(
    defaultShowSupportingText
  );

  useEffect(() => {
    setValue(defaultValue ?? '');
  }, [defaultValue]);

  useEffect(() => {
    if (errorText?.length) {
      setShowErrorIcon(true);
    } else {
      setShowErrorIcon(false);
    }
  }, [errorText]);

  useEffect(() => {
    if (defaultShowSupportingText) {
      setShowSupportingText(defaultShowSupportingText);
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
    if (typeof onChange === 'function') {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const styles = textFieldStyle({
    showSupportingText,
    isFocused,
    showErrorIcon,
    disabled,
    name,
    label,
    autoComplete,
    className,
    onChange,
    placeholder,
    supportingText,
    type,
    leadingIcon,
    trailingIcon,
    variant,
    errorText,
    value,
    suffix,
    textLine,
  });

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
    <div className={styles.textField} {...restProps}>
      <fieldset onClick={focusInput} className={styles.content}>
        <div className={styles.stateLayer}></div>
        {leadingIcon && (
          <div className={styles.leadingIcon}>
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
                className={styles.label}
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
                className={styles.label}
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
            className={styles.input}
            id={name}
            name={name}
            placeholder={isFocused ? (placeholder ?? undefined) : ''}
            onFocus={handleOnFocus}
            onBlur={handleBlur}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={!!errorText?.length}
            aria-label={label}
            {...textComponentProps}
          />
        </div>

        <div className={styles.activeIndicator}></div>

        {!showErrorIcon && (
          <>
            {trailingIcon && (
              <div
                onClick={(event) => {
                  event.stopPropagation();
                }}
                className={styles.trailingIcon}
              >
                {React.isValidElement(trailingIcon) ? (
                  trailingIcon
                ) : (
                  <Icon className={'h-5'} icon={trailingIcon}></Icon>
                )}
              </div>
            )}
            {!trailingIcon && suffix && (
              <span className={styles.suffix}>{suffix}</span>
            )}
          </>
        )}

        {showErrorIcon && (
          <div
            className={classNames(styles.trailingIcon, {
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
        <p className={styles.supportingText}>
          {errorText?.length
            ? errorText
            : supportingText?.length
              ? supportingText
              : '\u00A0'}
        </p>
      )}
    </div>
  );
};
