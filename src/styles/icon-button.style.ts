import { IconButtonInterface } from '../interfaces/icon-button.interface';
import { classNames, defaultClassNames } from '../utils';

export const iconButtonStyle = defaultClassNames<IconButtonInterface>(
  'iconButton',
  ({
    variant,
    disabled,
    onToggle,
    isActive,
    size,
    width,
    shape,
    allowShapeTransformation,
  }) => {
    return {
      iconButton: 'group  min-h-12 flex items-center',
      container: classNames(
        'rounded-full relative flex overflow-hidden transition-all duration-300',
        (shape === 'rounded' ||
          (shape === 'squared' &&
            onToggle &&
            isActive &&
            allowShapeTransformation)) && {
          'rounded-[30px]': size === 'xSmall' || size == 'small',
          'rounded-[40px]': size === 'medium',
          'rounded-[70px]': size === 'large' || size == 'xLarge',
        },
        (shape === 'squared' ||
          (shape === 'rounded' &&
            onToggle &&
            isActive &&
            allowShapeTransformation)) && {
          'rounded-[12px]': size === 'xSmall' || size == 'small',
          'rounded-[16px]': size === 'medium',
          'rounded-[28px]': size === 'large' || size == 'xLarge',
        },
        allowShapeTransformation && {
          'group-active:rounded-[12px]': size === 'xSmall' || size == 'small',
          'group-active:rounded-[16px]': size === 'medium',
          'group-active:rounded-[28px]': size === 'large' || size == 'xLarge',
        },
        variant === 'filled' && [
          !disabled && {
            'bg-surface-container': !isActive && Boolean(onToggle),
            'bg-primary': isActive || !onToggle,
          },
          Boolean(disabled) && 'bg-on-surface/[0.12]',
        ],
        variant === 'tonal' && [
          !disabled && {
            'bg-surface-container': !isActive && Boolean(onToggle),
            'bg-secondary-container': isActive || !onToggle,
          },
          Boolean(disabled) && 'bg-on-surface/[0.12]',
        ],
        variant === 'outlined' && [
          !disabled && {
            'border border-outline': !isActive,
            'border border-transparent bg-inverse-surface': isActive,
          },
          Boolean(disabled) && {
            'border border-on-surface/[0.12]': !isActive,
            'border border-transparent bg-on-surface/[0.12]': isActive,
          },
        ]
      ),
      stateLayer: classNames(
        'absolute top-0 left-0 h-full w-full ',
        !disabled && [
          variant === 'standard' && {
            'state-on-surface-variant': !isActive,
            'state-primary': isActive,
          },
          variant === 'filled' && {
            'state-primary': !isActive && Boolean(onToggle),
            'state-inverse-on-surface': isActive || !onToggle,
          },
          variant === 'tonal' && {
            'state-on-surface-variant': !isActive && Boolean(onToggle),
            'state-on-secondary-container': isActive || !onToggle,
          },
          variant === 'outlined' && {
            'state-on-surface-variant': !isActive,
            'state-on-primary': isActive,
          },
        ]
      ),
      icon: classNames(
        '  transition-all duration-300',
        { 'size-5 p-1.5': size === 'xSmall' },
        { 'size-6 p-2': size === 'small' },
        { 'size-6 p-4': size === 'medium' },
        { 'size-8 p-8': size === 'large' },
        { 'size-10 p-12': size === 'xLarge' },
        width == 'narrow' && [
          { 'px-1': size === 'xSmall' },
          { 'px-1': size === 'small' },
          { 'px-3': size === 'medium' },
          { 'px-4': size === 'large' },
          { 'px-8': size === 'xLarge' },
        ],
        width == 'wide' && [
          { 'px-2.5': size === 'xSmall' },
          { 'px-3.5': size === 'small' },
          { 'px-6': size === 'medium' },
          { 'px-12': size === 'large' },
          { 'px-[72px]': size === 'xLarge' },
        ],
        !disabled && [
          variant === 'standard' && {
            'text-on-surface-variant': !isActive,
            'text-primary': isActive,
          },
          variant === 'filled' && {
            'text-primary': !isActive && Boolean(onToggle),
            'text-on-primary': isActive || !onToggle,
          },
          variant === 'tonal' && {
            'text-on-surface-variant': !isActive && Boolean(onToggle),
            'text-on-secondary-container': isActive || !onToggle,
          },
          variant === 'outlined' && {
            'text-on-surface-variant': !isActive,
            'text-inverse-on-surface': isActive,
          },
        ],
        Boolean(disabled) && 'text-on-surface/[0.38]'
      ),
    };
  }
);
