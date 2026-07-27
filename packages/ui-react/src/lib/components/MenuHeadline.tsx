import {
  type MenuHeadlineInterface,
  menuHeadlineStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { useMenuContext } from './menu-context';

export type ReactMenuHeadlineProps = ReactProps<MenuHeadlineInterface>;

export const useMenuHeadlineStyle = createUseStyle(menuHeadlineStyle);

/**
 * A non-interactive visual heading inside a Menu.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Use MenuGroup when the heading must also name a semantic group.
 * @a11y Rendered as presentational text and excluded from menu keyboard navigation.
 * @limitations Does not create a heading landmark or label neighboring items.
 */
export const MenuHeadline = ({
  label,
  variant,
  className,
  ...restProps
}: ReactMenuHeadlineProps) => {
  const context = useMenuContext();
  const resolvedVariant = variant ?? context.variant;
  const styles = useMenuHeadlineStyle({
    label,
    variant: resolvedVariant,
    className,
  });
  return (
    <div {...restProps} className={styles.headline} role="presentation">
      {label}
    </div>
  );
};
