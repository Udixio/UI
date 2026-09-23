import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  splitToolbarActions,
  toolbarStyle,
  type AnchorPosition,
  type ReactProps,
  type ToolbarAction,
  type ToolbarInterface,
  type ToolbarMoreProps,
} from '@udixio/core';
import { iMoreVert } from '@udixio/icons-rounded-400/more_vert';
import { createUseStyle } from '../utils/create-use-style';
import { AnchorPositioner } from './AnchorPositioner';
import { IconButton } from './IconButton';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

export type ReactToolbarAction = ToolbarAction & {
  /** Runs when an action without an `href` is activated. */
  onClick?: () => void;
  /** Receives accepted toggle-state changes. */
  onToggle?: (pressed: boolean) => void;
};

export interface ReactToolbarMoreRenderProps {
  actions: readonly ReactToolbarAction[];
  label: string;
  icon: NonNullable<ToolbarMoreProps['icon']>;
  variant: NonNullable<ToolbarMoreProps['variant']>;
  size: NonNullable<ToolbarMoreProps['size']>;
  open: boolean;
  ariaHasPopup: 'menu';
  ariaExpanded: boolean;
  onClick: () => void;
}

export type ReactToolbarProps = Omit<
  ReactProps<ToolbarInterface>,
  'role' | 'actions'
> & {
  actions?: readonly ReactToolbarAction[];
  children?: ReactNode;
  /** Notifies consumers when the generated overflow menu opens or closes. */
  onMoreOpenChange?: (open: boolean) => void;
  /** Replaces the default overflow trigger while retaining the overflow menu. */
  renderMore?: (props: ReactToolbarMoreRenderProps) => ReactNode;
};

export const useToolbarStyle = createUseStyle(toolbarStyle);

/**
 * Toolbars group related actions in a docked or floating container.
 *
 * @status beta
 * @category Layout
 * @devx
 * - Compose `IconButton` children or pass `actions` for a data-driven action group.
 * - `maxVisible` moves the remaining actions into an automatic overflow menu;
 *   `responsive` derives the visible count from the toolbar width.
 * - `more` customizes the default overflow trigger and `renderMore` replaces its
 *   visual rendering while keeping the menu behavior.
 * - The generated overflow menu chooses above/below or left/right from the
 *   toolbar orientation and the trigger's viewport half; `morePosition` can
 *   force a placement.
 * - Descendant `IconButton` controls keep rounded press feedback in floating
 *   toolbars.
 * - Use `variant="floating"` for a compact surface and
 *   `orientation="vertical"` for a vertical action group.
 * @a11y
 * - Renders `role="toolbar"` and applies `aria-orientation="vertical"` for
 *   vertical layouts.
 * - The overflow trigger has an accessible label and the generated menu uses
 *   the labels from each action.
 * - Provide `accessibleLabel` or an `aria-labelledby` reference to name the
 *   toolbar; label each child control according to its own component API.
 * @limitations
 * - `actions` and `children` are alternative content modes; `actions` takes precedence.
 * - The toolbar does not implement roving focus or arrow-key navigation for its
 *   direct children. The overflow menu owns menu-item keyboard navigation.
 * - Composition children remain consumer-owned; use `IconButton size="small"`
 *   for the 48dp toolbar slots shown in the Material 3 design.
 */
export const Toolbar = (props: ReactToolbarProps) => {
  const {
    variant = 'docked',
    color = 'standard',
    orientation = 'horizontal',
    accessibleLabel,
    className,
    children,
    actions,
    onMoreOpenChange,
    maxVisible,
    responsive = false,
    itemWidth = 48,
    more,
    morePosition = 'auto',
    renderMore,
    ref,
    'aria-label': ariaLabel,
    'aria-orientation': ariaOrientation,
    ...restProps
  } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(
    Number.POSITIVE_INFINITY,
  );
  const [open, setOpen] = useState(false);
  const styles = useToolbarStyle({
    variant,
    color,
    orientation,
    accessibleLabel,
    actions,
    maxVisible,
    responsive,
    itemWidth,
    more,
    morePosition,
    isOverflowOpen: open,
    className,
  });

  useEffect(() => {
    if (!responsive || actions === undefined || !rootRef.current) return;
    const root = rootRef.current;
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [actions, responsive, itemWidth]);

  const split = useMemo(
    () =>
      splitToolbarActions({
        actions: actions ?? [],
        maxVisible,
        responsive,
        availableWidth,
        itemWidth,
      }),
    [actions, availableWidth, itemWidth, maxVisible, responsive],
  );
  const visibleActions = split.visible as readonly ReactToolbarAction[];
  const overflowActions = split.overflow as readonly ReactToolbarAction[];
  const moreLabel = more?.label ?? 'More actions';
  const moreIcon = more?.icon ?? iMoreVert;
  const moreVariant = more?.variant ?? 'standard';
  const moreSize = more?.size ?? 'small';

  useEffect(() => {
    if (split.overflow.length === 0 && open) {
      setOpen(false);
      onMoreOpenChange?.(false);
    }
  }, [onMoreOpenChange, open, split.overflow.length]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      onMoreOpenChange?.(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      onMoreOpenChange?.(false);
      triggerRef.current?.querySelector<HTMLElement>('button, a')?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onMoreOpenChange, open]);

  const setRootRef = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const runAction = (action: ReactToolbarAction) => {
    if (action.href === undefined) action.onClick?.();
  };

  const selectAction = (action: ReactToolbarAction) => {
    if (action.disabled) return;
    runAction(action);
    setOpen(false);
    onMoreOpenChange?.(false);
  };

  const toggleMore = () => {
    setOpen((current) => {
      const next = !current;
      onMoreOpenChange?.(next);
      return next;
    });
  };

  const actionButtons = visibleActions.map((action) => (
    <IconButton
      key={action.id}
      label={action.label}
      icon={action.icon}
      tooltip={action.tooltip}
      pressedIcon={action.pressedIcon}
      variant={action.variant}
      size={action.size ?? 'small'}
      width={action.width}
      disabled={action.disabled}
      shape={action.shape}
      shapeFeedback={action.shapeFeedback}
      transition={action.transition}
      toggleable={action.toggleable}
      pressed={action.pressed}
      defaultPressed={action.defaultPressed}
      href={action.href}
      onClick={() => runAction(action)}
      onPressedChange={action.onToggle}
    />
  ));

  const moreRenderProps: ReactToolbarMoreRenderProps = {
    actions: split.overflow,
    label: moreLabel,
    icon: moreIcon,
    variant: moreVariant,
    size: moreSize,
    open,
    ariaHasPopup: 'menu',
    ariaExpanded: open,
    onClick: toggleMore,
  };

  const moreTrigger = renderMore ? (
    renderMore(moreRenderProps)
  ) : (
    <IconButton
      label={moreLabel}
      icon={moreIcon}
      tooltip={false}
      variant={moreVariant}
      size={moreSize}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={toggleMore}
    />
  );

  return (
    <div
      {...restProps}
      ref={setRootRef}
      className={styles.toolbar}
      role="toolbar"
      data-udx-toolbar-variant={variant}
      data-udx-toolbar-orientation={orientation}
      aria-label={accessibleLabel ?? ariaLabel}
      aria-orientation={
        ariaOrientation ?? (orientation === 'vertical' ? 'vertical' : undefined)
      }
    >
      {actions === undefined ? children : actionButtons}
      {actions !== undefined && overflowActions.length > 0 && (
        <span ref={triggerRef} className="shrink-0">
          {moreTrigger}
        </span>
      )}
      {open && overflowActions.length > 0 && (
        <AnchorPositioner
          anchorRef={triggerRef}
          position={morePosition as AnchorPosition}
          autoAxis={orientation === 'vertical' ? 'horizontal' : 'vertical'}
        >
          <div ref={menuRef}>
            <Menu
              purpose="actions"
              accessibleLabel={moreLabel}
              initialFocus="first"
            >
              {overflowActions.map((action) => (
                <MenuItem
                  key={action.id}
                  label={action.label}
                  leadingIcon={action.icon}
                  href={action.href}
                  disabled={action.disabled}
                  onClick={() => selectAction(action)}
                />
              ))}
            </Menu>
          </div>
        </AnchorPositioner>
      )}
    </div>
  );
};
