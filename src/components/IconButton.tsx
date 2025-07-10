import React, { useEffect } from 'react';

import { Icon } from '../icon/icon';
import { IconButtonInterface } from '../interfaces/icon-button.interface';
import { iconButtonStyle } from '../styles/icon-button.style';
import { ReactProps } from '../utils/component';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

export const IconButton = ({
  variant = 'standard',
  href,
  disabled = false,
  type = 'button',
  arialLabel,
  onToggle,
  activated = false,
  onClick,
  icon,
  size = 'medium',
  iconSelected,
  className,
  ...restProps
}: ReactProps<IconButtonInterface>) => {
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

  return (
    <ElementType
      disabled={disabled}
      href={href}
      className={styles.button}
      aria-label={arialLabel}
      {...(restProps as any)}
      onClick={handleClick}
    >
      <span className={styles.stateLayer}></span>{' '}
      {icon && <Icon icon={icon} className={styles.icon} />}
    </ElementType>
  );
};
