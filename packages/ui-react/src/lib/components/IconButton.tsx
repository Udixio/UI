import React, { useEffect, useRef } from 'react';

import { Icon } from '../icon/icon';
import { IconButtonInterface } from '../interfaces/icon-button.interface';
import { useIconButtonStyle } from '../styles/icon-button.style';
import { ReactProps } from '../utils/component';
import { State } from '../effects';
import { classNames } from '../utils';
import { Tooltip } from './Tooltip';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

/**
 * Icon buttons help people take minor actions with one tap
 * @status beta
 * @category Action
 * @devx
 * - Requires `label` or children to provide an aria-label.
 * - Uses `title` as tooltip text; native title attribute is suppressed.
 * @limitations
 * - Tooltip is always rendered (no explicit opt-out).
 */
export const IconButton = ({
  variant = 'standard',
  href,
  disabled = false,
  title,
  label,
  onToggle,
  activated = false,
  onClick,
  icon,
  size = 'medium',
  iconSelected,
  className,
  ref,
  width = 'default',
  shape = 'rounded',
  allowShapeTransformation = true,
  transition,
  children,
  ...restProps
}: ReactProps<IconButtonInterface>) => {
  if (children) label = children;
  if (!label) {
    throw new Error(
      'IconButton component requires either a label prop or children content to provide an accessible aria-label',
    );
  }
  if (!title) {
    title = label;
  }

  const [isActive, setIsActive] = React.useState(activated);

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

  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  // Détermine le type de l'élément à rendre : un bouton ou un lien
  const ElementType = href ? 'a' : 'button';

  const styles = useIconButtonStyle({
    transition,
    shape,
    allowShapeTransformation,
    width,
    href,
    activated: isActive,
    label,
    iconSelected,
    isActive,
    onToggle,
    disabled,
    icon,
    variant,
    className,
    size,
    children: label,
    ...restProps,
  });

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  transition = { duration: 0.3, ...transition };

  return (
    <ElementType
      disabled={disabled}
      href={href}
      style={{ transition: transition.duration + 's' }}
      className={styles.iconButton}
      aria-label={label}
      {...(restProps as any)}
      title={undefined}
      onClick={handleClick}
      ref={resolvedRef}
    >
      <Tooltip
        targetRef={resolvedRef}
        trigger={disabled ? null : undefined}
        text={title}
      ></Tooltip>

      <div className={styles.touchTarget} />
      <State
        style={{ transition: transition.duration + 's' }}
        className={styles.stateLayer}
        colorName={classNames(
          variant === 'standard' && {
            'on-surface-variant': !isActive,
            'on-primary': isActive,
          },
          variant === 'filled' && {
            'on-surface-variant': !isActive && Boolean(onToggle),
            'on-primary': isActive || !onToggle,
          },
          variant === 'tonal' && {
            'on-secondary': isActive && Boolean(onToggle),
            'on-secondary-container': !isActive || !onToggle,
          },
          variant === 'outlined' && {
            'inverse-on-surface': isActive && Boolean(onToggle),
            'on-surface-variant': !isActive || !onToggle,
          },
        )}
        stateClassName={'state-ripple-group-[icon-button]'}
      />
      {icon && <Icon icon={icon} className={styles.icon} />}
    </ElementType>
  );
};
