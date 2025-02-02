import React, { useEffect } from 'react';

import { Icon } from '../../../icon/icon';
import { IconButtonProps } from './icon-button.interface';
import { iconButtonStyle } from './icon-button.style';

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
  iconSelected,
  className,
  ...restProps
}: IconButtonProps) => {
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
    activated,
    arialLabel,
    iconSelected,
    isActive,
    onToggle(isActive: boolean): void {},
    disabled,
    icon,
    variant,
    className,
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
      <span className={styles.stateLayer}>
        {icon && <Icon icon={icon} className={styles.icon} />}
      </span>
    </ElementType>
  );
};
