import React, { useEffect, useId, useState } from 'react';
import { Icon } from '../icon';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'motion/react';

import TextareaAutosize from 'react-textarea-autosize';
import { useTextFieldStyle } from '../styles/text-field.style';
import { classNames } from '../utils';
import { ReactProps } from '../utils/component';
import { TextFieldInterface } from '../interfaces/text-field.interface';

/**
 * Text fields let users enter text into a UI
 * @status beta
 * @category Input
 * @devx
 * - Supports controlled (`value`) and uncontrolled (`defaultValue`) usage.
 * - `multiline` switches to textarea mode.
 * @a11y
 * - `aria-describedby` links supporting text/error to input.
 */
export const TextField = ({
  variant = 'filled',
  disabled = false,
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
  multiline = false,
  autoComplete = 'on',
  onChange,
  value: valueProp,
  defaultValue,
  showSupportingText,
  id: idProp,
  style,
  ...restProps
}: ReactProps<TextFieldInterface>) => {
  const generatedId = useId();
  const id = idProp || generatedId;
  const helperTextId = `${id}-helper`;

  const isControlled = valueProp !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const value = isControlled ? valueProp : internalValue;

  const [isFocused, setIsFocused] = useState(false);
  const [showErrorIcon, setShowErrorIcon] = useState(!!errorText?.length);

  const hasSupportingText =
    showSupportingText ?? (!!errorText?.length || !!supportingText?.length);

  useEffect(() => {
    setShowErrorIcon(!!errorText?.length);
  }, [errorText]);

  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const focusInput = () => {
    if (inputRef.current && !isFocused) {
      inputRef.current.focus();
    }
  };

  const handleOnFocus = () => {
    setIsFocused(true);
    setShowErrorIcon(false);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = event.target.value;

    if (!isControlled) {
      setInternalValue(newValue);
    }

    setShowErrorIcon(false);

    if (onChange) {
      onChange(event);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (errorText?.length) {
      setShowErrorIcon(true);
    }
  };

  const styles = useTextFieldStyle({
    showSupportingText: hasSupportingText,
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
    value: String(value),
    suffix,
    multiline,
  });

  const TextComponent = multiline ? TextareaAutosize : 'input';
  const textComponentProps = multiline ? {} : { type };

  const isFloating =
    isFocused || (typeof value === 'string' && value.length > 0);
  const showLegend = isFloating && variant === 'outlined';
  const showLabel = !showLegend;

  return (
    <div className={styles.textField} style={style}>
      <fieldset
        onClick={focusInput}
        className={styles.content}
        role="presentation"
      >
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

        <motion.legend
          aria-hidden="true"
          variants={{
            hidden: { width: 0, padding: 0 },
            visible: { width: 'auto', padding: '0 8px' },
          }}
          initial={showLegend ? 'visible' : 'hidden'}
          animate={showLegend ? 'visible' : 'hidden'}
          className={
            'max-w-full ml-2 px-2 text-body-small h-0 overflow-hidden whitespace-nowrap'
          }
          transition={{ duration: 0.2 }}
        >
          <span className={'transform inline-flex -translate-y-1/2 opacity-0'}>
            {label}
          </span>
        </motion.legend>

        <div className={'flex-1 relative'}>
          {showLabel && (
            <motion.label
              htmlFor={id}
              className={classNames(
                'absolute left-4  transition-all duration-300 pointer-events-none',
                {
                  'text-body-small top-2': variant == 'filled' && isFloating,
                  'text-body-large top-1/2 transform -translate-y-1/2': !(
                    variant == 'filled' && isFloating
                  ),
                },
              )}
              transition={{ duration: 0.3 }}
              layoutId={variant === 'outlined' ? `${id}-label` : undefined}
            >
              <span className={styles.label}>{label}</span>
            </motion.label>
          )}

          {showLegend && (
            <motion.label
              htmlFor={id}
              className={classNames(
                'absolute left-2 -top-3 px-1 text-body-small z-10',
                styles.label,
              )}
              layoutId={`${id}-label`}
              transition={{ duration: 0.3 }}
            >
              {label}
            </motion.label>
          )}

          <TextComponent
            ref={inputRef as any}
            value={value}
            onChange={handleChange}
            className={styles.input}
            id={id}
            name={name}
            placeholder={isFocused ? (placeholder ?? undefined) : ''}
            onFocus={handleOnFocus}
            onBlur={handleBlur}
            disabled={disabled}
            autoComplete={autoComplete}
            aria-invalid={!!errorText?.length}
            aria-describedby={hasSupportingText ? helperTextId : undefined}
            {...textComponentProps}
            {...(restProps as any)}
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
      {hasSupportingText && (
        <p className={styles.supportingText} id={helperTextId}>
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
