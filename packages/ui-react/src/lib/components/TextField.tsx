import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Icon } from '../icon';
import { iCalendarToday } from '@udixio/icons-rounded-400/calendar_today';
import { iError } from '@udixio/icons-rounded-400/error';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iKeyboardArrowUp } from '@udixio/icons-rounded-400/keyboard_arrow_up';
import { DatePicker } from './DatePicker';
import { Button } from './Button';
import { Menu } from './Menu';
import { MenuItem, type ReactMenuItemProps } from './MenuItem';
import { Divider } from './Divider';
import { MenuHeadline } from './MenuHeadline';
import {
  classNames,
  formatTextFieldIsoDate,
  parseTextFieldIsoDate,
  resolveTextFieldFloating,
  resolveTextFieldTrailingIcon,
  sanitizeTextFieldDateInput,
  textFieldStyle,
  type TextFieldInterface,
  type TextFieldOption,
  type ReactProps,
} from '@udixio/core';
import {
  createTextFieldLabelController,
  createTextareaAutosizeController,
  type TextFieldLabelController,
  type TextareaAutosizeController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { AnchorPositioner } from './AnchorPositioner';

export type ReactTextFieldOption = TextFieldOption & {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export type ReactTextFieldProps = Omit<
  ReactProps<TextFieldInterface>,
  'ref' | 'options'
> & {
  children?: ReactNode;
  style?: CSSProperties;
  ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement>;
  options?: ReactTextFieldOption[];
  /** Native lower bound forwarded to the underlying input. */
  min?: number | string;
  /** Native upper bound forwarded to the underlying input. */
  max?: number | string;
  /** Native increment forwarded to the underlying input. */
  step?: number | string;
};

export const useTextFieldStyle = createUseStyle(textFieldStyle);

/**
 * Text fields let users enter text into a UI.
 * @status beta
 * @category Input
 * @devx
 * - Supports controlled (`value`) and uncontrolled (`defaultValue`) usage.
 * - `multiline` switches to an auto-growing textarea.
 * - `type="select"` switches to select mode with `options` or projected `MenuItem` children.
 * - `type="date"` switches to date-picker mode; the field stays typable (`YYYY-MM-DD`).
 * - `mask` transforms typed/pasted input on every keystroke (a card number, a phone number, an
 *   ID); it defaults to the built-in `YYYY-MM-DD` mask for `type="date"`, and providing one
 *   overrides it.
 * - The outlined variant's legend notch uses one `@udixio/core/dom` Anime.js Layout controller,
 *   shared with the Angular adapter -- an accepted exception to the rest of `@udixio/core/dom`,
 *   which uses Motion; Motion has no free equivalent to `width: auto` layout diffing. The floating
 *   label itself is a plain CSS transition.
 * @a11y
 * - `aria-describedby` links supporting text/error to the input.
 * - `aria-invalid` reflects `errorText`.
 * @limitations
 * - `ref` targets the underlying `<input>`/`<textarea>`, not the field's root element.
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
  mask,
  children,
  ...restProps
}: ReactTextFieldProps) => {
  const generatedId = useId();
  const id = idProp || generatedId;
  const helperTextId = `${id}-helper`;

  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue: defaultValue ?? '',
    onChange,
    componentName: 'TextField',
    stateName: 'value',
  });

  const [isFocused, setIsFocused] = useState(false);
  const [showErrorIcon, setShowErrorIcon] = useState(!!errorText?.length);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const textFieldRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLLegendElement>(null);
  const calendarTriggerRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof ref === 'function') ref(inputRef.current);
    else if (ref) ref.current = inputRef.current;
  }, [ref]);

  const hasSupportingText =
    showSupportingText ?? (!!errorText?.length || !!supportingText?.length);

  useEffect(() => {
    setShowErrorIcon(!!errorText?.length);
  }, [errorText]);

  const focusInput = () => {
    if (inputRef.current && !isFocused && !disabled) {
      if (type !== 'select') {
        inputRef.current.focus({ preventScroll: true });
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
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled, type]);

  const isFirstFocusEffectRef = useRef(true);

  useEffect(() => {
    if (isFirstFocusEffectRef.current) {
      isFirstFocusEffectRef.current = false;
      return;
    }
    if (isFocused) {
      setShowErrorIcon(false);
      onFocus?.();
    } else {
      if (errorText?.length) {
        setShowErrorIcon(true);
      }
      onBlur?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const effectiveMask =
    mask ?? (type === 'date' ? sanitizeTextFieldDateInput : undefined);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = event.target.value;
    setValue(effectiveMask ? effectiveMask(newValue) : newValue);
    setShowErrorIcon(false);
  };

  // Date Picker Logic
  const isDateInput = type === 'date';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const initialDateValue = useMemo(
    () => parseTextFieldIsoDate(String(value)),
    [value],
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setValue(formatTextFieldIsoDate(tempDate));
    setShowDatePicker(false);
  };

  // Select Logic
  const isSelectInput = type === 'select';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayValue = useMemo(() => {
    if (!isSelectInput) return value;
    if (options) {
      const selectedOption = options.find(
        (o) => String(o.value) === String(value),
      );
      return selectedOption ? String(selectedOption.label) : value;
    }
    // Projected MenuItem children carry the label the field must display,
    // exactly like `options` entries do.
    let selectedLabel: string | undefined;
    React.Children.forEach(children, (child) => {
      if (
        selectedLabel === undefined &&
        React.isValidElement<ReactMenuItemProps>(child) &&
        child.type === MenuItem &&
        child.props.value !== undefined &&
        String(child.props.value) === String(value) &&
        typeof child.props.label === 'string'
      ) {
        selectedLabel = child.props.label;
      }
    });
    return selectedLabel ?? value;
  }, [value, isSelectInput, options, children]);

  const handleSelectToggle = () => {
    if (disabled) return;
    setShowMenu(!showMenu);
    setIsFocused(!showMenu);
  };

  const handleSelectOption = (optionValue: string | number) => {
    setValue(String(optionValue));
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

  const effectiveTrailingIcon = resolveTextFieldTrailingIcon({
    type,
    trailingIcon,
    isMenuOpen: showMenu,
    dateIcon: iCalendarToday,
    menuOpenIcon: iKeyboardArrowUp,
    menuClosedIcon: iKeyboardArrowDown,
  });

  // Select's value only ever comes from picking an option, never typing.
  const inputSpecialClass = isSelectInput
    ? 'cursor-pointer selection:bg-transparent'
    : '';

  const isFloating = resolveTextFieldFloating({
    isFocused,
    hasValue: typeof displayValue === 'string' && displayValue.length > 0,
    type,
    isMenuOpen: showMenu,
  });

  const styles = useTextFieldStyle({
    label,
    variant,
    type,
    multiline,
    value,
    defaultValue,
    onChange,
    disabled,
    name,
    id,
    placeholder,
    autoComplete,
    autoFocus,
    onFocus,
    onBlur,
    leadingIcon,
    trailingIcon,
    suffix,
    supportingText,
    errorText,
    showSupportingText,
    options,
    mask,
    showErrorIcon,
    isFocused,
    isFloating,
    hasSupportingText,
    className,
  });

  const TextComponent = multiline ? 'textarea' : 'input';
  const textComponentProps = multiline
    ? {}
    : {
        // A native `type="date"` control would show its own browser date
        // picker alongside the shared `DatePicker` popover, so date mode
        // still uses plain text -- but stays typable (`YYYY-MM-DD`), unlike
        // select mode, whose value only ever comes from picking an option.
        type: isSelectInput || isDateInput ? 'text' : type,
        readOnly: isSelectInput,
      };

  // Outlined legend notch: shared Anime.js Layout controller, scoped to the
  // legend alone -- it is the only element with a genuine `width: auto`
  // animation problem CSS cannot solve. Rooting this any wider (e.g. at
  // `.content`) would also catch that fieldset's own unrelated CSS
  // transitions (the active indicator's width, the outlined border's
  // width/color on focus) in the same Layout diff, fighting them and
  // producing a visible flash/jump -- the same class of bug documented on
  // `createSwitchThumbController`'s `.handle-container` scoping.
  const labelControllerRef = useRef<TextFieldLabelController | null>(null);
  const isFirstLabelUpdateRef = useRef(true);

  useLayoutEffect(() => {
    const root = legendRef.current;
    if (!root) return;

    isFirstLabelUpdateRef.current = true;
    const controller = createTextFieldLabelController({ root });
    labelControllerRef.current = controller;

    return () => {
      controller.destroy();
      if (labelControllerRef.current === controller) {
        labelControllerRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (isFirstLabelUpdateRef.current) {
      isFirstLabelUpdateRef.current = false;
      return;
    }
    labelControllerRef.current?.update();
  }, [isFloating, variant]);

  // Multiline autosize: shared controller, no framework-specific package.
  const autosizeControllerRef = useRef<TextareaAutosizeController | null>(null);

  useLayoutEffect(() => {
    if (!multiline) return undefined;
    const textarea = inputRef.current as HTMLTextAreaElement | null;
    if (!textarea) return undefined;

    const controller = createTextareaAutosizeController({ textarea });
    autosizeControllerRef.current = controller;

    return () => {
      controller.destroy();
      autosizeControllerRef.current = null;
    };
  }, [multiline]);

  useLayoutEffect(() => {
    autosizeControllerRef.current?.update();
  }, [displayValue]);

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
            <Icon className={'w-5 h-5'} icon={leadingIcon}></Icon>
          </div>
        )}

        <legend ref={legendRef} aria-hidden="true" className={styles.legend}>
          <span className={'inline-flex -translate-y-1/2 opacity-0'}>
            {label}
          </span>
        </legend>

        <div className={'flex-1 relative'}>
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>

          <TextComponent
            {...(restProps as any)}
            ref={inputRef as any}
            value={displayValue}
            onChange={handleChange}
            className={classNames(styles.input, inputSpecialClass)}
            id={id}
            name={name}
            placeholder={
              isFocused
                ? (placeholder ?? (isDateInput ? 'YYYY-MM-DD' : undefined))
                : ''
            }
            onFocus={() => {
              if (!isSelectInput) setIsFocused(true);
            }}
            onBlur={() => {
              // For select, we manage focus manually with menu state usually
              if (!isSelectInput) setIsFocused(false);
            }}
            disabled={disabled}
            autoComplete={autoComplete}
            inputMode={isDateInput ? 'numeric' : undefined}
            maxLength={isDateInput ? 10 : undefined}
            aria-invalid={!!errorText?.length}
            aria-describedby={hasSupportingText ? helperTextId : undefined}
            {...textComponentProps}
          />
        </div>

        <div className={styles.activeIndicator}></div>

        {!showErrorIcon && (
          <>
            {effectiveTrailingIcon &&
              (isDateInput || isSelectInput ? (
                <button
                  ref={isDateInput ? calendarTriggerRef : undefined}
                  type="button"
                  disabled={disabled}
                  aria-label={isDateInput ? 'Choose date' : 'Show options'}
                  aria-expanded={isDateInput ? showDatePicker : showMenu}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isDateInput) handleDatePickerToggle();
                    if (isSelectInput) handleSelectToggle();
                  }}
                  className={classNames(styles.trailingIcon, 'cursor-pointer')}
                >
                  <span className="flex items-center justify-center w-full h-full">
                    <Icon className={'h-5'} icon={effectiveTrailingIcon} />
                  </span>
                </button>
              ) : (
                <div className={styles.trailingIcon}>
                  <div className="flex items-center justify-center w-full h-full">
                    <Icon className={'h-5'} icon={effectiveTrailingIcon} />
                  </div>
                </div>
              ))}
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
            <Icon className={'h-5 text-error'} icon={iError}></Icon>
          </div>
        )}
      </fieldset>

      {hasSupportingText && (
        <p className={styles.supportingText} id={helperTextId}>
          {errorText?.length
            ? errorText
            : supportingText?.length
              ? supportingText
              : ' '}
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
        <AnchorPositioner
          anchorRef={textFieldRef}
          position="bottom"
          style={{ width: textFieldRef.current?.offsetWidth }}
        >
          <div ref={menuRef}>
            <Menu
              className="max-w-full"
              purpose="selection"
              accessibleLabel={label || 'Options'}
            >
              {children
                ? React.Children.map(children, (child) => {
                    if (
                      React.isValidElement<ReactMenuItemProps>(child) &&
                      child.type === MenuItem
                    ) {
                      return React.cloneElement<ReactMenuItemProps>(child, {
                        selected: child.props.value === value,
                        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
                          if (child.props.onClick) {
                            child.props.onClick(e);
                          }
                          const optionValue = child.props.value;
                          handleSelectOption(
                            typeof optionValue === 'string' ||
                              typeof optionValue === 'number'
                              ? optionValue
                              : '',
                          );
                        },
                      });
                    }
                    return child;
                  })
                : options?.map((opt, i) => {
                    if (opt.type === 'divider') {
                      return <Divider key={i} className="my-1" />;
                    }
                    if (opt.type === 'headline') {
                      return opt.label ? (
                        <MenuHeadline key={i} label={opt.label} />
                      ) : null;
                    }
                    return (
                      <MenuItem
                        key={opt.value ?? i}
                        label={opt.label}
                        leadingIcon={opt.leadingIcon}
                        trailingIcon={opt.trailingIcon}
                        disabled={opt.disabled}
                        selected={opt.value === value}
                        onClick={(e) => {
                          if (opt.onClick) {
                            opt.onClick(e);
                          }
                          handleSelectOption(opt.value ?? '');
                        }}
                      >
                        {opt.label}
                      </MenuItem>
                    );
                  })}
            </Menu>
          </div>
        </AnchorPositioner>
      )}
    </div>
  );
};
