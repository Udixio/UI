import React, { useRef, useState } from 'react';
import { Icon } from '../icon';
import { classNames, ReactProps } from '../utils';
import { MenuItemInterface } from '../interfaces/menu-item.interface';
import { useMenuItemStyle } from '../styles/menu-item.style';
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
  onClick,
  onItemSelect, // Injected by Menu
  className,
  ...restProps
}: ReactProps<MenuItemInterface>) => {
  /* Extract subMenu from children if present */
  let subMenuElement: React.ReactNode = null;
  const contentChildren: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    // Check for Menu component via name (development) or if it has displayName 'Menu'
    // We accept a child that is valid element and looks like a Menu.
    if (
      React.isValidElement(child) &&
      ((child.type as any)?.name === 'Menu' ||
        (child.type as any)?.displayName === 'Menu')
    ) {
      subMenuElement = child;
    } else {
      contentChildren.push(child);
    }
  });

  const labelContent = contentChildren.length > 0 ? contentChildren : label;

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<any>(null);

  const styles = useMenuItemStyle({
    variant,
    disabled,
    selected,
    className,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (subMenuElement) {
      e.stopPropagation();
      return;
    }

    onClick?.(e);
    if (onItemSelect) {
      onItemSelect(value);
    }
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!disabled && subMenuElement) {
      setIsSubMenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (subMenuElement) {
      closeTimerRef.current = setTimeout(() => {
        setIsSubMenuOpen(false);
      }, 150); // Delay to allow diagonal movement
    }
  };

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const effectiveTrailingIcon =
    trailingIcon ?? (subMenuElement ? faChevronRight : undefined);

  return (
    <div
      ref={itemRef}
      className={classNames(styles.item, { [styles.selectedItem]: selected })}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="option"
      aria-haspopup={!!subMenuElement}
      aria-expanded={isSubMenuOpen}
      aria-selected={selected}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (subMenuElement) {
            setIsSubMenuOpen(!isSubMenuOpen);
          } else {
            handleClick(e as any);
          }
        }
        if (e.key === 'ArrowRight' && subMenuElement) {
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
          {React.isValidElement(leadingIcon) ? (
            leadingIcon
          ) : (
            <Icon icon={leadingIcon} />
          )}
        </div>
      )}
      <span className={styles.itemLabel}>{labelContent}</span>
      {effectiveTrailingIcon && (
        <div className={classNames(styles.itemIcon, styles.trailingIcon)}>
          {React.isValidElement(effectiveTrailingIcon) ? (
            effectiveTrailingIcon
          ) : (
            <Icon icon={effectiveTrailingIcon} />
          )}
        </div>
      )}

      {subMenuElement && isSubMenuOpen && (
        <AnchorPositioner
          anchorRef={itemRef}
          position="inline-end span-block-end"
          hoverOpen={true}
        >
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {subMenuElement}
          </div>
        </AnchorPositioner>
      )}
    </div>
  );
};
