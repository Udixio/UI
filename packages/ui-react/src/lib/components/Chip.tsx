import { classNames, ReactProps } from '../utils';
import { ChipInterface } from '../interfaces';
import { useChipStyle } from '../styles';
import { Icon } from '../icon';
import { State } from '../effects';
import React, { useEffect, useRef } from 'react';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

/**
 * Chips prompt most actions in a UI
 * @status beta
 * @category Action
 */
export const Chip = ({
  variant = 'outlined',
  disabled = false,
  icon,
  href,
  label,
  className,
  selected,
  onClick,
  onToggle,
  activated,
  ref,
  onRemove,
  transition,
  children,
  ...restProps
}: ReactProps<ChipInterface>) => {
  if (children) label = children;
  if (!label) {
    throw new Error(
      'Chip component requires either a label prop or children content',
    );
  }

  const ElementType = href ? 'a' : 'button';

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  const [isActive, setIsActive] = React.useState(activated);
  const [isSelected, setIsSelected] = React.useState(false);
  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  useEffect(() => {
    if (selected !== undefined) {
      setIsActive(selected);
    }
  }, [selected]);

  transition = { duration: 0.3, ...transition };

  const handleClick = (e: React.MouseEvent<any, MouseEvent>) => {
    if (disabled) {
      e.preventDefault();
    }
    if (onToggle) {
      setIsActive(!isActive);
      onToggle(!isActive);
    } else if (onClick) {
      onClick(e);
    }
  };

  const isInteractive = !!onToggle || !!onRemove || !!onClick || !!href;

  // Selection (focus visual + keyboard safety) is enabled only for interactive or removable chips
  const selectionEnabled = isInteractive || !!onRemove;

  if (activated) {
    icon = faCheck;
  }

  // Extract potential onFocus/onBlur from rest props to compose handlers
  const {
    onFocus: restOnFocus,
    onBlur: restOnBlur,
    onKeyDown: restOnKeyDown,
    ...rest
  } = (restProps as any) ?? {};

  const styles = useChipStyle({
    href,
    disabled,
    icon,
    variant,
    transition,
    className,
    isActive: isActive ?? false,
    onToggle,
    activated: isActive,
    label,
    isInteractive,
    children: label,
    selected: isSelected && selectionEnabled,
    isSelected: isSelected && selectionEnabled,
  });

  return (
    <ElementType
      ref={resolvedRef}
      href={href}
      className={styles.chip}
      {...(rest as any)}
      onClick={handleClick}
      onFocus={(e: React.FocusEvent<any>) => {
        if (selectionEnabled) {
          setIsSelected(true);
        }
        restOnFocus?.(e);
      }}
      onBlur={(e: React.FocusEvent<any>) => {
        setIsSelected(false);
        restOnBlur?.(e);
      }}
      onKeyDown={(e: React.KeyboardEvent<any>) => {
        // Only handle keys when focused/selected and not disabled
        if (!disabled && selectionEnabled && isSelected) {
          const key = e.key;

          // Toggle active state on Enter or Space when togglable
          if (
            onToggle &&
            (key === 'Enter' || key === ' ' || key === 'Spacebar')
          ) {
            e.preventDefault();
            const next = !isActive;
            setIsActive(next);
            onToggle(next);
          }

          // Trigger remove on Backspace or Delete when removable
          if (
            onRemove &&
            (key === 'Backspace' || key === 'Delete' || key === 'Del')
          ) {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }
        }

        // Delegate to user handler last
        restOnKeyDown?.(e);
      }}
      disabled={disabled}
      aria-pressed={onToggle ? isActive : undefined}
      style={{ transition: transition.duration + 's' }}
    >
      {isInteractive && !disabled && (
        <State
          style={{ transition: transition.duration + 's' }}
          className={styles.stateLayer}
          colorName={classNames({
            'on-surface-variant': !isActive,
            'on-secondary-container': isActive,
          })}
          stateClassName={'state-ripple-group-[chip]'}
        />
      )}

      {icon && <Icon icon={icon} className={styles.leadingIcon} />}
      <span className={styles.label}>{label}</span>
      {onRemove && (
        <Icon
          icon={faXmark}
          className={styles.trailingIcon}
          onClick={(e: React.MouseEvent) => {
            console.log('click');
            e.stopPropagation();
            if (!disabled) {
              onRemove();
            }
          }}
        />
      )}
    </ElementType>
  );
};
