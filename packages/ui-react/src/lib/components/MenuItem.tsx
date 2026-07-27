import React, { forwardRef, type ReactNode } from 'react';
import {
  classNames,
  getMenuItemRole,
  getMenuItemSelectionTransition,
  menuItemStyle,
  type MenuItemInterface,
  type MenuItemProps,
  type ReactProps,
} from '@udixio/core';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { State } from '../effects';
import { Icon } from '../icon';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { useMenuContext } from './menu-context';

export type { MenuItemSelectionType, MenuItemVariant } from '@udixio/core';

export type ReactMenuItemProps = Omit<
  ReactProps<MenuItemInterface>,
  | 'aria-checked'
  | 'aria-disabled'
  | 'aria-selected'
  | 'disabled'
  | 'leadingIcon'
  | 'role'
  | 'trailingIcon'
> & {
  /** Custom visible label content; falls back to `label`. */
  children?: ReactNode;
  /** Optional navigation target; disabled links omit the native href. */
  href?: string;
  /** Optional icon displayed before the label. */
  leadingIcon?: MenuItemProps['leadingIcon'];
  /** Optional icon displayed after the label. */
  trailingIcon?: MenuItemProps['trailingIcon'];
  /** Prevents activation, selection changes, and keyboard focus. */
  disabled?: MenuItemProps['disabled'];
};

export const useMenuItemStyle = createUseStyle(menuItemStyle);

/**
 * An action or selectable choice within a Menu.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx
 * - Use `selectionType`, `selected`, and `onSelectedChange` for controlled selection.
 * - Use `defaultSelected` when the item owns its initial selection state.
 * @a11y
 * - Resolves to `menuitem`, `menuitemradio`, `menuitemcheckbox`, or `option` from the parent Menu purpose.
 * - Disabled links are removed from navigation and expose `aria-disabled`.
 * @limitations
 * - Nested submenus require a separate popup composition.
 */
export const MenuItem = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ReactMenuItemProps
>(
  (
    {
      label,
      children,
      value,
      leadingIcon,
      trailingIcon,
      disabled = false,
      variant,
      href,
      selectionType: selectionTypeProp,
      selected,
      defaultSelected = false,
      onSelectedChange,
      className,
      onClick,
      ...restProps
    },
    forwardedRef,
  ) => {
    const context = useMenuContext();
    const selectionType =
      selectionTypeProp ??
      (context.purpose === 'selection' ? 'single' : 'none');
    const resolvedVariant = variant ?? context.variant;
    const [isSelected, setSelected] = useControllableState({
      value: selected,
      defaultValue: defaultSelected,
      onChange: onSelectedChange,
      componentName: 'MenuItem',
      stateName: 'selected',
    });
    const role = getMenuItemRole({
      purpose: context.purpose,
      selectionType,
    });
    const resolvedLeadingIcon =
      isSelected && selectionType !== 'none' ? iCheck : leadingIcon;
    const styles = useMenuItemStyle({
      label,
      value,
      leadingIcon,
      trailingIcon,
      disabled,
      variant: resolvedVariant,
      selectionType,
      selected,
      defaultSelected,
      onSelectedChange,
      isSelected,
      purpose: context.purpose,
      className,
    });

    const activate = (
      event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    ) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      const transition = getMenuItemSelectionTransition({
        disabled,
        selectionType,
        selected: isSelected,
      });
      if (transition.nextSelected !== undefined) {
        setSelected(transition.nextSelected);
      }
      (
        onClick as
          | React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
          | undefined
      )?.(event);
    };

    const sharedProps = {
      ...restProps,
      ref: forwardedRef,
      className: styles.menuItem,
      role,
      'aria-disabled': disabled || undefined,
      'aria-selected':
        role === 'option' ? (isSelected ? 'true' : 'false') : undefined,
      'aria-checked':
        role === 'menuitemcheckbox' || role === 'menuitemradio'
          ? isSelected
          : undefined,
      'data-menu-disabled': disabled ? 'true' : undefined,
      tabIndex: disabled ? -1 : 0,
      onClick: activate,
    };
    const content = (
      <>
        {!disabled && (
          <State
            className={styles.stateLayer}
            colorName={
              resolvedVariant === 'vibrant' || isSelected
                ? 'on-tertiary-container'
                : 'on-secondary-container'
            }
            stateClassName="state-ripple-group-[menu-item]"
          />
        )}
        {resolvedLeadingIcon && (
          <span
            aria-hidden="true"
            className={classNames(
              styles.itemIcon,
              styles.leadingIcon,
              'z-10 relative',
            )}
          >
            <Icon icon={resolvedLeadingIcon} />
          </span>
        )}
        <span className={classNames(styles.itemLabel, 'z-10 relative')}>
          {children ?? label}
        </span>
        {trailingIcon && (
          <span
            aria-hidden="true"
            className={classNames(
              styles.itemIcon,
              styles.trailingIcon,
              'z-10 relative',
            )}
          >
            <Icon icon={trailingIcon} />
          </span>
        )}
      </>
    );

    return href ? (
      <a
        {...(sharedProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        href={disabled ? undefined : href}
      >
        {content}
      </a>
    ) : (
      <button
        {...(sharedProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        type="button"
        disabled={disabled}
        value={value}
      >
        {content}
      </button>
    );
  },
);

MenuItem.displayName = 'MenuItem';
