
import React from 'react';
import { Icon } from '../icon';
import { classNames, ReactProps } from '../utils';
import { MenuItemInterface } from '../interfaces/menu-item.interface';
import { useMenuItemStyle } from '../styles/menu-item.style';

/**
 * Single item within a Menu.
 * @status beta
 * @category Selection
 */
export const MenuItem = ({
  label,
  children,
  value,
  leadingIcon,
  trailingIcon,
  disabled,
  selected,
  variant,
  onClick,
  onItemSelect, // Injected by Menu
  className,
  ...restProps
}: ReactProps<MenuItemInterface>) => {
  const styles = useMenuItemStyle({
      variant,
      disabled,
      selected,
      className
  });

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
        e.preventDefault();
        return;
    }
    onClick?.(e);
    if (onItemSelect) {
        onItemSelect(value);
    }
  };

  return (
    <div
      className={classNames(styles.item, { [styles.selectedItem]: selected })}
      onClick={handleClick}
      role="option"
      aria-selected={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      {...restProps}
    >
        {leadingIcon && (
            <div className={classNames(styles.itemIcon, styles.leadingIcon)}>
                {React.isValidElement(leadingIcon) ? leadingIcon : <Icon icon={leadingIcon} />}
            </div>
        )}
        <span className={styles.itemLabel}>{children ?? label}</span>
        {trailingIcon && (
             <div className={classNames(styles.itemIcon, styles.trailingIcon)}>
                {React.isValidElement(trailingIcon) ? trailingIcon : <Icon icon={trailingIcon} />}
            </div>
        )}
    </div>
  );
};
