import type {
  ButtonProps,
  ButtonVariant,
  ButtonVariantAlias,
} from '../interfaces/button.interface';
import type { StateLayerShapeTransition } from '../interfaces/state-layer.interface';

export const DEFAULT_BUTTON_SHAPE_TRANSITION = {
  type: 'spring',
  visualDuration: 0.3,
  bounce: 0.2,
} as const;

const BUTTON_SHAPE_RADII: Record<
  NonNullable<ButtonProps['size']>,
  { rounded: string; squared: string }
> = {
  xSmall: { rounded: '30px', squared: '12px' },
  small: { rounded: '30px', squared: '12px' },
  medium: { rounded: '40px', squared: '16px' },
  large: { rounded: '70px', squared: '28px' },
  xLarge: { rounded: '70px', squared: '28px' },
};

const BUTTON_VARIANT_ALIASES: Record<ButtonVariantAlias, ButtonVariant> = {
  primary: 'filled',
  secondary: 'tonal',
};

export function resolveButtonVariant(
  variant: ButtonProps['variant'] = 'filled',
): ButtonVariant {
  if (variant === 'primary' || variant === 'secondary') {
    return BUTTON_VARIANT_ALIASES[variant];
  }

  return variant;
}

export interface ButtonPressState {
  disabled: boolean;
  loading: boolean;
  toggleable: boolean;
  isPressed: boolean;
}

export type ButtonPressTransition =
  | { blocked: true; nextPressed?: never }
  | { blocked: false; nextPressed?: boolean };

/** Pure interaction rule shared by every framework adapter. */
export function getButtonPressTransition({
  disabled,
  loading,
  toggleable,
  isPressed,
}: ButtonPressState): ButtonPressTransition {
  if (disabled || loading) {
    return { blocked: true };
  }

  return toggleable
    ? { blocked: false, nextPressed: !isPressed }
    : { blocked: false };
}

export function getButtonStateColor({
  variant,
  toggleable,
  isPressed,
}: Pick<ButtonPressState, 'toggleable' | 'isPressed'> & {
  variant: ButtonProps['variant'];
}): string {
  const resolvedVariant = resolveButtonVariant(variant);

  switch (resolvedVariant) {
    case 'filled':
      return toggleable && !isPressed ? 'on-surface-variant' : 'on-primary';
    case 'elevated':
      return toggleable && isPressed ? 'on-primary' : 'primary';
    case 'tonal':
      return toggleable && isPressed
        ? 'on-secondary'
        : 'on-secondary-container';
    case 'outlined':
      return toggleable && isPressed
        ? 'inverse-on-surface'
        : 'on-surface-variant';
    case 'text':
      return 'primary';
  }
}

export function getButtonProgressColor({
  variant,
  disabled,
}: {
  variant: ButtonProps['variant'];
  disabled: boolean;
}): string {
  if (disabled) {
    return 'color-mix(in srgb, var(--color-on-surface) 38%, transparent)';
  }

  switch (resolveButtonVariant(variant)) {
    case 'filled':
      return 'var(--color-on-primary)';
    case 'tonal':
      return 'var(--color-on-secondary-container)';
    case 'elevated':
    case 'outlined':
    case 'text':
      return 'var(--color-primary)';
  }
}

export function getButtonShapeTransition({
  size = 'medium',
  shape = 'rounded',
  allowShapeTransformation = true,
  isPressed,
  disabled,
  transition,
}: Pick<
  ButtonProps,
  'size' | 'shape' | 'allowShapeTransformation' | 'transition'
> & {
  isPressed: boolean;
  disabled: boolean;
}): StateLayerShapeTransition {
  const radii = BUTTON_SHAPE_RADII[size];
  const useSquaredRestingShape =
    shape === 'squared' || (allowShapeTransformation && isPressed);

  return {
    restingBorderRadius: useSquaredRestingShape ? radii.squared : radii.rounded,
    pressedBorderRadius: radii.squared,
    enabled: allowShapeTransformation && !disabled,
    transition: transition ?? DEFAULT_BUTTON_SHAPE_TRANSITION,
  };
}
