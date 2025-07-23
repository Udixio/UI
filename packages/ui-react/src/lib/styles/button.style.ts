import { classNames, defaultClassNames } from '../utils';
import { ButtonInterface } from '../interfaces';

export const buttonStyle = defaultClassNames<ButtonInterface>(
  'button',
  ({
    variant,
    disabled,
    iconPosition,
    icon,
    loading,
    shape,
    size,
    allowShapeTransformation,
  }) => ({
    button: classNames(
      'group flex items-center cursor-pointer',
      size === 'xSmall' && 'py-2',
      size === 'small' && 'py-1',
      variant === 'text' && [
        size === 'xSmall' && '-my-2',
        size === 'small' && '-my-1',
      ],
    ),
    container: classNames(
      ' relative outline-none overflow-hidden inline-block flex  justify-center   items-center  ',
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
      shape === 'squared' && {
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
      variant === 'elevated' && {
        'bg-surface-container-low  shadow-1 hover:shadow-2': !disabled,
      },
      variant === 'filled' && {
        'bg-primary hover:shadow-1': !disabled,
      },
      variant === 'filledTonal' && {
        'bg-secondary-container hover:shadow-1': !disabled,
      },
      variant === 'outlined' && [
        ' border',
        {
          'border-on-surface/[0.12]': disabled,
          ' border-outline focus:border-primary': !disabled,
        },
      ],
      variant === 'text' && [
        'w-fit',
        {
          'text-primary': !disabled,
          'text-on-surface/[0.38]': disabled,
        },
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
      disabled && 'cursor-default',
    ),
    stateLayer: classNames(
      'state-layer min-h-full min-w-full absolute top-0 left-0 ',
      variant === 'elevated' && {
        'bg-on-surface/[0.12]': disabled,
        'group-state-primary': !disabled,
      },
      variant === 'filled' && {
        'bg-on-surface/[0.12]': disabled,
        'group-state-on-primary': !disabled,
      },
      variant === 'filledTonal' && {
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
    label: classNames(
      { invisible: loading },
      variant === 'elevated' && {
        'text-primary': !disabled,
        'text-on-surface/[38%]': disabled,
      },
      variant === 'filled' && {
        'text-on-primary': !disabled,
        'text-on-surface/[38%]': disabled,
      },
      variant === 'filledTonal' && {
        'text-on-secondary-container': !disabled,
        'text-on-surface/[0.38]': disabled,
      },
      variant === 'outlined' && {
        'text-primary': !disabled,
        'text-on-surface/[0.38]': disabled,
      },
      variant === 'text' && {
        'text-primary': !disabled,
        'text-on-surface/[0.38]': disabled,
      },
    ),
    icon: classNames(
      { invisible: loading },
      size === 'xSmall' && 'size-5',
      size === 'small' && 'size-5',
      size === 'medium' && 'size-6',
      size === 'large' && 'size-8',
      size === 'xLarge' && 'size-10',
      variant === 'elevated' && {
        'text-primary': !disabled,
        'text-on-surface/[38%]': disabled,
      },
      variant === 'filled' && {
        'text-on-primary': !disabled,
        'text-on-surface/[38%]': disabled,
      },
      variant === 'filledTonal' && {
        'text-on-secondary-container': !disabled,
        'text-on-surface/[0.38]': disabled,
      },
      variant === 'outlined' && {
        'text-primary': !disabled,
        'text-on-surface/[0.38]': disabled,
      },
      variant === 'text' && {
        'text-primary': !disabled,
        'text-on-surface/[0.38]': disabled,
      },
    ),
  }),
);
