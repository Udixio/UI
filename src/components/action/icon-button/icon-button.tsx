import React, { useEffect } from 'react';

import { buttonStyle } from '@components/action/icon-button/button.style';
import { IconButtonProps } from '@components/action/icon-button/button.interface';
import { Icon } from '../../../icon/icon';

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
  iconSelected = null,
  className,
  ...restProps
}: IconButtonProps) => {
  const [isActive, setIsActive] = React.useState(activated);
  let handleClick;

  if (!onToggle) {
    handleClick = onClick;
  } else if (onToggle) {
    handleClick = () => {
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

  const styles = buttonStyle({
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
