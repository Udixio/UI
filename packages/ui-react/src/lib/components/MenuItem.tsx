import React, {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
} from 'react';
import {
  classNames,
  type ComponentClassName,
  getMenuItemRole,
  getMenuItemSelectionTransition,
  menuItemStyle,
  type MenuItemInterface,
  type MenuItemProps,
} from '@udixio/core';
import { iCheck } from '@udixio/icons-rounded-400/check';
import { StateLayer } from './StateLayer';
import { Icon } from '../icon';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { useMenuContext } from './menu-context';

export type { MenuItemSelectionType, MenuItemVariant } from '@udixio/core';

type ReactMenuItemOwnProps = MenuItemProps & {
  /** Custom visible label content; falls back to `label`. */
  children?: ReactNode;
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<MenuItemInterface>['className'];
};

type ReactMenuItemActionProps = ReactMenuItemOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | keyof ReactMenuItemOwnProps
    | 'children'
    | 'className'
    | 'onClick'
    | 'role'
    | 'aria-checked'
    | 'aria-disabled'
    | 'aria-selected'
  > & {
    href?: undefined;
    form?: ButtonHTMLAttributes<HTMLButtonElement>['form'];
    ref?: Ref<HTMLButtonElement>;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  };

type ReactMenuItemLinkProps = ReactMenuItemOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    | keyof ReactMenuItemOwnProps
    | 'children'
    | 'className'
    | 'onClick'
    | 'href'
    | 'role'
    | 'aria-checked'
    | 'aria-disabled'
    | 'aria-selected'
  > & {
  /** Navigation target; disabled links omit the native href. */
  href: string;
  form?: never;
  ref?: Ref<HTMLAnchorElement>;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type ReactMenuItemProps =
  | ReactMenuItemActionProps
  | ReactMenuItemLinkProps;

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
 * @limitations
 * - Positioning, dismissal, and nested-menu lifecycle are owned by the surrounding menu surface; use `MenuSubmenu` for nested menus.
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
      form,
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
        form={form}
        disabled={disabled}
        value={value}
      >
        {content}
      </button>
    );
  },
);

MenuItem.displayName = 'MenuItem';
