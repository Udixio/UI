import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
  MouseEventHandler,
  ReactNode,
  Ref,
  SyntheticEvent,
} from 'react';
import {
  buttonStyle,
  getButtonProgressColor,
  getButtonPressTransition,
  getButtonShapeTransition,
  getButtonStateColor,
  resolveButtonIconPosition,
  type ButtonProps,
  type ButtonInterface,
  type ComponentClassName,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { Icon } from '../icon';
import { ProgressIndicator } from './ProgressIndicator';
import { State } from '../effects';
import { useMemo } from 'react';

type ReactButtonOwnProps = ButtonProps & {
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<ButtonInterface>['className'];
  /** Visible React content; `label` remains an accessible-name fallback. */
  children?: ReactNode;
  /** Notifies an accepted toggle-state request. */
  onPressedChange?: (pressed: boolean) => void;
};

type ReactButtonActionProps = ReactButtonOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ReactButtonOwnProps | 'children' | 'className' | 'onClick'
  > & {
    href?: undefined;
    /** Ref forwarded to the native button element. */
    ref?: Ref<HTMLButtonElement>;
    /** Handles clicks accepted by the button interaction contract. */
    onClick?: MouseEventHandler<HTMLButtonElement>;
  };

type ReactButtonLinkProps = ReactButtonOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof ReactButtonOwnProps | 'children' | 'className' | 'onClick' | 'href'
  > & {
    /** Navigation destination; switches the native element from button to link. */
    href: string;
    /** Ref forwarded to the native anchor element. */
    ref?: Ref<HTMLAnchorElement>;
    /** Handles clicks accepted by the link interaction contract. */
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  };

export type ReactButtonProps = ReactButtonActionProps | ReactButtonLinkProps;

type NativeActionProps = Omit<
  ComponentProps<'button'>,
  keyof ReactButtonOwnProps | 'children' | 'className' | 'onClick'
>;
type NativeLinkProps = Omit<
  ComponentProps<'a'>,
  keyof ReactButtonOwnProps | 'children' | 'className' | 'onClick' | 'href'
>;

function getNativeElementProps(
  props: ReactButtonActionProps,
): NativeActionProps;
function getNativeElementProps(props: ReactButtonLinkProps): NativeLinkProps;
function getNativeElementProps(props: ReactButtonProps) {
  const {
    allowShapeTransformation: _allowShapeTransformation,
    children: _children,
    className: _className,
    defaultPressed: _defaultPressed,
    disabled: _disabled,
    disableTextMargins: _disableTextMargins,
    href: _href,
    icon: _icon,
    iconPosition: _iconPosition,
    label: _label,
    loading: _loading,
    onClick: _onClick,
    onPressedChange: _onPressedChange,
    pressed: _pressed,
    ref: _ref,
    shape: _shape,
    size: _size,
    toggleable: _toggleable,
    transition: _transition,
    type: _type,
    variant: _variant,
    ...nativeProps
  } = props;

  void {
    _allowShapeTransformation,
    _children,
    _className,
    _defaultPressed,
    _disabled,
    _disableTextMargins,
    _href,
    _icon,
    _iconPosition,
    _label,
    _loading,
    _onClick,
    _onPressedChange,
    _pressed,
    _ref,
    _shape,
    _size,
    _toggleable,
    _transition,
    _type,
    _variant,
  };

  return nativeProps;
}

export const useButtonStyle = createUseStyle(buttonStyle);

/**
 * Buttons prompt most actions in a UI
 * @status beta
 * @category Action
 * @devx
 * - Requires `label` or children; used for visible text and a11y.
 * - `pressed` is controlled; `defaultPressed` initializes uncontrolled usage.
 * - `toggleable` enables `aria-pressed` and `onPressedChange` on action buttons.
 * - `type` defaults to `'button'` to prevent accidental form submits.
 * @a11y
 * - Uses native button/link semantics and preserves its accessible name while loading.
 * - Provides a 48px touch target and a visible `:focus-visible` outline.
 * @limitations
 * - When `href` is set with `disabled`, the link is made inert via `aria-disabled` and `tabIndex={-1}`.
 * - Navigation links ignore toggle state; use `aria-current` for the current destination.
 */
export const Button = (props: ReactButtonProps) => {
  const {
    variant = 'filled',
    disabled = false,
    type = 'button',
    icon,
    href,
    label,
    disableTextMargins,
    className,
    iconPosition = 'start',
    loading = false,
    shape = 'rounded',
    toggleable = false,
    pressed,
    defaultPressed = false,
    onPressedChange,
    size = 'medium',
    allowShapeTransformation = true,
    transition,
    children,
  } = props;
  const hasCustomContent =
    children !== undefined &&
    children !== null &&
    typeof children !== 'boolean' &&
    children !== '';
  const resolvedLabel = hasCustomContent ? children : label;
  const hasVisibleLabel =
    resolvedLabel !== undefined &&
    resolvedLabel !== null &&
    resolvedLabel !== '';
  const resolvedIconPosition = resolveButtonIconPosition(iconPosition);
  const isToggleButton = toggleable && href === undefined;
  const [pressedState, setPressedState] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
    componentName: 'Button',
    stateName: 'pressed',
  });
  const isPressed = isToggleButton && pressedState;

  const shapeTransition = useMemo(
    () =>
      getButtonShapeTransition({
        size,
        shape,
        allowShapeTransformation,
        isPressed,
        disabled: disabled || loading,
        transition,
      }),
    [
      allowShapeTransformation,
      disabled,
      isPressed,
      loading,
      shape,
      size,
      transition,
    ],
  );

  const handlePress = (event: SyntheticEvent): boolean => {
    const interaction = getButtonPressTransition({
      disabled,
      loading,
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

  const styles = useButtonStyle({
    type,
    icon,
    iconPosition,
    allowShapeTransformation,
    transition,
    size,
    disableTextMargins,
    shape,
    disabled,
    loading,
    variant,
    className,
    isPressed,
    toggleable: isToggleButton,
    pressed,
    defaultPressed,
    label,
  });

  if (!hasVisibleLabel) {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production'
    ) {
      console.error(
        'Udixio UI: <Button> requires either a `label` prop or `children` content. Rendering nothing.',
      );
    }
    return null;
  }

  const iconElement = icon ? (
    <Icon icon={icon} className={styles.icon} />
  ) : null;

  const content = (
    <>
      <div className={styles.touchTarget}></div>
      <State
        shapeTransition={shapeTransition}
        className={styles.stateLayer}
        colorName={getButtonStateColor({
          variant,
          toggleable: isToggleButton,
          isPressed,
        })}
        stateClassName={'state-ripple-group-[button]'}
      />

      {resolvedIconPosition === 'start' && iconElement}
      {loading && (
        <div
          aria-hidden="true"
          className={
            '!absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2'
          }
        >
          <ProgressIndicator
            className={() => ({
              progressIndicator: 'h-6 w-6',
            })}
            aria-hidden="true"
            style={{
              stroke: getButtonProgressColor({
                variant,
                disabled,
                toggleable: isToggleButton,
                isPressed,
              }),
            }}
            variant={'circular-indeterminate'}
          />
        </div>
      )}
      <span className={styles.label}>{resolvedLabel}</span>
      {resolvedIconPosition === 'end' && iconElement}
    </>
  );

  const sharedElementProps = {
    className: styles.button,
    'aria-pressed': isToggleButton ? isPressed : undefined,
    'aria-busy': loading || undefined,
  };
  const interactionBlocked = disabled || loading;

  if (props.href !== undefined) {
    const nativeProps = getNativeElementProps(props);
    return (
      <a
        ref={props.ref}
        {...nativeProps}
        {...sharedElementProps}
        href={interactionBlocked ? undefined : href}
        aria-disabled={interactionBlocked || undefined}
        tabIndex={interactionBlocked ? -1 : nativeProps.tabIndex}
        role={interactionBlocked ? 'link' : nativeProps.role}
        aria-label={
          nativeProps['aria-label'] ?? (hasCustomContent ? label : undefined)
        }
        onClick={(event) => {
          if (handlePress(event)) {
            props.onClick?.(event);
          }
        }}
      >
        {content}
      </a>
    );
  }

  const nativeProps = getNativeElementProps(props);
  return (
    <button
      ref={props.ref}
      {...nativeProps}
      {...sharedElementProps}
      type={type}
      disabled={interactionBlocked}
      aria-label={
        nativeProps['aria-label'] ?? (hasCustomContent ? label : undefined)
      }
      onClick={(event) => {
        if (handlePress(event)) {
          props.onClick?.(event);
        }
      }}
    >
      {content}
    </button>
  );
};
