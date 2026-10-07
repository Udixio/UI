import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  classNames,
  menuItemStyle,
  mergeClassNames,
  type ComponentClassName,
  type Icon as IconDefinition,
  type MenuItemInterface,
  type MenuVariant,
} from '@udixio/core';
import { createMenuSubmenuController } from '@udixio/core/dom';
import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
import { AnchorPositioner } from './AnchorPositioner';
import { Icon } from '../icon';
import { StateLayer } from './StateLayer';
import { createUseStyle } from '../utils/create-use-style';
import { useMenuContext } from './menu-context';
import { Menu } from './Menu';

export type ReactMenuSubmenuProps = {
  /** Visible name for the submenu trigger. */
  label: string;
  /** Optional icon displayed before the trigger label. */
  leadingIcon?: IconDefinition;
  /** Prevents opening the nested menu and removes the trigger from navigation. */
  disabled?: boolean;
  /** Overrides the color treatment inherited from the parent Menu. */
  variant?: MenuVariant;
  /** Accessible name for the nested menu; defaults to "{label} submenu". */
  accessibleLabel?: string;
  /** MenuItem, MenuGroup, and MenuHeadline content for the nested menu. */
  children?: ReactNode;
  /** Classes merged onto the submenu trigger. */
  className?: string;
  /** Classes applied to the submenu trigger using the MenuItem style contract. */
  triggerClasses?: ComponentClassName<MenuItemInterface>['className'];
};

const useMenuSubmenuTriggerStyle = createUseStyle(menuItemStyle);

/**
 * An action menu item that opens a nested actions menu.
 * @status beta
 * @category Selection
 * @parent menu
 * @devx
 * - Place it inside a `Menu purpose="actions"` and compose `MenuItem` children inside it.
 * - The nested menu inherits the parent variant and is labelled from `label` unless `accessibleLabel` is provided.
 * @a11y
 * - Exposes `aria-haspopup="menu"` and `aria-expanded` on its trigger.
 * - Arrow Right (Arrow Left in RTL) opens and focuses the first item; the opposite arrow or Escape closes and restores trigger focus.
 * - Pointer hover opens the submenu; clicking an action inside it closes that submenu.
 * @limitations
 * - Use only in action menus, not in `purpose="selection"` listboxes.
 */
export const MenuSubmenu = ({
  label,
  leadingIcon,
  disabled = false,
  variant,
  accessibleLabel,
  children,
  className,
  triggerClasses,
}: ReactMenuSubmenuProps) => {
  const context = useMenuContext();
  const resolvedVariant = variant ?? context.variant;
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const interactionStateRef = useRef({ openedByHover: false });
  const [menuContainer, setMenuContainer] = useState<HTMLDivElement | null>(
    null,
  );
  openRef.current = open;

  const styles = useMenuSubmenuTriggerStyle({
    label,
    value: undefined,
    leadingIcon,
    trailingIcon: iChevronRight,
    disabled,
    variant: resolvedVariant,
    selectionType: 'none',
    selected: undefined,
    defaultSelected: false,
    onSelectedChange: undefined,
    isSelected: false,
    purpose: 'actions',
    className: mergeClassNames<MenuItemInterface>(
      'menuItem',
      triggerClasses,
      className,
    ),
  });

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const controller = createMenuSubmenuController({
      trigger,
      menu: open
        ? (menuContainer?.querySelector<HTMLElement>('[role="menu"]') ??
          undefined)
        : undefined,
      getMenu: () => menuContainer?.querySelector<HTMLElement>('[role="menu"]'),
      interactionState: interactionStateRef.current,
      isOpen: () => openRef.current,
      onOpen: () => {
        if (!disabled) setOpen(true);
      },
      onClose: () => setOpen(false),
    });
    return () => controller.destroy();
  }, [disabled, menuContainer, open]);

  const parentRootId =
    triggerRef.current?.closest<HTMLElement>('[role="menu"]')?.dataset
      .menuRootId;

  return (
    <div style={{ display: 'contents' }} data-menu-submenu>
      <button
        ref={triggerRef}
        type="button"
        className={styles.menuItem}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        data-menu-disabled={disabled ? 'true' : undefined}
        data-menu-leading-icon={leadingIcon ? 'true' : undefined}
        disabled={disabled}
      >
        {!disabled && (
          <StateLayer
            className={styles.stateLayer}
            colorName={
              resolvedVariant === 'vibrant'
                ? 'on-tertiary-container'
                : 'on-secondary-container'
            }
            stateClassName="state-ripple-group-[menu-item]"
          />
        )}
        {leadingIcon ? (
          <span
            aria-hidden="true"
            data-menu-leading-icon-slot
            style={{ display: 'none' }}
            className={classNames(
              styles.itemIcon,
              styles.leadingIcon,
              'z-10 relative',
            )}
          >
            <Icon icon={leadingIcon} />
          </span>
        ) : (
          <span
            aria-hidden="true"
            data-menu-leading-icon-slot
            className={classNames(
              styles.itemIcon,
              styles.leadingIcon,
              'z-10 relative',
            )}
          />
        )}
        <span className={classNames(styles.itemLabel, 'z-10 relative')}>
          {label}
        </span>
        <span
          aria-hidden="true"
          className={classNames(
            styles.itemIcon,
            styles.trailingIcon,
            'z-10 relative rtl:rotate-180',
          )}
        >
          <Icon icon={iChevronRight} />
        </span>
      </button>
      {open && (
        <AnchorPositioner
          anchorRef={triggerRef}
          position="auto"
          autoAxis="horizontal"
          data-menu-root-id={parentRootId}
          data-menu-submenu-surface
        >
          <div ref={setMenuContainer} style={{ display: 'contents' }}>
            <Menu
              ref={menuRef}
              purpose="actions"
              variant={resolvedVariant}
              accessibleLabel={accessibleLabel ?? `${label} submenu`}
            >
              {children}
            </Menu>
          </div>
        </AnchorPositioner>
      )}
    </div>
  );
};
