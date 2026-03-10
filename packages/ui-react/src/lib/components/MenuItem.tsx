import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../icon';
import { classNames, ReactProps } from '../utils';
import { MenuItemInterface } from '../interfaces/menu-item.interface';
import { useMenuItemStyle } from '../styles/menu-item.style';
import { faCheck, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { AnchorPositioner } from './AnchorPositioner';
import { State } from '../effects';

/**
 * Single item within a Menu.
 * @status beta
 * @category Selection
 */
export const MenuItem = ({
  label,
  children,
  leadingIcon,
  trailingIcon,
  disabled,
  variant = 'standard',
  href,
  onClick,
  onToggle,
  activated = false,
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
  const [isActive, setIsActive] = useState(activated);

  if (isActive) {
    leadingIcon = faCheck;
  }

  const itemRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const closeTimerRef = useRef<any>(null);

  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  const styles = useMenuItemStyle({
    variant,
    disabled,
    className,
    activated: isActive,
    isActive,
  });

  const handleClick = (e: React.MouseEvent) => {
    console.log('refrefd', disabled, subMenuElement, onToggle);
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (subMenuElement) {
      e.stopPropagation();
      return;
    }

    if (onToggle) {
      setIsActive(!isActive);
      onToggle(!isActive);
    } else {
      console.log('click', onClick);
      onClick?.(e);
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

  const ElementType = href ? 'a' : 'button';

  return (
    <ElementType
      ref={itemRef as any}
      href={href}
      className={styles.menuItem}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="option"
      aria-haspopup={!!subMenuElement}
      aria-expanded={isSubMenuOpen}
      aria-pressed={onToggle ? isActive : undefined}
      tabIndex={disabled ? -1 : 0}
      disabled={!href ? disabled : undefined}
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
      {...(restProps as any)}
    >
      <State
        className="absolute inset-0 pointer-events-none"
        colorName={classNames(
          // Match text color for state layer usually
          variant === 'vibrant' || isActive
            ? 'on-tertiary-container'
            : 'on-secondary-container',
        )}
        stateClassName={'state-ripple-group-[menu-item]'}
      />

      {leadingIcon && (
        <div
          className={classNames(
            styles.itemIcon,
            styles.leadingIcon,
            'z-10 relative',
          )}
        >
          {React.isValidElement(leadingIcon) ? (
            leadingIcon
          ) : (
            <Icon icon={leadingIcon} />
          )}
        </div>
      )}
      <span className={classNames(styles.itemLabel, 'z-10 relative')}>
        {labelContent}
      </span>
      {effectiveTrailingIcon && (
        <div
          className={classNames(
            styles.itemIcon,
            styles.trailingIcon,
            'z-10 relative',
          )}
        >
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
    </ElementType>
  );
};
