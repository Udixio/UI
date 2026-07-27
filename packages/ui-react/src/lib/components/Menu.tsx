import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { type MenuInterface, menuStyle, type ReactProps } from '@udixio/core';
import { createMenuController } from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { MenuGroup } from './MenuGroup';
import { MenuContext } from './menu-context';

export type { MenuInitialFocus, MenuPurpose, MenuVariant } from '@udixio/core';

export type ReactMenuProps = Omit<
  ReactProps<MenuInterface>,
  'aria-label' | 'role'
> & {
  /** MenuItem children, or MenuGroup children containing their related MenuHeadline. */
  children?: ReactNode;
};

export const useMenuStyle = createUseStyle(menuStyle);

/**
 * Menu displays a list of choices on a temporary surface.
 * @status beta
 * @category Selection
 * @limitations
 * - Nested submenus are not part of this component; compose another popup from an item trigger.
 * @devx
 * - Use `purpose="actions"` for commands and `purpose="selection"` for options.
 * - Set `initialFocus` when the Menu is mounted inside a popup.
 * - When using groups, render each related MenuHeadline inside its MenuGroup.
 * @a11y
 * - Implements wrapping Arrow Up/Down, Home, End, and type-ahead focus navigation.
 * - Provide `accessibleLabel` unless an external `aria-labelledby` is forwarded.
 */
export const Menu = forwardRef<HTMLDivElement, ReactMenuProps>(
  (
    {
      children,
      className,
      variant = 'standard',
      purpose = 'actions',
      accessibleLabel,
      initialFocus = 'none',
      ...restProps
    },
    forwardedRef,
  ) => {
    const hasGroups = React.Children.toArray(children).some(
      (child) => React.isValidElement(child) && child.type === MenuGroup,
    );
    const styles = useMenuStyle({
      variant,
      purpose,
      accessibleLabel,
      initialFocus,
      hasGroups,
      className,
    });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const menu = menuRef.current;
      if (!menu) return;
      const controller = createMenuController(menu, { initialFocus });
      return () => controller.destroy();
    }, [initialFocus]);

    const context = useMemo(() => ({ purpose, variant }), [purpose, variant]);

    return (
      <MenuContext.Provider value={context}>
        <div
          {...restProps}
          ref={(node) => {
            menuRef.current = node;
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          className={styles.menu}
          role={purpose === 'selection' ? 'listbox' : 'menu'}
          aria-label={accessibleLabel}
        >
          {children}
        </div>
      </MenuContext.Provider>
    );
  },
);

Menu.displayName = 'Menu';
