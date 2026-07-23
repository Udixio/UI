import type { IconButtonProps } from '../interfaces/icon-button.interface';
import type { StateLayerShapeTransition } from '../interfaces/state-layer.interface';
import { DEFAULT_BUTTON_SHAPE_TRANSITION } from './button.behavior';

const ICON_BUTTON_SHAPE_RADII: Record<
  NonNullable<IconButtonProps['size']>,
  { rounded: string; squared: string }
> = {
  xSmall: { rounded: '30px', squared: '12px' },
  small: { rounded: '30px', squared: '12px' },
  medium: { rounded: '40px', squared: '16px' },
  large: { rounded: '70px', squared: '28px' },
  xLarge: { rounded: '70px', squared: '28px' },
};

export interface IconButtonPressState {
  disabled: boolean;
  toggleable: boolean;
  isPressed: boolean;
}

export type IconButtonPressTransition =
  | { blocked: true; nextPressed?: never }
  | { blocked: false; nextPressed?: boolean };

export function getIconButtonPressTransition({
  disabled,
  toggleable,
  isPressed,
}: IconButtonPressState): IconButtonPressTransition {
  if (disabled) return { blocked: true };
  return toggleable
    ? { blocked: false, nextPressed: !isPressed }
    : { blocked: false };
}

export function getIconButtonStateColor({
  variant = 'standard',
  toggleable,
  isPressed,
}: Pick<IconButtonPressState, 'toggleable' | 'isPressed'> & {
  variant?: IconButtonProps['variant'];
}): string {
  switch (variant) {
    case 'standard':
      return toggleable && isPressed ? 'primary' : 'on-surface-variant';
    case 'filled':
      return toggleable && !isPressed ? 'primary' : 'on-primary';
    case 'tonal':
      return toggleable && isPressed
        ? 'on-secondary'
        : 'on-secondary-container';
    case 'outlined':
      return toggleable && isPressed
        ? 'inverse-on-surface'
        : 'on-surface-variant';
  }
}

export function getIconButtonShapeTransition({
  size = 'medium',
  shape = 'rounded',
  shapeFeedback = 'morph',
  isPressed,
  disabled,
  transition,
}: Pick<IconButtonProps, 'size' | 'shape' | 'shapeFeedback' | 'transition'> & {
  isPressed: boolean;
  disabled: boolean;
}): StateLayerShapeTransition {
  const radii = ICON_BUTTON_SHAPE_RADII[size];
  const useSquaredRestingShape =
    shape === 'squared' || (shapeFeedback === 'morph' && isPressed);

  return {
    restingBorderRadius: useSquaredRestingShape ? radii.squared : radii.rounded,
    pressedBorderRadius: radii.squared,
    enabled: shapeFeedback === 'morph' && !disabled,
    transition: transition ?? DEFAULT_BUTTON_SHAPE_TRANSITION,
  };
}
