import type { SplitButtonInterface } from '../interfaces/split-button.interface';
import { type ClassNameComponent, cx, defaultClassNames } from '../utils';

const splitButtonConfig: ClassNameComponent<SplitButtonInterface> = ({
  actions,
  accessibleLabel,
  disabled,
  icon,
  isOpen,
  label,
  menuButtonProps,
  menuLabel,
  open,
  primaryButtonProps,
  defaultOpen,
  size = 'small',
  variant = 'filled',
}) => {
  // Keep all declared public fields in this shared style contract. The fields
  // below affect behavior/content but not the geometry of these elements.
  void [
    actions,
    accessibleLabel,
    icon,
    menuLabel,
    open,
    primaryButtonProps,
    defaultOpen,
  ];
  const menuButtonWidth = menuButtonProps?.width ?? 'default';

  return {
    splitButton: cx(
      'relative inline-flex min-h-12 w-fit items-center gap-[2px]',
    ),
    primaryButton: cx(
      'rounded-s-full',
      size === 'xSmall' && 'h-8 py-0 rounded-e-[4px] pe-2.5',
      size === 'small' && 'h-10 py-0 rounded-e-[4px] pe-3',
      size === 'medium' && 'h-14 py-0 rounded-e-[4px]',
      size === 'large' && 'h-24 py-0 rounded-e-[8px]',
      size === 'xLarge' && 'h-[136px] py-0 rounded-e-[12px]',
    ),
    primaryTouchTarget: cx('h-12'),
    primaryStateLayer: cx('overflow-hidden'),
    primaryIcon: cx(''),
    primaryLabel: !label?.trim() ? 'sr-only' : undefined,
    menuButton: cx(
      'rounded-e-full',
      (size === 'xSmall' || size === 'small' || size === 'medium') &&
        'rounded-s-[4px]',
      size === 'large' && 'rounded-s-[8px]',
      size === 'xLarge' && 'rounded-s-[12px]',
      menuButtonWidth === 'default' &&
        size === 'xSmall' &&
        'w-12 p-0 ps-3 pe-3.5 py-[5px]',
      menuButtonWidth === 'default' &&
        size === 'small' &&
        'w-12 p-0 ps-3 pe-3.5 py-[9px]',
      menuButtonWidth === 'default' &&
        size === 'medium' &&
        'w-14 p-0 ps-[13px] pe-[17px] py-[15px]',
      menuButtonWidth === 'default' &&
        size === 'large' &&
        'w-24 p-0 ps-[26px] pe-8 py-[29px]',
      menuButtonWidth === 'default' &&
        size === 'xLarge' &&
        'w-[136px] p-0 ps-[37px] pe-[49px] py-[43px]',
      variant === 'outlined' && 'text-primary',
      (variant === 'filled' || variant === 'tonal') &&
        disabled &&
        'bg-transparent',
      variant === 'elevated' && {
        'bg-surface-container-low text-primary shadow-1 hover:shadow-2':
          !disabled,
        'text-on-surface/[38%]': disabled,
      },
    ),
    menuTouchTarget: cx('h-12'),
    menuStateLayer: cx(
      'overflow-hidden',
      isOpen && 'bg-[color-mix(in_srgb,var(--state-color)_10%,transparent)]',
    ),
    menuIcon: cx(
      'relative z-10 inline-flex',
      menuButtonWidth === 'default' &&
        (size === 'xSmall' || size === 'small') &&
        'size-[22px]',
      menuButtonWidth === 'default' && size === 'medium' && 'size-[26px]',
      menuButtonWidth === 'default' && size === 'large' && 'size-[38px]',
      menuButtonWidth === 'default' && size === 'xLarge' && 'size-[50px]',
    ),
    menuSurface: cx(
      'absolute end-0 top-[calc(100%+8px)] z-50',
      disabled && 'pointer-events-none',
    ),
  };
};

export const splitButtonStyle = defaultClassNames<SplitButtonInterface>(
  'splitButton',
  splitButtonConfig,
);
