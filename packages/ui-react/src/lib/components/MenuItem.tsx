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
import { StateLayer } from './StateLayer';
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
  /** Optional icon displayed before the label. Commands share this leading column when any command uses an icon; selection items keep their own indicator. */
  leadingIcon?: MenuItemProps['leadingIcon'];
  /** Optional decorative icon displayed after the label; use MenuSubmenu for a chevron that opens another menu. */
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
 * - Use `MenuSubmenu` when the row should open another action menu.
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
    const usesActionIconSlot =
      context.purpose === 'actions' && selectionType === 'none';
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
      'data-menu-leading-icon':
        usesActionIconSlot && leadingIcon ? 'true' : undefined,
      tabIndex: disabled ? -1 : 0,
      onClick: activate,
    };
    const content = (
      <>
        {!disabled && (
          <StateLayer
            className={styles.stateLayer}
            colorName={
              resolvedVariant === 'vibrant' || isSelected
                ? 'on-tertiary-container'
                : 'on-secondary-container'
            }
            stateClassName="state-ripple-group-[menu-item]"
          />
        )}
        {usesActionIconSlot ? (
          <span
            aria-hidden="true"
            data-menu-leading-icon-slot
            style={resolvedLeadingIcon ? undefined : { display: 'none' }}
            className={classNames(
              styles.itemIcon,
              styles.leadingIcon,
              'z-10 relative',
            )}
          >
            {resolvedLeadingIcon && <Icon icon={resolvedLeadingIcon} />}
          </span>
        ) : resolvedLeadingIcon ? (
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
        ) : null}
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
