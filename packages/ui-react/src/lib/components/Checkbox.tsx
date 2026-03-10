import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCheckboxStyle } from '../styles/checkbox.style';
import { classNames } from '../utils';
import { ReactProps } from '../utils/component';
import { CheckboxInterface } from '../interfaces/checkbox.interface';
import { Icon } from '../icon';
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons';
import { State } from '../effects';

/**
 * Checkboxes allow the user to select one or more items from a set.
 * @status beta
 * @category Selection
 * @devx
 * - Supports controlled (`checked`) and uncontrolled (`defaultChecked`) modes.
 * - Handles `indeterminate` state strictly as visual (updates UI, but underlying input is checked/unchecked based on logic).
 * @a11y
 * - Uses native input for accessibility.
 * - Supports standard keyboard interaction.
 */
export const Checkbox = ({
  checked: checkedProp,
  defaultChecked,
  indeterminate = false,
  disabled = false,
  error = false,
  onChange,
  id: idProp,
  name,
  value,
  style,
  className,
  ...restProps
}: ReactProps<CheckboxInterface>) => {
  const generatedId = useId();
  const id = idProp || generatedId;

  const isControlled = checkedProp !== undefined;
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false,
  );
  const isChecked = isControlled ? checkedProp : internalChecked;

  const [isFocused, setIsFocused] = useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync indeterminate state to input element for a11y
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isControlled) {
      setInternalChecked(e.target.checked);
    }

    if (onChange) {
      onChange(e);
    }
  };

  const styles = useCheckboxStyle({
    isChecked: !!isChecked,
    isIndeterminate: indeterminate,
    isDisabled: disabled,
    isError: error,
    isFocused,
    isHovered: false, // Not used in style logic but requested by strict type if defined in interface? style config keys are flexible usually.
  });

  return (
    <div
      className={classNames(styles.checkbox, className, 'group/checkbox')}
      style={style}
    >
      <State
        stateClassName={styles.stateLayer}
        colorName={isChecked || indeterminate ? 'primary' : 'on-surface'}
      >
        <input
          ref={inputRef}
          type="checkbox"
          id={id}
          name={name}
          value={value}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={styles.input}
          {...(restProps as any)}
        />
        <div className={styles.box}></div>
        <AnimatePresence>
          {(isChecked || indeterminate) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
              className={styles.icon}
            >
              <Icon
                icon={indeterminate ? faMinus : faCheck}
                className="size-3.5" // ~14px icon
              />
            </motion.div>
          )}
        </AnimatePresence>
      </State>
    </div>
  );
};
