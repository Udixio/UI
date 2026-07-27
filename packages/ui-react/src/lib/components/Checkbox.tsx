import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import {
  checkboxStyle,
  getCheckboxChangeTransition,
  type CheckboxInterface,
  type ReactProps,
} from '@udixio/core';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { iRemove } from '@udixio/icons-rounded-400/remove';
import { State } from '../effects';
import { Icon } from '../icon';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';

export type ReactCheckboxProps = Omit<
  ReactProps<CheckboxInterface>,
  'aria-invalid' | 'onChange' | 'style' | 'type'
> & {
  /** Called once for each accepted checked-state transition. */
  onCheckedChange?: (checked: boolean) => void;
  /** Styles applied to the Checkbox touch target. */
  style?: React.CSSProperties;
};

export const useCheckboxStyle = createUseStyle(checkboxStyle);

/**
 * Checkboxes let people select one or more independent options.
 * @status beta
 * @category Selection
 * @devx
 * - Use `checked` with `onCheckedChange` for controlled state, or `defaultChecked` for uncontrolled state.
 * - Use `indeterminate` only for a parent option whose child selection is mixed.
 * @a11y
 * - Renders a native checkbox with standard keyboard and form behavior.
 * - `invalid` sets `aria-invalid`; provide an accessible description with `aria-describedby` when explaining the error.
 * @limitations
 * - The component does not render a visible label; associate one with `id` and `<label htmlFor>`, or provide an ARIA name.
 */
export const Checkbox = forwardRef<HTMLInputElement, ReactCheckboxProps>(
  (
    {
      checked,
      defaultChecked = false,
      indeterminate = false,
      disabled = false,
      invalid = false,
      required = false,
      onCheckedChange,
      id: idProp,
      className,
      style,
      onFocus,
      onBlur,
      ...inputProps
    },
    forwardedRef,
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isChecked, setChecked] = useControllableState({
      value: checked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
      componentName: 'Checkbox',
      stateName: 'checked',
    });

    useEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const styles = useCheckboxStyle({
      checked,
      defaultChecked,
      indeterminate,
      disabled,
      invalid,
      id,
      name: inputProps.name,
      value: inputProps.value as string | undefined,
      required,
      isChecked,
      isFocused,
      className,
    });

    return (
      <div className={styles.checkbox} style={style}>
        <State
          stateClassName={styles.stateLayer}
          colorName={isChecked || indeterminate ? 'primary' : 'on-surface'}
        />
        <input
          {...inputProps}
          ref={(node) => {
            inputRef.current = node;
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          type="checkbox"
          id={id}
          checked={isChecked}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          onChange={() => {
            const transition = getCheckboxChangeTransition({
              disabled,
              isChecked,
            });
            if (!transition.blocked) setChecked(transition.nextChecked);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          className={styles.input}
        />
        <span aria-hidden="true" className={styles.box} />
        {(isChecked || indeterminate) && (
          <Icon
            icon={indeterminate ? iRemove : iCheck}
            className={styles.icon}
          />
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
