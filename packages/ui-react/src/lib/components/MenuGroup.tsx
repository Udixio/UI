import { type ReactNode } from 'react';
import {
  type MenuGroupInterface,
  menuGroupStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactMenuGroupProps = ReactProps<MenuGroupInterface> & {
  children?: ReactNode;
};

export const useMenuGroupStyle = createUseStyle(menuGroupStyle);

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
}: ReactMenuGroupProps) => {
  const styles = useMenuGroupStyle({ variant, label, className });

  return (
    <div className={styles.menuGroup} role="group" {...restProps}>
      {label && <div className={styles.groupLabel}>{label}</div>}
      {children}
    </div>
  );
};
