import React from 'react';
import { ReactProps } from '../utils/component';
import { useMenuGroupStyle } from '../styles/menu-group.style';
import { MenuGroupInterface } from '../interfaces/menu-group.interface';

/**
 * MenuGroup renders a group of menu items with persistent styling.
 * It is primarily used to apply grouping logic or context to its children.
 *
 * @status beta
 * @category Selection
 */
export const MenuGroup = ({
  children,
  className,
  variant,
  label,
  ...restProps
}: ReactProps<MenuGroupInterface> & React.HTMLAttributes<HTMLDivElement>) => {
  const styles = useMenuGroupStyle({
    children,
    className,
    variant,
    label,
    ...restProps,
  });

  return (
    <div className={styles.menuGroup} role="group" {...restProps}>
      {label && <div className={styles.groupLabel}>{label}</div>}
      {children}
    </div>
  );
};
