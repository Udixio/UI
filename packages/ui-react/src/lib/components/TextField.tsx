import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '../icon';
import {
  faCalendarDays,
  faCircleExclamation,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'motion/react';
import { DatePicker } from './DatePicker';
import { Button } from './Button';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';
import { Divider } from './Divider';
import { MenuHeadline } from './MenuHeadline';

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
 * - `type="select" ` switches to select mode with `options`
 * @a11y
 * - `aria-describedby` links supporting text/error to input.
 */
export const TextField = ({
  variant = 'filled',
  autoFocus,
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
  onFocus,
  onBlur,
  options,
  children,
  ...restProps
}: ReactProps<TextFieldInterface> & { children?: React.ReactNode }) => {
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
  const datePickerRef = useRef<HTMLDivElement>(null);

  const hasSupportingText =
    showSupportingText ?? (!!errorText?.length || !!supportingText?.length);

  useEffect(() => {
    setShowErrorIcon(!!errorText?.length);
  }, [errorText]);

  const focusInput = () => {
    if (inputRef.current && !isFocused && !disabled) {
      if (type !== 'select') {
        inputRef.current.focus();
      }
    }
  };

  useEffect(() => {
    if (!autoFocus || disabled) return;

    if (type !== 'select') {
      const rafId = window.requestAnimationFrame(() => {
        focusInput();
      });
      return () => window.cancelAnimationFrame(rafId);
    }
  }, [autoFocus, disabled, inputRef, type]);

  useEffect(() => {
    if (isFocused) {
      setShowErrorIcon(false);
      onFocus?.();
    } else {
      if (errorText?.length) {
        setShowErrorIcon(true);
      }
      onBlur?.();
    }
  }, [isFocused]);

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

  const handleDatePickerToggle = () => {
    if (disabled) return;
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      setTempDate(initialDateValue);
      setShowDatePicker(true);
    }
  };

  useEffect(() => {
    if (showDatePicker) {
      setIsFocused(true);
    } else if (!isSelectInput || !showMenu) {
      setIsFocused(false);
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (!showDatePicker) return;

    const isInside = (target: Node | null) => {
      if (!target) return false;
      return (
        textFieldRef.current?.contains(target) ||
        datePickerRef.current?.contains(target)
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const inDatePicker = datePickerRef.current?.contains(target);
      const inCalendarTrigger = calendarTriggerRef.current?.contains(target);
      if (!inDatePicker && !inCalendarTrigger) {
        setShowDatePicker(false);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (!isInside(e.target as Node)) {
        setShowDatePicker(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDatePicker]);

  const handleDateConfirm = () => {
    const newValue = tempDate ? tempDate.toLocaleDateString('en-CA') : '';

    if (!isControlled) {
      setInternalValue(newValue);
    }

    if (onChange) {
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

  // Select Logic
  const isSelectInput = type === 'select';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayValue = useMemo(() => {
    if (isSelectInput && options) {
      const selectedOption = options.find(
        (o) => String(o.value) === String(value),
      );
      return selectedOption ? selectedOption.label : value;
    }
    return value;
  }, [value, isSelectInput, options]);

  const handleSelectToggle = () => {
    if (disabled) return;
    setShowMenu(!showMenu);
    setIsFocused(!showMenu);
  };

  const handleSelectOption = (optionValue: string | number) => {
    if (!isControlled) {
      setInternalValue(String(optionValue));
    }

    if (onChange) {
      const event = {
        target: {
          value: String(optionValue),
          name,
          type,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    setShowMenu(false);
    setIsFocused(false);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textFieldRef.current &&
        !textFieldRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const effectiveTrailingIcon = useMemo(() => {
    if (trailingIcon) return trailingIcon;
    if (isDateInput) return faCalendarDays;
    if (isSelectInput) return showMenu ? faChevronUp : faChevronDown;
    return undefined;
  }, [trailingIcon, isDateInput, isSelectInput, showMenu]);

  // Enhance styles for date input or select
  const inputSpecialClass =
    isDateInput || isSelectInput
      ? '[&::-webkit-calendar-picker-indicator]:hidden cursor-pointer selection:bg-transparent'
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
    value: String(displayValue),
    suffix,
    multiline,
  });

  const TextComponent = multiline ? TextareaAutosize : 'input';
  // For select, we want the input to be readOnly but still focusable? 
  // Actually, for better UX, standard select inputs are often readOnly text fields.
  const textComponentProps = multiline
    ? {}
    : {
        type: isSelectInput ? 'text' : type,
        readOnly: isSelectInput,
      };

  const isFloating =
    isFocused ||
    (typeof value === 'string' && value.length > 0) ||
    type == 'date' ||
    (isSelectInput && showMenu);

  const showLegend = isFloating && variant === 'outlined';
  const showLabel = !showLegend;

  return (
    <div ref={textFieldRef} className={styles.textField} style={style}>
      <fieldset
        onClick={() => {
            if (isSelectInput) handleSelectToggle();
            else focusInput();
        }}
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
            value={displayValue} // Use displayValue for select
            onChange={handleChange}
            className={classNames(styles.input, inputSpecialClass)}
            id={id}
            name={name}
            placeholder={isFocused ? (placeholder ?? undefined) : ''}
            onFocus={() => {
                if(!isSelectInput) setIsFocused(true)
            }}
            onBlur={() => {
                 // For select, we manage focus manually with menu state usually
                 if(!isSelectInput) setIsFocused(false)
            }}
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
                  if (isDateInput) handleDatePickerToggle();
                  if (isSelectInput) handleSelectToggle();
                }}
                className={classNames(
                  styles.trailingIcon,
                  (isDateInput || isSelectInput) && 'cursor-pointer',
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
          <AnchorPositioner anchorRef={textFieldRef} position="bottom">
            <div
              ref={datePickerRef}
              className="z-50 shadow-xl rounded-[28px] bg-surface-container-high overflow-hidden"
            >
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

      {isSelectInput && showMenu && (
        <AnchorPositioner anchorRef={textFieldRef} position="bottom" style={{ width: textFieldRef.current?.offsetWidth }}>
            <div ref={menuRef}>
                <Menu
                    selected={value}
                    onItemSelect={handleSelectOption}
                >
                    {children}
                    {!children && options?.map((opt, i) => {
                         if (opt.type === 'divider') {
                            return <Divider key={i} className="my-1" />
                         }
                         if (opt.type === 'headline') {
                            return <MenuHeadline key={i} label={opt.label} />
                         }
                         return (
                            <MenuItem
                                key={opt.value ?? i}
                                value={opt.value ?? ''}
                                label={opt.label}
                                leadingIcon={opt.leadingIcon}
                                trailingIcon={opt.trailingIcon}
                                disabled={opt.disabled}
                            >
                                {opt.label}
                            </MenuItem>
                         )
                    })}
                </Menu>
            </div>
        </AnchorPositioner>
      )}
    </div>
  );
};

