import { Icon } from '../../../icon';
import { ProgressIndicator } from '../../../communication/progress-indicator';
import { ButtonProps } from './button.interface';
import { buttonStyle } from '@components/action/button/button.style';
import { classNames } from '@utils/styles';
import { ClassAttributes } from 'react';

export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'outlined'
  | 'text'
  | 'filledTonal';

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const Button = ({
  variant = 'filled',
  disabled = false,
  icon = null,
  href,
  label,
  className,
  iconPosition = 'left',
  loading = false,
  ...restProps
}: ButtonProps) => {
  const ElementType = href ? 'a' : 'button';

  const styles = buttonStyle({
    disabled,
    icon,
    iconPosition,
    label,
    loading,
    variant,
    className,
  });

  const iconElement = icon ? (
    <Icon icon={icon} className={styles.icon} />
  ) : (
    <></>
  );


  return (
    <ElementType href={href} className={styles.button} {...restProps as any}>
      <span className={styles.stateLayer}></span>
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
                }
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
