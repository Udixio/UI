import { useEffect, useId, useRef, type HTMLAttributes, type Ref } from 'react';
import {
  classNames,
  DEFAULT_FAB_MENU_CLOSE_ICON,
  fabMenuStyle,
  type ComponentClassName,
  type FabMenuAction,
  type FabMenuInterface,
  type FabMenuProps,
} from '@udixio/core';
import { createFabMenuController } from '@udixio/core/dom';
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
 * @a11y
 * - The trigger exposes `aria-expanded`/`aria-controls`.
 * - Opening focuses the first enabled action; Escape closes and restores trigger focus.
 * - Outside press and selection close the group without applying false ARIA menu semantics.
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
    size = 'medium',
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
      !open ||
      !rootRef.current ||
      !triggerRef.current ||
      !panelRef.current
    ) {
      return;
    }

    return createFabMenuController({
      root: rootRef.current,
      trigger: triggerRef.current,
      panel: panelRef.current,
      onDismiss: () => setOpen(false),
    }).destroy;
  }, [hasAccessibleLabel, open, setOpen]);

  const restoreTriggerFocus = () => {
    queueMicrotask(() => triggerRef.current?.focus());
  };
  const selectAction = (action: FabMenuAction, index: number) => {
    if (disabled || action.disabled) return;
    onActionSelect?.(action, index);
    setOpen(false);
    restoreTriggerFocus();
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
    >
      <Fab
        ref={triggerRef}
        label={open ? closeLabel : label}
        icon={open ? closeIcon : icon}
        variant={triggerVariant}
        size={size}
        extended={extended}
        disabled={disabled}
        className={styles.fab}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      />

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className={styles.actions}
          role="group"
          aria-label={actionsLabel}
        >
          {actions.map((action, index) => {
            const actionClassName = () => ({
              button: classNames(
                styles.action,
                variant === 'primary' &&
                  'bg-primary-container text-on-primary-container',
                variant === 'secondary' &&
                  'bg-secondary-container text-on-secondary-container',
                variant === 'tertiary' &&
                  'bg-tertiary-container text-on-tertiary-container',
              ),
            });
            const sharedActionProps = {
              label: action.label,
              icon: action.icon,
              disabled: disabled || action.disabled,
              variant: 'filled' as const,
              shape: 'rounded' as const,
              className: actionClassName,
              'data-fab-menu-action': '',
            };

            return action.href ? (
              <Button
                key={action.id}
                {...sharedActionProps}
                href={action.href}
                onClick={() => selectAction(action, index)}
              />
            ) : (
              <Button
                key={action.id}
                {...sharedActionProps}
                onClick={() => selectAction(action, index)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
