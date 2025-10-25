import type { ClassNameComponent } from '../utils';
import { classNames, defaultClassNames, createUseClassNames } from '../utils';
import { ButtonInterface } from '../interfaces';

const buttonConfig: ClassNameComponent<ButtonInterface> = ({
  variant,
  disableTextMargins,
  disabled,
  iconPosition,
  icon,
  isActive,
  loading,
  shape,
  onToggle,
  size,
  allowShapeTransformation,
}) => ({
  button: classNames(
    ' relative cursor-pointer group outline-none inline-block flex  justify-center   items-center  ',
    size === 'xSmall' && 'text-label-large px-3 py-1.5 gap-1',
    size === 'small' && 'text-label-large px-4 py-2.5 gap-2',
    size === 'medium' && 'text-title-medium px-6 py-4 gap-2',
    size === 'large' && 'text-headline-small px-12 py-8 gap-3',
    size === 'xLarge' && 'text-headline-large px-16 py-12 gap-4',
    shape === 'rounded' && {
      'rounded-[30px]': size === 'xSmall' || size == 'small',
      'rounded-[40px]': size === 'medium',
      'rounded-[70px]': size === 'large' || size == 'xLarge',
    },
    (shape === 'squared' || (allowShapeTransformation && isActive)) && {
      'rounded-[12px]': size === 'xSmall' || size == 'small',
      'rounded-[16px]': size === 'medium',
      'rounded-[28px]': size === 'large' || size == 'xLarge',
    },
    allowShapeTransformation &&
      !disabled && {
        'active:rounded-[12px]': size === 'xSmall' || size == 'small',
        'active:rounded-[16px]': size === 'medium',
        'active:rounded-[28px]': size === 'large' || size == 'xLarge',
      },
    variant === 'elevated' && {
      'shadow-1 hover:shadow-2': !disabled,
      'bg-surface-container-low text-primary': !disabled && !isActive,
      'bg-primary text-on-primary': !disabled && isActive,
      'text-on-surface/[38%]': disabled,
    },
    variant === 'filled' && {
      'hover:shadow-1': !disabled,
      'bg-surface-container text-on-surface-variant':
        !disabled && !isActive && onToggle,
      'bg-primary text-on-primary':
        !disabled && ((isActive && onToggle) || !onToggle),
      'text-on-surface/[38%]': disabled,
    },
    variant === 'tonal' && {
      'hover:shadow-1': !disabled,
      'bg-secondary-container text-on-secondary-container':
        !disabled && !isActive,
      'bg-secondary text-on-secondary': !disabled && isActive,
      'text-on-surface/[0.38]': disabled,
    },
    variant === 'outlined' && [
      ' border',
      {
        'border-on-surface/[0.12] text-on-surface/[0.38]': disabled,

        'text-primary border-outline focus:border-primary':
          !disabled && !isActive,
        'text-inverse-on-surface bg-inverse-surface border-inverse-surface':
          !disabled && isActive,
      },
    ],
    variant === 'text' && [
      'w-fit',
      {
        'text-primary': !disabled,
        'text-on-surface/[0.38]': disabled,
      },
      disableTextMargins && [
        size === 'xSmall' && '-mx-3 ',
        size === 'small' && '-mx-4 ',
        size === 'medium' && '-mx-6 ',
        size === 'large' && '-mx-12',
        size === 'xLarge' && '-mx-16 ',
        // size === 'small' && ' -my-2.5',
        // size === 'medium' && ' -my-4',
        // size === 'large' && '-my-8',
        // size === 'xLarge' && ' -my-12',
      ],
    ],
    disabled && 'cursor-default',
  ),
  touchTarget: classNames(
    'absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 h-12 w-full',
  ),
  stateLayer: classNames(
    'min-h-full min-w-full absolute top-0 left-0 overflow-hidden',
    variant === 'elevated' && {
      'bg-on-surface/[0.12]': disabled,
      'group-state-primary': !disabled,
    },
    variant === 'filled' && {
      'bg-on-surface/[0.12]': disabled,
      'group-state-on-primary': !disabled && !onToggle,
      'group-state-on-surface-variant': !disabled && onToggle,
    },
    shape === 'rounded' && {
      'rounded-[30px]': size === 'xSmall' || size == 'small',
      'rounded-[40px]': size === 'medium',
      'rounded-[70px]': size === 'large' || size == 'xLarge',
    },
    (shape === 'squared' || (allowShapeTransformation && isActive)) && {
      'rounded-[12px]': size === 'xSmall' || size == 'small',
      'rounded-[16px]': size === 'medium',
      'rounded-[28px]': size === 'large' || size == 'xLarge',
    },
    allowShapeTransformation &&
      !disabled && {
        'group-active:rounded-[12px]': size === 'xSmall' || size == 'small',
        'group-active:rounded-[16px]': size === 'medium',
        'group-active:rounded-[28px]': size === 'large' || size == 'xLarge',
      },
    variant === 'tonal' && {
      'bg-on-surface/[0.12]': disabled,
      'group-state-on-secondary-container ': !disabled,
    },
    variant === 'outlined' && {
      'group-state-primary  group-state-primary': !disabled,
    },
    variant === 'text' && {
      'group-state-primary': !disabled,
    },
  ),
  label: classNames({ invisible: loading }),
  icon: classNames(
    { invisible: loading },
    size === 'xSmall' && 'size-5',
    size === 'small' && 'size-5',
    size === 'medium' && 'size-6',
    size === 'large' && 'size-8',
    size === 'xLarge' && 'size-10',
  ),
});

export const buttonStyle = defaultClassNames<ButtonInterface>(
  'button',
  buttonConfig,
);

export const useButtonStyle = createUseClassNames<ButtonInterface>(
  'button',
  buttonConfig,
);
