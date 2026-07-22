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
  type ButtonProps,
  type ButtonInterface,
  type ComponentClassName,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { Icon } from '../icon';
import { ProgressIndicator } from './ProgressIndicator';
import { State } from '../effects';
import { useMemo, useRef } from 'react';

type ReactButtonOwnProps = ButtonProps &
  ComponentClassName<ButtonInterface> & {
    children?: ReactNode;
    onPressedChange?: (pressed: boolean) => void;
  };

type ReactButtonActionProps = ReactButtonOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ReactButtonOwnProps | 'children' | 'className' | 'onClick'
  > & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  };

type ReactButtonLinkProps = ReactButtonOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof ReactButtonOwnProps | 'children' | 'className' | 'onClick' | 'href'
  > & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
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
 * - `toggleable` enables `aria-pressed` and `onPressedChange` notifications.
 * - `type` defaults to `'button'` to prevent accidental form submits.
 * @limitations
 * - When `href` is set with `disabled`, the link is made inert via `aria-disabled` and `tabIndex={-1}`.
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
    iconPosition = 'left',
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
  const resolvedLabel = children ?? label;

  const defaultButtonRef = useRef<HTMLButtonElement>(null);
  const defaultLinkRef = useRef<HTMLAnchorElement>(null);
  const [pressedState, setPressedState] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
    componentName: 'Button',
    stateName: 'pressed',
  });
  const isPressed = toggleable && pressedState;

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
      toggleable,
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
    toggleable,
    pressed,
    defaultPressed,
    label,
  });

  if (!resolvedLabel) {
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
          toggleable,
          isPressed,
        })}
        stateClassName={'state-ripple-group-[button]'}
      />

      {iconPosition === 'left' && iconElement}
      {loading && (
        <div
          className={
            '!absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2'
          }
        >
          <ProgressIndicator
            className={() => ({
              progressIndicator: 'h-6 w-6',
            })}
            aria-hidden="true"
            style={{ stroke: getButtonProgressColor({ variant, disabled }) }}
            variant={'circular-indeterminate'}
          />
        </div>
      )}
      <span className={styles.label}>{resolvedLabel}</span>
      {iconPosition === 'right' && iconElement}
    </>
  );

  const sharedElementProps = {
    className: styles.button,
    'aria-pressed': toggleable ? isPressed : undefined,
    'aria-busy': loading || undefined,
  };
  const interactionBlocked = disabled || loading;

  if (props.href !== undefined) {
    const nativeProps = getNativeElementProps(props);
    return (
      <a
        ref={props.ref ?? defaultLinkRef}
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
      ref={props.ref ?? defaultButtonRef}
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
