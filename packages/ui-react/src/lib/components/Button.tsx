import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ComponentProps,
  CSSProperties,
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

/** React content accepted as the button's sole visible-content source. */
export type ReactButtonChildren = Exclude<
  ReactNode,
  boolean | null | undefined
>;

type ReactButtonContentConstraint =
  | {
      label: string;
      children?: never;
    }
  | {
      label?: never;
      children: ReactButtonChildren;
    };

type ReactButtonOwnProps = Omit<ButtonProps, 'label'> & {
  /** Visible text content. Do not combine with `children`. */
  label?: string;
  /** Custom visible content. Use `aria-label` when it has no accessible text. */
  children?: ReactButtonChildren;
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<ButtonInterface>['className'];
  /** Notifies an accepted toggle-state request. */
  onPressedChange?: (pressed: boolean) => void;
};

type ReactButtonActionProps = ReactButtonOwnProps &
  ReactButtonContentConstraint &
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
  ReactButtonContentConstraint &
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
    children: _children,
    className: _className,
    defaultPressed: _defaultPressed,
    disabled: _disabled,
    edgeAligned: _edgeAligned,
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
    shapeFeedback: _shapeFeedback,
    size: _size,
    toggleable: _toggleable,
    transition: _transition,
    type: _type,
    variant: _variant,
    ...nativeProps
  } = props;

  void {
    _children,
    _className,
    _defaultPressed,
    _disabled,
    _edgeAligned,
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
    _shapeFeedback,
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
 * @status stable
 * @category Action
 * @devx
 * - Requires exactly one visible-content source: `label` or children.
 * - Custom non-text children require an explicit accessible name such as `aria-label`.
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
    edgeAligned = true,
    className,
    iconPosition = 'start',
    loading = false,
    shape = 'rounded',
    toggleable = false,
    pressed,
    defaultPressed = false,
    onPressedChange,
    size = 'medium',
    shapeFeedback = 'morph',
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
        shapeFeedback,
        isPressed,
        disabled: disabled || loading,
        transition,
      }),
    [disabled, isPressed, loading, shape, shapeFeedback, size, transition],
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
    shapeFeedback,
    transition,
    size,
    edgeAligned,
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
        'Udixio UI: <Button> requires one non-empty `label` or `children` content source. Rendering nothing.',
      );
    }
    return null;
  }

  const iconElement = icon ? (
    <Icon icon={icon} className={styles.icon} />
  ) : null;

  const content = (
    <>
      <span className={styles.touchTarget}></span>
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
        <span
          aria-hidden="true"
          className={
            '!absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2'
          }
        >
          <ProgressIndicator
            className={() => ({
              progressIndicator: 'h-6 w-6',
              // `activeIndicator` always carries its own `stroke-primary`
              // class, which wins over an inherited `stroke` value from an
              // ancestor's inline style. Overriding it directly (with
              // `!important`) through a CSS variable is what actually lets
              // the color apply, matching the `--state-color` pattern used
              // by the shared state layer.
              activeIndicator: '!stroke-[var(--button-progress-color)]',
            })}
            aria-hidden="true"
            style={
              {
                '--button-progress-color': getButtonProgressColor({
                  variant,
                  disabled,
                  toggleable: isToggleButton,
                  isPressed,
                }),
              } as CSSProperties
            }
            variant={'circular-indeterminate'}
          />
        </span>
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
