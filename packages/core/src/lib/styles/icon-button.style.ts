import type { IconButtonInterface } from '../interfaces/icon-button.interface';
import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

const iconButtonConfig: ClassNameComponent<IconButtonInterface> = ({
  variant,
  disabled,
  isPressed,
  toggleable,
  size,
  width,
  shape,
  shapeFeedback,
}) => {
  const usesSquaredShape =
    shape === 'squared' || (shapeFeedback === 'morph' && isPressed);

  return {
    iconButton: cx(
      'relative inline-flex items-center justify-center overflow-visible outline-none group/icon-button',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
      disabled ? 'cursor-default' : 'cursor-pointer',
      !usesSquaredShape && {
        'rounded-[30px]': size === 'xSmall' || size === 'small',
        'rounded-[40px]': size === 'medium',
        'rounded-[70px]': size === 'large' || size === 'xLarge',
      },
      usesSquaredShape && {
        'rounded-[12px]': size === 'xSmall' || size === 'small',
        'rounded-[16px]': size === 'medium',
        'rounded-[28px]': size === 'large' || size === 'xLarge',
      },
      variant === 'standard' && {
        'text-on-surface-variant': !disabled && !isPressed,
        'text-primary': !disabled && isPressed,
      },
      variant === 'filled' && {
        'bg-surface-container text-primary':
          !disabled && toggleable && !isPressed,
        'bg-primary text-on-primary': !disabled && (!toggleable || isPressed),
        'bg-on-surface/[0.12]': disabled,
      },
      variant === 'tonal' && {
        'bg-secondary-container text-on-secondary-container':
          !disabled && (!toggleable || !isPressed),
        'bg-secondary text-on-secondary': !disabled && toggleable && isPressed,
        'bg-on-surface/[0.12]': disabled,
      },
      variant === 'outlined' && {
        'border border-outline text-on-surface-variant':
          !disabled && !isPressed,
        'border border-inverse-surface bg-inverse-surface text-inverse-on-surface':
          !disabled && isPressed,
        'border border-on-surface/[0.12]': disabled,
      },
      disabled && 'text-on-surface/[0.38]',
    ),
    touchTarget: cx(
      'absolute left-1/2 top-1/2 h-12 w-full -translate-x-1/2 -translate-y-1/2',
    ),
    stateLayer: cx('overflow-hidden'),
    icon: cx(
      'pointer-events-none',
      size === 'xSmall' && 'size-5 p-1.5',
      size === 'small' && 'size-6 p-2',
      size === 'medium' && 'size-6 p-4',
      size === 'large' && 'size-8 p-8',
      size === 'xLarge' && 'size-10 p-12',
      width === 'narrow' && {
        'px-1': size === 'xSmall' || size === 'small',
        'px-3': size === 'medium',
        'px-4': size === 'large',
        'px-8': size === 'xLarge',
      },
      width === 'wide' && {
        'px-2.5': size === 'xSmall',
        'px-3.5': size === 'small',
        'px-6': size === 'medium',
        'px-12': size === 'large',
        'px-[72px]': size === 'xLarge',
      },
    ),
  };
};

export const iconButtonStyle = defaultClassNames<IconButtonInterface>(
  'iconButton',
  iconButtonConfig,
);
