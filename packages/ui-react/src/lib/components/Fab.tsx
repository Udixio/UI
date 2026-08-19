import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  MouseEventHandler,
  Ref,
} from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import {
  fabStyle,
  type ComponentClassName,
  type FabInterface,
  type FabProps,
} from '@udixio/core';
import {
  createFabLabelController,
  type FabLabelController,
} from '@udixio/core/dom';
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

  // The label stays mounted in both states; the shared `@udixio/core/dom`
  // controller animates its width and opacity, so this adapter never has to
  // coordinate an exit-animation-before-unmount sequence.
  //
  // That controller also owns both values from its first call onward, so the
  // resting style below is captured once (lazy useState initializer, matching
  // the `extended` value this component actually mounted with) and never
  // updated by React afterward -- it exists only so server-rendered and
  // first-paint markup is already correct before hydration. If React kept
  // rewriting it on every render it would race the controller, jumping the
  // width straight to its target before Anime.js Layout can diff the two, so
  // every transition would silently become a snap.
  const [initialLabelStyle] = useState<CSSProperties>(() =>
    extended ? { width: 'auto', opacity: 1 } : { width: 0, opacity: 0 },
  );
  const extendedRef = useRef(extended);
  extendedRef.current = extended;
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const labelControllerRef = useRef<FabLabelController | null>(null);

  useLayoutEffect(() => {
    const labelElement = labelRef.current;
    if (!labelElement) return;

    const controller = createFabLabelController({
      label: labelElement,
      extended: () => extendedRef.current,
    });
    labelControllerRef.current = controller;

    return () => {
      controller.destroy();
      if (labelControllerRef.current === controller) {
        labelControllerRef.current = null;
      }
    };
  }, [hasAccessibleLabel]);

  // The controller ignores a call that does not change `extended`, so the
  // one this fires on mount is a no-op and only later transitions animate.
  useLayoutEffect(() => {
    labelControllerRef.current?.update();
  }, [extended]);

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
      <span
        ref={labelRef}
        className={styles.label}
        aria-hidden={!extended || undefined}
        style={initialLabelStyle}
      >
        {label}
      </span>
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
