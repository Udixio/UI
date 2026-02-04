
import React, { useEffect, useRef } from 'react';
import { MenuInterface } from '../interfaces/menu.interface';
import { useMenuStyle } from '../styles/menu.style';
import { classNames } from '../utils';
import { ReactProps } from '../utils/component';
import { MenuItem } from './MenuItem';
import { Divider } from './Divider';
import { MenuHeadline } from './MenuHeadline';

/**
 * Menu displays a list of choices on a temporary surface.
 * @status beta
 * @category Selection
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
}: ReactProps<MenuInterface> & React.HTMLAttributes<HTMLDivElement>) => {
  /* pass restProps to include key such as variant */
  const styles = useMenuStyle({
    children,
    selected,
    onItemSelect,
    className,
    variant,
    ...restProps
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

  const renderChildren = () => {
    return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        if (child.type === MenuItem) {
            const childValue = (child.props as any).value;
             const isSelected = Array.isArray(selected)
                ? selected.includes(childValue)
                : selected === childValue;
            
            return React.cloneElement(child, {
                selected: isSelected,
                variant: variant,
                onItemSelect: (val: string | number) => {
                    // Call child's onClick/onSelect if any ? No, MenuItem calls injected onItemSelect
                    onItemSelect?.(val);
                    // Also call original params if needed? MenuItem handles it.
                }
            } as any);
        }
        
        // Pass variant to Headline if they accept it, for Divider handle standard class
        if (child.type === MenuHeadline) {
             return React.cloneElement(child, {
                variant: variant
            } as any);
        }
        
        if (child.type === Divider) {
             return React.cloneElement(child, {
                className: classNames('my-1', (child.props as any).className)
            } as any);
        }

        return child;
    });
  };

  return (
    <div
      ref={listRef}
      className={classNames(styles.menu, className)}
      role="listbox"
      {...restProps}
    >
      {renderChildren()}
      {React.Children.count(children) === 0 && (
        <div className="px-4 py-3 text-on-surface-variant opacity-60 italic text-body-medium">
          No options
        </div>
      )}
    </div>
  );
};
