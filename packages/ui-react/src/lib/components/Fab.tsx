import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEventHandler,
  Ref,
} from 'react';
import {
  fabStyle,
  type ComponentClassName,
  type FabInterface,
  type FabProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { Icon } from '../icon';
import { State } from '../effects';

export type { FabSize, FabVariant } from '@udixio/core';

type ReactFabOwnProps = FabProps & {
  /** Classes or state-aware element classes applied through the shared style contract. */
  className?: ComponentClassName<FabInterface>['className'];
};

type ReactFabActionProps = ReactFabOwnProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof ReactFabOwnProps | 'children' | 'className' | 'onClick'
  > & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
    onClick?: MouseEventHandler<HTMLButtonElement>;
  };

type ReactFabLinkProps = ReactFabOwnProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof ReactFabOwnProps | 'children' | 'className' | 'onClick' | 'href'
  > & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  };

export type ReactFabProps = ReactFabActionProps | ReactFabLinkProps;

export const useFabStyle = createUseStyle(fabStyle);

/**
 * Floating action buttons expose the primary action on a screen.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires `label` and `icon`; arbitrary children are not accepted.
 * - `type` defaults to `'button'` to prevent accidental form submissions.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * @limitations
 * - No built-in positioning; placement is handled by layout.
 * - Disabled links are inert and removed from the tab order.
 * - Compose an explicit Tooltip for non-extended FABs when visual help is required.
 */
export const Fab = (props: ReactFabProps) => {
  const {
    className,
    label,
    variant = 'primary',
    size = 'medium',
    icon,
    extended = false,
    disabled = false,
  } = props;
  const styles = useFabStyle({
    variant,
    label,
    icon,
    size,
    extended,
    disabled,
    className,
  });
  const hasAccessibleLabel = label.trim() !== '';
  const content = (
    <>
      <span className={styles.touchTarget} />
      <State
        className={styles.stateLayer}
        colorName={
          variant === 'primary'
            ? 'on-primary'
            : variant === 'primaryContainer'
              ? 'on-primary-container'
              : variant === 'secondary'
                ? 'on-secondary'
                : variant === 'secondaryContainer'
                  ? 'on-secondary-container'
                  : variant === 'tertiary'
                    ? 'on-tertiary'
                    : 'on-tertiary-container'
        }
        stateClassName="state-ripple-group-[fab]"
      />
      <Icon icon={icon} className={styles.icon} />
      {extended && <span className={styles.label}>{label}</span>}
    </>
  );

  if (!hasAccessibleLabel) {
    if (
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production'
    ) {
      console.error(
        'Udixio UI: <Fab> requires a non-empty `label`. Rendering nothing.',
      );
    }
    return null;
  }

  if (props.href !== undefined) {
    const {
      className: _className,
      disabled: _disabled,
      extended: _extended,
      icon: _icon,
      label: _label,
      onClick,
      ref,
      size: _size,
      variant: _variant,
      ...nativeProps
    } = props;
    void {
      _className,
      _disabled,
      _extended,
      _icon,
      _label,
      _size,
      _variant,
    };
    return (
      <a
        {...nativeProps}
        ref={ref}
        className={styles.fab}
        href={disabled ? undefined : props.href}
        aria-label={extended ? undefined : label}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : nativeProps.tabIndex}
        role={disabled ? 'link' : nativeProps.role}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          onClick?.(event);
        }}
      >
        {content}
      </a>
    );
  }

  const {
    className: _className,
    disabled: _disabled,
    extended: _extended,
    icon: _icon,
    label: _label,
    onClick,
    ref,
    size: _size,
    variant: _variant,
    type = 'button',
    ...nativeProps
  } = props;
  void {
    _className,
    _disabled,
    _extended,
    _icon,
    _label,
    _size,
    _variant,
  };
  return (
    <button
      {...nativeProps}
      ref={ref}
      type={type}
      disabled={disabled}
      className={styles.fab}
      aria-label={extended ? undefined : label}
      onClick={onClick}
    >
      {content}
    </button>
  );
};
