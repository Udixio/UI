
import React from 'react';
import { Icon } from '../icon';
import { classNames, ReactProps } from '../utils';
import { MenuItemInterface } from '../interfaces/menu-item.interface';
import { useMenuItemStyle } from '../styles/menu-item.style';

import { useRef, useState } from 'react';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { AnchorPositioner } from './AnchorPositioner';

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
  subMenu,
  onClick,
  onItemSelect, // Injected by Menu
  className,
  ...restProps
}: ReactProps<MenuItemInterface>) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
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
    
    if (subMenu) {
        e.stopPropagation();
        // Toggle on click for touch devices or if preferred
        // setIsSubMenuOpen(!isSubMenuOpen); 
        // Actually, usually click performs action OR opens menu. 
        // If it has submenu, maybe just open it?
        return;
    }

    onClick?.(e);
    if (onItemSelect) {
        onItemSelect(value);
    }
  };

  const handleMouseEnter = () => {
    if (!disabled && subMenu) {
        setIsSubMenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
     // Delay closing or check if moving to submenu?
     // simple for now
     if (subMenu) {
        setIsSubMenuOpen(false);
     }
  };

  // Ensure trailing icon is chevron if submenu exists and no other icon provided
  const effectiveTrailingIcon = trailingIcon ?? (subMenu ? faChevronRight : undefined);

  return (
    <div
      ref={itemRef}
      className={classNames(styles.item, { [styles.selectedItem]: selected })}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="option"
      aria-haspopup={!!subMenu}
      aria-expanded={isSubMenuOpen}
      aria-selected={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (subMenu) {
             setIsSubMenuOpen(!isSubMenuOpen);
          } else {
             handleClick(e as any);
          }
        }
        if (e.key === 'ArrowRight' && subMenu) {
             setIsSubMenuOpen(true);
             e.stopPropagation();
        }
        if (e.key === 'ArrowLeft' && isSubMenuOpen) {
             setIsSubMenuOpen(false);
             e.stopPropagation();
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
        {effectiveTrailingIcon && (
             <div className={classNames(styles.itemIcon, styles.trailingIcon)}>
                {React.isValidElement(effectiveTrailingIcon) ? effectiveTrailingIcon : <Icon icon={effectiveTrailingIcon} />}
            </div>
        )}
        
        {subMenu && isSubMenuOpen && (
            <AnchorPositioner 
                anchorRef={itemRef} 
                position="right-start" 
                hoverOpen={true} // Keep open when hovering the menu itself
            >
                {/* We render the subMenu (expected to be a Menu component) directly. 
                    AnchorPositioner will wrap it. 
                    Ideally subMenu is <Menu>...</Menu>
                */}
                <div 
                   onMouseEnter={() => setIsSubMenuOpen(true)}
                   onMouseLeave={() => setIsSubMenuOpen(false)}
                >
                    {subMenu}
                </div>
            </AnchorPositioner>
        )}
    </div>
  );
};
