import { classNames, ReactProps } from '../utils';
import { ButtonInterface } from '../interfaces';
import { useButtonStyle } from '../styles';
import { Icon } from '../icon';
import { ProgressIndicator } from './ProgressIndicator';
import { State } from '../effects';
import React, { useEffect, useRef } from 'react';

/**
 * Resolves variant aliases to their actual variant values
 */
function resolveVariantAlias(
  variant?:
    | 'filled'
    | 'elevated'
    | 'tonal'
    | 'outlined'
    | 'text'
    | 'primary'
    | 'secondary',
): 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text' {
  const aliasMap = {
    primary: 'filled',
    secondary: 'tonal',
  } as const;

  if (variant && variant in aliasMap) {
    return aliasMap[variant as keyof typeof aliasMap];
  }

  return (
    (variant as 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text') ||
    'filled'
  );
}

/**
 * Buttons prompt most actions in a UI
 * @status beta
 * @category Action
 * @devx
 * - Requires `label` or children; used for visible text and a11y.
 * - `onToggle` uses internal state; pair with `activated` for controlled usage.
 * - `type` defaults to `'button'` to prevent accidental form submits.
 * @limitations
 * - When `href` is set with `disabled`, the link is made inert via `aria-disabled` and `tabIndex={-1}`.
 */
export const Button = ({
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
  onClick,
  onToggle,
  activated,
  ref,
  size = 'medium',
  allowShapeTransformation = true,
  transition,
  children,
  ...restProps
}: ReactProps<ButtonInterface>) => {
  if (children) label = children;
  if (!label) {
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
  variant = resolveVariantAlias(variant);

  const isLink = !!href;
  const ElementType = isLink ? 'a' : 'button';

  const defaultRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const resolvedRef = ref || defaultRef;

  const [isActive, setIsActive] = React.useState(activated);
  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  transition = { duration: 0.3, ...transition };

  const handleClick = (e: React.MouseEvent<any, MouseEvent>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onToggle) {
      setIsActive(!isActive);
      onToggle(!isActive);
    } else if (onClick) {
      onClick(e);
    }
  };

  const styles = useButtonStyle({
    allowShapeTransformation,
    size,
    disableTextMargins,
    shape,
    href,
    disabled,
    icon,
    iconPosition,
    loading,
    variant,
    transition,
    className,
    isActive: isActive ?? false,
    onToggle,
    activated: isActive,
    label,
    children: label,
  });
  const iconElement = icon ? (
    <Icon icon={icon} className={styles.icon} />
  ) : (
    <></>
  );

  // Build element-specific HTML attributes
  const elementProps: Record<string, any> = {};
  if (isLink) {
    if (disabled) {
      elementProps['aria-disabled'] = true;
      elementProps.tabIndex = -1;
      elementProps.role = 'link';
    } else {
      elementProps.href = href;
    }
  } else {
    elementProps.type = type;
    elementProps.disabled = disabled;
  }

  return (
    <ElementType
      ref={resolvedRef}
      className={styles.button}
      {...elementProps}
      {...(restProps as any)}
      onClick={handleClick}
      aria-pressed={onToggle ? isActive : undefined}
      style={{ transition: transition.duration + 's' }}
    >
      <div className={styles.touchTarget}></div>
      <State
        style={{ transition: transition.duration + 's' }}
        className={styles.stateLayer}
        colorName={classNames(
          variant === 'filled' && {
            'on-surface-variant': !isActive && Boolean(onToggle),
            'on-primary': isActive || !onToggle,
          },
          variant === 'elevated' && {
            'on-primary': isActive && Boolean(onToggle),
            primary: !isActive || !onToggle,
          },
          variant === 'tonal' && {
            'on-secondary': isActive && Boolean(onToggle),
            'on-secondary-container': !isActive || !onToggle,
          },
          variant === 'outlined' && {
            'inverse-on-surface': isActive && Boolean(onToggle),
            'on-surface-variant': !isActive || !onToggle,
          },
          variant === 'text' && 'primary',
        )}
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
              activeIndicator: classNames(
                {
                  '!stroke-primary': variant === 'elevated' && !disabled,
                  '!stroke-on-surface/[38%]':
                    variant === 'elevated' && disabled,
                },
                {
                  '!stroke-on-primary': variant === 'filled' && !disabled,
                  '!stroke-on-surface/[38%]': variant === 'filled' && disabled,
                },
                {
                  '!stroke-on-secondary-container':
                    variant === 'tonal' && !disabled,
                  '!stroke-on-surface/[38%]': variant === 'tonal' && disabled,
                },
                {
                  '!stroke-primary': variant === 'outlined' && !disabled,
                  '!stroke-on-surface/[38%]':
                    variant === 'outlined' && disabled,
                },
                {
                  '!stroke-primary': variant === 'text' && !disabled,
                  '!stroke-on-surface/[38%]': variant === 'text' && disabled,
                },
              ),
            })}
            variant={'circular-indeterminate'}
          />
        </div>
      )}
      <span className={styles.label}>{label}</span>
      {iconPosition === 'right' && iconElement}
    </ElementType>
  );
};
