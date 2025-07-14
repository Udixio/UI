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
    button: classNames('group min-h-12 flex items-center'),
    container: classNames(
      ' relative outline-none overflow-hidden inline-block flex  justify-center   items-center  ',

      size === 'xSmall' && 'text-label-large px-3 h-8 gap-1',
      size === 'small' && 'text-label-large px-4 h-10 gap-2',
      size === 'medium' && 'text-title-medium px-6 h-14 gap-2',
      size === 'large' && 'text-headline-small px-12 h-24 gap-3',
      size === 'xLarge' && 'text-headline-large px-16 h-[136px] gap-4',
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
        {
          'text-primary': !disabled,
          'text-on-surface/[0.38]': disabled,
        },
      ],
      disabled && 'cursor-default'
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
      }
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
      }
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
      }
    ),
  })
);
