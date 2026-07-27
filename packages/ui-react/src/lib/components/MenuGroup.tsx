import { useId, type ReactNode } from 'react';
import {
  type MenuGroupInterface,
  menuGroupStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { useMenuContext } from './menu-context';

export type ReactMenuGroupProps = ReactProps<MenuGroupInterface> & {
  /** Related MenuItem and MenuHeadline content. */
  children?: ReactNode;
};

export const useMenuGroupStyle = createUseStyle(menuGroupStyle);

/**
 * MenuGroup renders a group of menu items with persistent styling.
 * It is primarily used to apply grouping logic or context to its children.
 *
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Groups related MenuItem children and inherits the parent Menu variant.
 * @a11y A visible `label` names the semantic group; an unlabeled group is presentational.
 * @limitations Group labels are plain text.
 */
export const MenuGroup = ({
  children,
  className,
  variant,
  label,
  ...restProps
}: ReactMenuGroupProps) => {
  const context = useMenuContext();
  const resolvedVariant = variant ?? context.variant;
  const labelId = useId();
  const styles = useMenuGroupStyle({
    variant: resolvedVariant,
    label,
    className,
  });

  return (
    <div
      data-menu-group
      {...restProps}
      className={styles.menuGroup}
      role={label ? 'group' : 'presentation'}
      aria-labelledby={label ? labelId : undefined}
    >
      {label && (
        <div id={labelId} className={styles.groupLabel}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
};
