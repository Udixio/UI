import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '../icon';
import {
  faCalendarDays,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'motion/react';
import { DatePicker } from './DatePicker';
import { Button } from './Button';

import TextareaAutosize from 'react-textarea-autosize';
import { useTextFieldStyle } from '../styles/text-field.style';
import { classNames } from '../utils';
import { ReactProps } from '../utils/component';
import { AnchorPositioner } from './AnchorPositioner';
import { TextFieldInterface } from '../interfaces';

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
  ref,
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

  const internalRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const inputRef = (ref as any) || internalRef;

  const textFieldRef = useRef<HTMLDivElement>(null);
  const calendarTriggerRef = useRef<HTMLDivElement>(null);

  const hasSupportingText =
    showSupportingText ?? (!!errorText?.length || !!supportingText?.length);

  useEffect(() => {
    setShowErrorIcon(!!errorText?.length);
  }, [errorText]);

  const focusInput = () => {
    if (inputRef.current && !isFocused) {
      inputRef.current.focus();
    }
  };

  const handleOnFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setIsFocused(true);
    setShowErrorIcon(false);
    restProps.onFocus?.(e);
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

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setIsFocused(false);
    if (errorText?.length) {
      setShowErrorIcon(true);
    }
    restProps.onBlur?.(e);
  };

  // Date Picker Logic
  const isDateInput = type === 'date';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const initialDateValue = useMemo(() => {
    const val = String(value);
    if (!val) return null;
    const [y, m, d] = val.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    return null;
  }, [value]);

  const handleDatePickerOpen = () => {
    if (disabled) return;
    setTempDate(initialDateValue);
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    const newValue = tempDate ? tempDate.toLocaleDateString('en-CA') : '';

    if (!isControlled) {
      setInternalValue(newValue);
    }

    if (onChange) {
      // Create a synthetic event
      const event = {
        target: {
          value: newValue,
          name,
          type,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    setShowDatePicker(false);
  };

  const effectiveTrailingIcon =
    isDateInput && !trailingIcon ? faCalendarDays : trailingIcon;

  // Enhance styles for date input
  const inputDateClass = isDateInput
    ? '[&::-webkit-calendar-picker-indicator]:hidden cursor-pointer'
    : '';

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
    trailingIcon: effectiveTrailingIcon,
    variant,
    errorText,
    value: String(value),
    suffix,
    multiline,
  });

  const TextComponent = multiline ? TextareaAutosize : 'input';
  const textComponentProps = multiline ? {} : { type };

  const isFloating =
    isFocused ||
    (typeof value === 'string' && value.length > 0) ||
    type == 'date'; // Float label when picker open
  const showLegend = isFloating && variant === 'outlined';
  const showLabel = !showLegend;

  return (
    <div ref={textFieldRef} className={styles.textField} style={style}>
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
            {...(restProps as any)}
            ref={inputRef as any}
            value={value}
            onChange={handleChange}
            className={classNames(styles.input, inputDateClass)}
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
          />
        </div>

        <div className={styles.activeIndicator}></div>

        {!showErrorIcon && (
          <>
            {effectiveTrailingIcon && (
              <div
                ref={isDateInput ? calendarTriggerRef : undefined}
                onClick={(event) => {
                  event.stopPropagation();
                  if (isDateInput) handleDatePickerOpen();
                }}
                className={classNames(
                  styles.trailingIcon,
                  isDateInput && 'cursor-pointer',
                )}
              >
                <div className="flex items-center justify-center w-full h-full">
                  {React.isValidElement(effectiveTrailingIcon) ? (
                    effectiveTrailingIcon
                  ) : (
                    <Icon
                      className={'h-5'}
                      icon={effectiveTrailingIcon as any}
                    />
                  )}
                </div>
              </div>
            )}
            {!effectiveTrailingIcon && suffix && (
              <span className={styles.suffix}>{suffix}</span>
            )}
          </>
        )}

        {showErrorIcon && (
          <div
            className={classNames(styles.trailingIcon, {
              ' absolute right-0': !effectiveTrailingIcon,
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

      {isDateInput && showDatePicker && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowDatePicker(false)}
          />
          <AnchorPositioner anchorRef={textFieldRef} position="bottom">
            <div className="z-50 shadow-xl rounded-[28px] bg-surface-container-high overflow-hidden">
              <DatePicker
                className={''}
                value={tempDate}
                onChange={setTempDate}
              />
              <div className="flex justify-end gap-2 p-4 pt-0">
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setShowDatePicker(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="filled"
                  size="small"
                  onClick={handleDateConfirm}
                >
                  OK
                </Button>
              </div>
            </div>
          </AnchorPositioner>
        </>
      )}
    </div>
  );
};
