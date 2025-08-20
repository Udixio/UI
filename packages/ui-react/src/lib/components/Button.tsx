import { classNames, ReactProps } from '../utils';
import { ButtonInterface } from '../interfaces';
import { buttonStyle } from '../styles';
import { Icon } from '../icon';
import { ProgressIndicator } from './ProgressIndicator';
import { RippleEffect } from '../effects';
import { useRef } from 'react';

/**
 * Buttons prompt most actions in a UI
 * @status beta
 * @category Action
 */
export const Button = ({
  variant = 'filled',
  disabled = false,
  icon,
  href,
  label,
  className,
  iconPosition = 'left',
  loading = false,
  shape = 'rounded',
  onClick,
  ref,
  size = 'medium',
  allowShapeTransformation = true,
  transition,
  ...restProps
}: ReactProps<ButtonInterface>) => {
  const ElementType = href ? 'a' : 'button';

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef = ref || defaultRef;

  const styles = buttonStyle({
    allowShapeTransformation,
    size,
    shape,
    href,
    disabled,
    icon,
    iconPosition,
    label,
    loading,
    variant,
    transition,
    className,
  });

  const iconElement = icon ? (
    <Icon icon={icon} className={styles.icon} />
  ) : (
    <></>
  );

  transition = { duration: 0.3, ...transition };
  return (
    <ElementType
      ref={resolvedRef}
      href={href}
      className={styles.button}
      {...(restProps as any)}
      onClick={(e: any) => {
        if (!disabled) {
          if (onClick) {
            onClick(e);
          }
        } else {
          e.preventDefault();
        }
      }}
      disabled={disabled}
    >
      <div
        className={styles.container}
        style={{ transition: transition.duration + 's' }}
      >
        <div className={styles.stateLayer}>
          {!disabled && (
            <RippleEffect
              colorName={
                (variant === 'elevated' && 'primary') ||
                (variant === 'filled' && 'on-primary') ||
                (variant === 'filledTonal' && 'on-secondary-container') ||
                (variant === 'outlined' && 'primary') ||
                (variant === 'text' && 'primary') ||
                ''
              }
              triggerRef={resolvedRef}
            />
          )}
        </div>

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
                    '!stroke-on-surface/[38%]':
                      variant === 'filled' && disabled,
                  },
                  {
                    '!stroke-on-secondary-container':
                      variant === 'filledTonal' && !disabled,
                    '!stroke-on-surface/[38%]':
                      variant === 'filledTonal' && disabled,
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
      </div>
    </ElementType>
  );
};
