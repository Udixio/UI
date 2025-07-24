import React, { useEffect, useRef } from 'react';

import { Icon } from '../icon/icon';
import { IconButtonInterface } from '../interfaces/icon-button.interface';
import { iconButtonStyle } from '../styles/icon-button.style';
import { ReactProps } from '../utils/component';
import { RippleEffect } from '../effects';
import { classNames } from '../utils';
import { ToolTip } from './ToolTip';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

export const IconButton = ({
  variant = 'standard',
  href,
  disabled = false,
  type = 'button',
  title,
  arialLabel,
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
  ...restProps
}: ReactProps<IconButtonInterface>) => {
  if (!title) {
    title = arialLabel;
  }

  const [isActive, setIsActive] = React.useState(activated);
  let handleClick;

  if (!onToggle) {
    handleClick = (e: React.MouseEvent<any, MouseEvent>) => {
      if (disabled) {
        e.preventDefault();
      }
      if (onClick) {
        onClick(e);
      }
    };
  } else if (onToggle) {
    handleClick = (e: React.MouseEvent<any, MouseEvent>) => {
      if (disabled) {
        e.preventDefault();
      }
      setIsActive(!isActive);
      onToggle(Boolean(isActive));
    };
    icon = isActive ? (iconSelected ? iconSelected : icon) : icon;
  }
  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  // Détermine le type de l'élément à rendre : un bouton ou un lien
  const ElementType = href ? 'a' : 'button';

  const styles = iconButtonStyle({
    transition,
    shape,
    allowShapeTransformation,
    width,
    href,
    activated,
    arialLabel,
    iconSelected,
    isActive,
    onToggle,
    disabled,
    icon,
    variant,
    className,
    size,
    ...restProps,
  });

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  transition = { duration: 0.3, ...transition };

  return (
    <ElementType
      disabled={disabled}
      href={href}
      className={styles.iconButton}
      aria-label={arialLabel}
      {...(restProps as any)}
      title={undefined}
      onClick={handleClick}
      ref={resolvedRef}
    >
      <ToolTip
        targetRef={resolvedRef}
        trigger={disabled ? null : undefined}
        text={title}
      ></ToolTip>
      <div
        style={{ transition: transition.duration + 's' }}
        className={styles.container}
      >
        <div className={styles.stateLayer}>
          {!disabled && (
            <RippleEffect
              colorName={classNames(
                variant === 'standard' && {
                  'on-surface-variant': !isActive,
                  primary: isActive,
                },
                variant === 'filled' && {
                  primary: !isActive && Boolean(onToggle),
                  'inverse-on-surface': isActive || !onToggle,
                },
                variant === 'tonal' && {
                  'on-surface-variant': !isActive && Boolean(onToggle),
                  'on-secondary-container': isActive || !onToggle,
                },
                variant === 'outlined' && {
                  'on-surface-variant': !isActive,
                  'on-primary': isActive,
                }
              )}
              triggerRef={resolvedRef}
            />
          )}
        </div>

        {icon && <Icon icon={icon} className={styles.icon} />}
      </div>
    </ElementType>
  );
};
