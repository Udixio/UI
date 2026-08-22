import { type HTMLAttributes, type Ref, useEffect, useId, useRef } from 'react';
import {
  type ComponentClassName,
  DEFAULT_FAB_MENU_CLOSE_ICON,
  type FabMenuAction,
  type FabMenuInterface,
  type FabMenuProps,
  fabMenuStyle,
} from '@udixio/core';
import {
  createFabMenuController,
  type FabMenuController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { Fab } from './Fab';
import { Button } from './Button';

export type { FabMenuAction, FabMenuVariant } from '@udixio/core';

type ReactFabMenuOwnProps = FabMenuProps & {
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<FabMenuInterface>['className'];
  /** Notifies an accepted open-state request. */
  onOpenChange?: (open: boolean) => void;
  /** Notifies selection before the menu closes. */
  onActionSelect?: (action: FabMenuAction, index: number) => void;
  ref?: Ref<HTMLDivElement>;
};

export type ReactFabMenuProps = ReactFabMenuOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    keyof ReactFabMenuOwnProps | 'children' | 'className'
  >;

export const useFabMenuStyle = createUseStyle(fabMenuStyle);

/**
 * FabMenu exposes related primary actions from one toggleable FAB.
 *
 * @status stable
 * @category Action
 * @devx
 * - Uses the framework-independent `actions` model instead of framework-specific children.
 * - `open` is controlled; `defaultOpen` initializes uncontrolled usage.
 * - Opening contracts every trigger size to a small icon-only close control while preserving the closed footprint.
 * - Action choreography is implemented once with Motion JavaScript in `@udixio/core/dom`.
 * @a11y
 * - The trigger exposes `aria-expanded`/`aria-controls`.
 * - Opening focuses the first enabled action; Escape closes and restores trigger focus.
 * - Outside press and selection close the group without applying false ARIA menu semantics.
 * - Reduced-motion preference keeps state changes immediate and fully perceivable.
 * @limitations
 * - Consumers own action-specific side effects through `onActionSelect`.
 */
export const FabMenu = (props: ReactFabMenuProps) => {
  const {
    label,
    icon,
    actions,
    closeIcon = DEFAULT_FAB_MENU_CLOSE_ICON,
    closeLabel = `Close ${label}`,
    actionsLabel = `${label} actions`,
    variant = 'primary',
    size = 'small',
    extended = false,
    disabled = false,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onActionSelect,
    className,
    ref,
    ...nativeProps
  } = props;
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    componentName: 'FabMenu',
    stateName: 'open',
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<FabMenuController>(null);
  const panelId = `fab-menu-${useId().replace(/:/g, '')}`;
  const hasAccessibleLabel = label.trim() !== '';
  const styles = useFabMenuStyle({
    label,
    icon,
    actions,
    closeIcon,
    closeLabel,
    actionsLabel,
    variant,
    size,
    extended,
    disabled,
    open: openProp,
    defaultOpen,
    isOpen: open,
    className,
  });

  useEffect(() => {
    if (
      !hasAccessibleLabel ||
      !rootRef.current ||
      !triggerRef.current ||
      !panelRef.current
    ) {
      return;
    }

    const controller = createFabMenuController({
      root: rootRef.current,
      trigger: triggerRef.current,
      panel: panelRef.current,
      onDismiss: () => setOpen(false),
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [hasAccessibleLabel, setOpen]);

  useEffect(() => {
    controllerRef.current?.setOpen(open);
  }, [open]);

  const selectAction = (action: FabMenuAction, index: number) => {
    if (disabled || action.disabled) return;
    onActionSelect?.(action, index);
    controllerRef.current?.restoreFocusOnClose();
    setOpen(false);
  };
  const triggerVariant = `${variant}Container` as const;

  if (!hasAccessibleLabel) {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production'
    ) {
      console.error(
        'Udixio UI: <FabMenu> requires a non-empty `label`. Rendering nothing.',
      );
    }
    return null;
  }

  return (
    <div
      {...nativeProps}
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={styles.fabMenu}
      data-open={open}
    >
      <span className={styles.triggerSizer} aria-hidden="true" inert>
        <Fab
          label={label}
          icon={icon}
          variant={triggerVariant}
          size={size}
          extended={extended}
          disabled
          tabIndex={-1}
        />
      </span>

      <span className={styles.triggerPositioner}>
        <Fab
          ref={triggerRef}
          label={open ? closeLabel : label}
          icon={open ? closeIcon : icon}
          variant={open ? variant : triggerVariant}
          size={open ? 'medium' : size}
          extended={extended && !open}
          disabled={disabled}
          className={styles.fab}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        />
      </span>

      <div
        ref={panelRef}
        id={panelId}
        className={styles.actions}
        role="group"
        aria-label={actionsLabel}
        aria-hidden={!open}
        inert={!open}
      >
        {actions.map((action, index) => {
          const actionClassName = () => ({
            button: styles.action,
            stateLayer: styles.actionStateLayer,
          });
          const sharedActionProps = {
            label: action.label,
            icon: action.icon,
            disabled: disabled || action.disabled,
            variant: 'filled' as const,
            shape: 'rounded' as const,
            className: actionClassName,
          };

          return (
            <span
              key={action.id}
              className={styles.actionContainer}
              data-fab-menu-action=""
            >
              {action.href ? (
                <Button
                  {...sharedActionProps}
                  href={action.href}
                  onClick={() => selectAction(action, index)}
                />
              ) : (
                <Button
                  {...sharedActionProps}
                  onClick={() => selectAction(action, index)}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};
