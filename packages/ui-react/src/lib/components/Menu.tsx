import React, { useEffect, useRef } from 'react';
import { MenuInterface } from '../interfaces/menu.interface';
import { useMenuStyle } from '../styles/menu.style';
import { classNames } from '../utils';
import { ReactProps } from '../utils/component';
import { MenuItem } from './MenuItem';
import { Divider } from './Divider';
import { MenuHeadline } from './MenuHeadline';
import { MenuGroup } from './MenuGroup';

/**
 * Menu displays a list of choices on a temporary surface.
 * @status beta
 * @category Selection
 * @limitations
 * - Don’t use MenuGroup in scrollable menus
 * @devx
 * - Used internally by `TextField` for `type="select"`.
 * - Supports keyboard navigation and auto-scrolling to selected item.
 * @a11y
 * - `role="listbox"` with `aria-selected` management.
 */
export const Menu = ({
  children,
  selected,
  onItemSelect,
  className,
  variant = 'standard',
  ...restProps
}: ReactProps<MenuInterface>) => {
  /* pass restProps to include key such as variant */
  const hasGroups = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === MenuGroup,
  );
  const styles = useMenuStyle({
    children,
    selected,
    onItemSelect,
    className,
    variant,
    hasGroups,
    ...restProps,
  });

  const listRef = useRef<HTMLDivElement>(null);

  // Scroll to selected item on open
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(
        '[aria-selected="true"]',
      ) as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, []);

  const renderChildren = (nodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child;

      // Handle MenuGroup: add surface styles if grouped
      if (child.type === MenuGroup) {
        const groupChildren = renderChildren((child.props as any).children);
        return React.cloneElement(child, {
          children: groupChildren,
          variant: variant,
        } as any);
      }

      if (child.type === MenuItem) {
        const childValue = (child.props as any).value;
        const isSelected = Array.isArray(selected)
          ? selected.includes(childValue)
          : selected === childValue;

        return React.cloneElement(child, {
          selected: isSelected,
          variant: variant,
          onItemSelect: (val: string | number) => {
            onItemSelect?.(val);
          },
        } as any);
      }

      if (child.type === MenuHeadline) {
        return React.cloneElement(child, {
          variant: variant,
        } as any);
      }

      if (child.type === Divider) {
        return React.cloneElement(child, {
          className: classNames('my-1', (child.props as any).className),
        } as any);
      }

      return child;
    });
  };

  return (
    <div ref={listRef} className={styles.menu} role="listbox" {...restProps}>
      {renderChildren(children)}
      {React.Children.count(children) === 0 && (
        <div className="px-4 py-3 text-on-surface-variant opacity-60 italic text-body-medium">
          No options
        </div>
      )}
    </div>
  );
};
