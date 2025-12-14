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
  if (onRemove && onToggle) {
    throw new Error(
      'Chip component cannot have both onRemove and onToggle props. Use onRemove for input chips (removable tags) or onToggle for filter chips (selection), but not both.',
    );
  }

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

  if (activated) {
    icon = faCheck;
  }

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
  });

  return (
    <ElementType
      ref={resolvedRef}
      href={href}
      className={styles.chip}
      {...(restProps as any)}
      onClick={handleClick}
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
