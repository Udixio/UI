import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  classNames,
  menuItemStyle,
  mergeClassNames,
  type ComponentClassName,
  type Icon as IconDefinition,
  type MenuItemInterface,
  type MenuVariant,
} from '@udixio/core';
import {
  createAnchorPositionerController,
  createMenuSubmenuController,
  createMenuTransitionController,
  type MenuTransitionController,
} from '@udixio/core/dom';
import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
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
  /** Renders the nested menu only while the submenu is open. By default it stays in the DOM, hidden, so its links are in the server HTML. */
  lazy?: boolean;
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
 * - The nested menu stays in the DOM while closed, hidden, so its links are in the server HTML. Pass `lazy` for heavy content that should render only while open.
 * - Opening, the nested menu grows from the side of its trigger (scale 0.8 to 1 on the fast spatial spring, fade on the fast effects spring); it leaves faster, on the fast effects spring.
 * @a11y
 * - Exposes `aria-haspopup="menu"` and `aria-expanded` on its trigger.
 * - Arrow Right (Arrow Left in RTL) opens and focuses the first item; the opposite arrow or Escape closes and restores trigger focus.
 * - Pointer hover opens the submenu; clicking an action inside it closes that submenu.
 * - A closing submenu is inert at once and hidden once its exit has played; under reduced motion it opens and closes at once.
 * @limitations
 * - Use only in action menus, not in `purpose="selection"` listboxes.
 */
export const MenuSubmenu = ({
  label,
  leadingIcon,
  disabled = false,
  variant,
  accessibleLabel,
  lazy = false,
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
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  // Whether the closed nested menu has finished its exit: until then it stays shown (inert), then it is hidden.
  const [exited, setExited] = useState(true);
  const transitionRef = useRef<MenuTransitionController | null>(null);
  const shown = open || !exited;
  openRef.current = open;
  if (open && exited) setExited(false);

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

  // One motion per nested menu element: it grows from the trigger as it opens and shrinks back as it closes.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!surface || !menu || !trigger) return;
    const transition = createMenuTransitionController({
      menu,
      anchor: trigger,
      onExited: () => {
        if (!openRef.current) setExited(true);
      },
    });
    transitionRef.current = transition;
    return () => {
      transition.destroy();
      if (transitionRef.current === transition) transitionRef.current = null;
    };
  }, [surface]);

  // The surface is positioned against the trigger while it is shown, open or
  // leaving, before the first paint of the open state, so it never shows at
  // its in-flow place. The motion measures the placed menu for its origin.
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (!shown || !surface || !trigger) return;
    const positioned = createAnchorPositionerController({
      anchor: trigger,
      floating: surface,
      position: () => 'auto',
      autoAxis: () => 'horizontal',
      inheritThemeScope: false,
    });
    transitionRef.current?.setOpen(open);
    return () => positioned.destroy();
  }, [open, shown, surface]);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const controller = createMenuSubmenuController({
      trigger,
      menu: open
        ? (surface?.querySelector<HTMLElement>('[role="menu"]') ?? undefined)
        : undefined,
      getMenu: () => surface?.querySelector<HTMLElement>('[role="menu"]'),
      interactionState: interactionStateRef.current,
      isOpen: () => openRef.current,
      onOpen: () => {
        if (!disabled) setOpen(true);
      },
      onClose: () => setOpen(false),
    });
    return () => controller.destroy();
  }, [disabled, surface, open]);

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
      {(!lazy || shown) && (
        <div
          ref={setSurface}
          hidden={!shown}
          inert={!open}
          style={{ zIndex: 50 }}
          data-menu-submenu-surface
        >
          <Menu
            ref={menuRef}
            purpose="actions"
            variant={resolvedVariant}
            accessibleLabel={accessibleLabel ?? `${label} submenu`}
          >
            {children}
          </Menu>
        </div>
      )}
    </div>
  );
};
