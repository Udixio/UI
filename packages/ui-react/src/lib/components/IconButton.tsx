import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEventHandler,
  Ref,
  SyntheticEvent,
} from 'react';
import { useMemo } from 'react';
import {
  getIconButtonPressTransition,
  getIconButtonShapeTransition,
  getIconButtonStateColor,
  iconButtonStyle,
  type ComponentClassName,
  type IconButtonInterface,
  type IconButtonProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { Icon } from '../icon';
import { State } from '../effects';

export type {
  IconButtonSize,
  IconButtonVariant,
  IconButtonWidth,
} from '@udixio/core';

type ReactIconButtonOwnProps = IconButtonProps & {
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<IconButtonInterface>['className'];
  /** Notifies an accepted toggle-state request. */
  onPressedChange?: (pressed: boolean) => void;
};

type ReactIconButtonActionProps = ReactIconButtonOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ReactIconButtonOwnProps | 'children' | 'className' | 'onClick'
  > & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  };

type ReactIconButtonLinkProps = ReactIconButtonOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    | keyof ReactIconButtonOwnProps
    | 'children'
    | 'className'
    | 'onClick'
    | 'href'
  > & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  };

export type ReactIconButtonProps =
  | ReactIconButtonActionProps
  | ReactIconButtonLinkProps;

export const useIconButtonStyle = createUseStyle(iconButtonStyle);

/**
 * Icon buttons expose a frequent action through one unambiguous icon.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires `label` and `icon`; arbitrary children are not accepted.
 * - `pressed` is controlled; `defaultPressed` initializes uncontrolled usage.
 * - `toggleable` enables `aria-pressed` and `onPressedChange` on action buttons.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * @limitations
 * - Disabled links are inert and removed from the tab order.
 * - Navigation links ignore toggle state; use `aria-current` for the current destination.
 * - Compose an explicit Tooltip when visual hover/focus help is required.
 */
export const IconButton = (props: ReactIconButtonProps) => {
  const {
    variant = 'standard',
    disabled = false,
    label,
    icon,
    pressedIcon,
    size = 'medium',
    width = 'default',
    shape = 'rounded',
    shapeFeedback = 'morph',
    transition,
    toggleable = false,
    pressed,
    defaultPressed = false,
    onPressedChange,
    className,
  } = props;
  const isToggleButton = toggleable && props.href === undefined;
  const [pressedState, setPressedState] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
    componentName: 'IconButton',
    stateName: 'pressed',
  });
  const isPressed = isToggleButton && pressedState;
  const shapeTransition = useMemo(
    () =>
      getIconButtonShapeTransition({
        size,
        shape,
        shapeFeedback,
        isPressed,
        disabled,
        transition,
      }),
    [disabled, isPressed, shape, shapeFeedback, size, transition],
  );
  const styles = useIconButtonStyle({
    label,
    icon,
    pressedIcon,
    size,
    width,
    variant,
    disabled,
    shape,
    shapeFeedback,
    transition,
    toggleable: isToggleButton,
    pressed,
    defaultPressed,
    isPressed,
    className,
  });
  const hasAccessibleLabel = label.trim() !== '';

  const handlePress = (event: SyntheticEvent): boolean => {
    const interaction = getIconButtonPressTransition({
      disabled,
      toggleable: isToggleButton,
      isPressed,
    });

    if (interaction.blocked) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    if (interaction.nextPressed !== undefined) {
      setPressedState(interaction.nextPressed);
    }
    return true;
  };

  const content = (
    <>
      <span className={styles.touchTarget} />
      <State
        shapeTransition={shapeTransition}
        className={styles.stateLayer}
        colorName={getIconButtonStateColor({
          variant,
          toggleable: isToggleButton,
          isPressed,
        })}
        stateClassName="state-ripple-group-[icon-button]"
      />
      <Icon
        icon={isPressed && pressedIcon ? pressedIcon : icon}
        className={styles.icon}
      />
    </>
  );

  if (!hasAccessibleLabel) {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production'
    ) {
      console.error(
        'Udixio UI: <IconButton> requires a non-empty `label`. Rendering nothing.',
      );
    }
    return null;
  }

  if (props.href !== undefined) {
    const {
      className: _className,
      defaultPressed: _defaultPressed,
      disabled: _disabled,
      icon: _icon,
      label: _label,
      onClick,
      onPressedChange: _onPressedChange,
      pressed: _pressed,
      pressedIcon: _pressedIcon,
      ref,
      shape: _shape,
      shapeFeedback: _shapeFeedback,
      size: _size,
      toggleable: _toggleable,
      transition: _transition,
      variant: _variant,
      width: _width,
      ...nativeProps
    } = props;
    void {
      _className,
      _defaultPressed,
      _disabled,
      _icon,
      _label,
      _onPressedChange,
      _pressed,
      _pressedIcon,
      _shape,
      _shapeFeedback,
      _size,
      _toggleable,
      _transition,
      _variant,
      _width,
    };

    return (
      <a
        {...nativeProps}
        ref={ref}
        className={styles.iconButton}
        href={disabled ? undefined : props.href}
        aria-label={label}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : nativeProps.tabIndex}
        role={disabled ? 'link' : nativeProps.role}
        onClick={(event) => {
          if (handlePress(event)) onClick?.(event);
        }}
      >
        {content}
      </a>
    );
  }

  const {
    className: _className,
    defaultPressed: _defaultPressed,
    disabled: _disabled,
    icon: _icon,
    label: _label,
    onClick,
    onPressedChange: _onPressedChange,
    pressed: _pressed,
    pressedIcon: _pressedIcon,
    ref,
    shape: _shape,
    shapeFeedback: _shapeFeedback,
    size: _size,
    toggleable: _toggleable,
    transition: _transition,
    variant: _variant,
    width: _width,
    type = 'button',
    ...nativeProps
  } = props;
  void {
    _className,
    _defaultPressed,
    _disabled,
    _icon,
    _label,
    _onPressedChange,
    _pressed,
    _pressedIcon,
    _shape,
    _shapeFeedback,
    _size,
    _toggleable,
    _transition,
    _variant,
    _width,
  };

  return (
    <button
      {...nativeProps}
      ref={ref}
      type={type}
      disabled={disabled}
      className={styles.iconButton}
      aria-label={label}
      aria-pressed={isToggleButton ? isPressed : undefined}
      onClick={(event) => {
        if (handlePress(event)) onClick?.(event);
      }}
    >
      {content}
    </button>
  );
};
