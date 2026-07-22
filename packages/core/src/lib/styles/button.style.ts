import type { ClassNameComponent } from '../utils';
import { classNames, defaultClassNames } from '../utils';
import { ButtonInterface } from '../interfaces';
import { resolveButtonVariant } from '../behaviors';

const buttonConfig: ClassNameComponent<ButtonInterface> = (state) => {
  const {
    disableTextMargins,
    disabled,
    isPressed,
    loading,
    shape,
    toggleable,
    size,
    allowShapeTransformation,
  } = state;
  const variant = resolveButtonVariant(state.variant);
  const usesSquaredShape =
    shape === 'squared' || (allowShapeTransformation && isPressed);

  return {
    button: classNames(
      'relative inline-flex w-fit cursor-pointer items-center justify-center group/button outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current',
      size === 'xSmall' && 'text-label-large px-3 py-1.5 gap-1',
      size === 'small' && 'text-label-large px-4 py-2.5 gap-2',
      size === 'medium' && 'text-title-medium px-6 py-4 gap-2',
      size === 'large' && 'text-headline-small px-12 py-8 gap-3',
      size === 'xLarge' && 'text-headline-large px-16 py-12 gap-4',
      shape === 'rounded' &&
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
      variant === 'elevated' && {
        'shadow-1 hover:shadow-2': !disabled,
        'bg-surface-container-low text-primary': !disabled && !isPressed,
        'bg-primary text-on-primary': !disabled && isPressed,
        'text-on-surface/[38%]': disabled,
      },
      variant === 'filled' && {
        'hover:shadow-1': !disabled,
        'bg-surface-container text-on-surface-variant':
          !disabled && !isPressed && toggleable,
        'bg-primary text-on-primary':
          !disabled && ((isPressed && toggleable) || !toggleable),
        'text-on-surface/[38%]': disabled,
      },
      variant === 'tonal' && {
        'hover:shadow-1': !disabled,
        'bg-secondary-container text-on-secondary-container':
          !disabled && !isPressed,
        'bg-secondary text-on-secondary': !disabled && isPressed,
        'text-on-surface/[0.38]': disabled,
      },
      variant === 'outlined' && [
        ' border',
        {
          'border-on-surface/[0.12] text-on-surface/[0.38]': disabled,

          'text-primary border-outline focus-visible:border-primary':
            !disabled && !isPressed,
          'text-inverse-on-surface bg-inverse-surface border-inverse-surface':
            !disabled && isPressed,
        },
      ],
      variant === 'text' && [
        'w-fit',
        {
          'text-primary': !disabled,
          'text-on-surface/[0.38]': disabled,
        },
        !disableTextMargins && [
          size === 'xSmall' && '-mx-3 ',
          size === 'small' && '-mx-4 ',
          size === 'medium' && '-mx-6 ',
          size === 'large' && '-mx-12',
          size === 'xLarge' && '-mx-16',
        ],
      ],
      disabled && 'cursor-default',
    ),
    touchTarget: classNames(
      'absolute left-1/2 top-1/2 h-12 w-full min-w-12 -translate-x-1/2 -translate-y-1/2',
    ),
    stateLayer: classNames('overflow-hidden'),
    label: classNames({ 'opacity-0': loading }),
    icon: classNames(
      { invisible: loading },
      size === 'xSmall' && 'size-5',
      size === 'small' && 'size-5',
      size === 'medium' && 'size-6',
      size === 'large' && 'size-8',
      size === 'xLarge' && 'size-10',
    ),
  };
};

export const buttonStyle = defaultClassNames<ButtonInterface>(
  'button',
  buttonConfig,
);
