import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from 'react';
import {
  type ComponentClassName,
  type SplitButtonAction,
  type SplitButtonInterface,
  type SplitButtonProps,
  getButtonStateColor,
  getSplitButtonMenuVariant,
  getSplitButtonOpenTransition,
  isSplitButtonValid,
  splitButtonStyle,
} from '@udixio/core';
import {
  createSplitButtonController,
  type SplitButtonController,
} from '@udixio/core/dom';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';

type ReactSplitButtonOwnProps = SplitButtonProps & {
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<SplitButtonInterface>['className'];
  /** Runs the primary action. */
  onPrimaryAction?: () => void;
  /** Notifies selection before the menu closes. */
  onActionSelect?: (action: SplitButtonAction, index: number) => void;
  /** Notifies an accepted open-state request. */
  onOpenChange?: (open: boolean) => void;
  ref?: Ref<HTMLDivElement>;
};

export type ReactSplitButtonProps = ReactSplitButtonOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    | keyof ReactSplitButtonOwnProps
    | 'children'
    | 'className'
    | 'onClick'
    | 'role'
    | 'aria-label'
  >;

export const useSplitButtonStyle = createUseStyle(splitButtonStyle);

/**
 * A primary action paired with a menu button for related actions.
 * @status beta
 * @category Action
 * @devx
 * - Composes the shared `Button` and `IconButton` primitives for its two actions.
 * - Provide `label` or an `icon` for the primary action; icon-only usage also requires `accessibleLabel`.
 * - `menuLabel` names both the trailing menu button and its popup.
 * - Both prop bags forward primitive-specific options. SplitButton supplies each part's content and coordinates size, variant, shape, and disabled state.
 * - Each button morphs only its own inner corners on hover, focus-visible, and
 *   press. While the menu is open, only the trailing button keeps its expanded
 *   shape and selected state layer.
 * - Each action has a unique, non-empty `id` and visible `label`; the action model is shared by all frameworks.
 * - `open` is controlled; `defaultOpen` initializes uncontrolled use.
 * @a11y
 * - The trailing IconButton exposes `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls`.
 * - Enter and Space open the menu; Arrow Down and Arrow Up open it at the first and last enabled actions.
 * - The menu supports the shared Menu keyboard model. Escape closes it and restores focus to the menu button.
 * - Both button parts keep a 48px minimum touch target and a visible focus outline.
 * @limitations
 * - The primary action is a button callback; use a separate Link for primary navigation.
 * - Nested menu actions are not supported. Use a separate popup composition for submenus.
 */
export const SplitButton = (props: ReactSplitButtonProps) => {
  const {
    label,
    icon,
    accessibleLabel,
    menuLabel,
    actions,
    variant = 'filled',
    size = 'small',
    primaryButtonProps,
    menuButtonProps,
    disabled = false,
    open,
    defaultOpen = false,
    className,
    onPrimaryAction,
    onActionSelect,
    onOpenChange,
    ref,
    ...nativeProps
  } = props;
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
    componentName: 'SplitButton',
    stateName: 'open',
  });
  const [initialFocus, setInitialFocus] = useState<'first' | 'last'>('first');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const controllerRef = useRef<SplitButtonController | null>(null);
  const menuId = useId();
  const hasPrimaryLabel = !!label?.trim();
  const isValid = isSplitButtonValid({
    label,
    icon,
    accessibleLabel,
    menuLabel,
    actions,
  });

  const requestOpen = useCallback(
    (reason: 'trigger' | 'keyboard' | 'dismiss') => {
      const transition = getSplitButtonOpenTransition({
        isOpen,
        disabled,
        reason,
      });
      if (!transition.blocked) setOpen(transition.nextOpen);
    },
    [disabled, isOpen, setOpen],
  );

  const dismissRef = useRef<() => void>(() => {});
  dismissRef.current = () => requestOpen('dismiss');

  useEffect(() => {
    const root = rootRef.current;
    const primaryButton = primaryButtonRef.current;
    const menuButton = menuButtonRef.current;
    const menuIcon = menuButton?.querySelector<HTMLElement>('.icon');
    if (!root || !primaryButton || !menuButton || !menuIcon) return;

    const controller = createSplitButtonController({
      root,
      primaryButton,
      menuButton,
      menuIcon,
      size,
      onDismiss: () => dismissRef.current(),
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [isValid, size]);

  useEffect(() => {
    controllerRef.current?.setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (disabled && isOpen) requestOpen('dismiss');
  }, [disabled, isOpen, requestOpen]);

  const styles = useSplitButtonStyle({
    label,
    icon,
    accessibleLabel,
    menuLabel,
    actions,
    variant,
    size,
    primaryButtonProps,
    menuButtonProps,
    disabled,
    open,
    defaultOpen,
    isOpen,
    className,
  });
  const stateColor = getButtonStateColor({
    variant,
    toggleable: false,
    isPressed: false,
  });

  if (!isValid) {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production'
    ) {
      console.error(
        'Udixio UI: <SplitButton> requires a non-empty `menuLabel`, actions with unique non-empty `id` and `label` values, and a primary `label` or `icon` (icon-only usage also requires `accessibleLabel`). Rendering nothing.',
      );
    }
    return null;
  }

  const handlePrimaryAction = () => {
    onPrimaryAction?.();
    if (isOpen) requestOpen('dismiss');
  };

  const handleMenuTriggerKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    setInitialFocus(event.key === 'ArrowUp' ? 'last' : 'first');
    requestOpen('keyboard');
  };

  const selectAction = (action: SplitButtonAction, index: number) => {
    if (disabled || action.disabled) return;
    onActionSelect?.(action, index);
    if (!action.href) controllerRef.current?.restoreFocusOnClose();
    requestOpen('dismiss');
  };

  return (
    <div
      {...nativeProps}
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={styles.splitButton}
      role="group"
      aria-label={hasPrimaryLabel ? label : (accessibleLabel ?? menuLabel)}
      data-open={isOpen}
    >
      <Button
        {...primaryButtonProps}
        ref={primaryButtonRef}
        className={{
          button: styles.primaryButton,
          touchTarget: styles.primaryTouchTarget,
          stateLayer: styles.primaryStateLayer,
          icon: styles.primaryIcon,
          label: styles.primaryLabel,
        }}
        type="button"
        label={(hasPrimaryLabel ? label : accessibleLabel)!}
        icon={icon}
        iconPosition="start"
        variant={variant}
        size={size}
        shape="rounded"
        shapeFeedback="none"
        disabled={disabled}
        aria-label={hasPrimaryLabel ? undefined : accessibleLabel || undefined}
        onClick={handlePrimaryAction}
      />

      <IconButton
        {...menuButtonProps}
        ref={menuButtonRef}
        className={{
          iconButton: styles.menuButton,
          touchTarget: styles.menuTouchTarget,
          stateLayer: styles.menuStateLayer,
          icon: styles.menuIcon,
        }}
        type="button"
        label={menuLabel}
        icon={iKeyboardArrowDown}
        variant={getSplitButtonMenuVariant(variant)}
        size={size}
        tooltip={menuButtonProps?.tooltip ?? false}
        stateColor={menuButtonProps?.stateColor ?? stateColor}
        shape="rounded"
        shapeFeedback="none"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => {
          setInitialFocus('first');
          requestOpen('trigger');
        }}
        onKeyDown={handleMenuTriggerKeyDown}
      />

      {isOpen && (
        <div id={menuId} className={styles.menuSurface} data-split-button-menu>
          <Menu
            purpose="actions"
            accessibleLabel={menuLabel}
            initialFocus={initialFocus}
          >
            {actions.map((action, index) => (
              <MenuItem
                key={action.id}
                label={action.label}
                leadingIcon={action.icon}
                href={action.href}
                disabled={disabled || action.disabled}
                onClick={() => selectAction(action, index)}
              />
            ))}
          </Menu>
        </div>
      )}
    </div>
  );
};

export type {
  SplitButtonAction,
  SplitButtonSize,
  SplitButtonVariant,
} from '@udixio/core';
