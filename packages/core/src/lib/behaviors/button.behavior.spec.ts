import {
  DEFAULT_BUTTON_SHAPE_TRANSITION,
  getButtonProgressColor,
  getButtonPressTransition,
  getButtonShapeTransition,
  getButtonStateColor,
  resolveButtonVariant,
} from './button.behavior.js';

describe('button behavior', () => {
  it('normalizes public variant aliases', () => {
    expect(resolveButtonVariant()).toBe('filled');
    expect(resolveButtonVariant('primary')).toBe('filled');
    expect(resolveButtonVariant('secondary')).toBe('tonal');
    expect(resolveButtonVariant('outlined')).toBe('outlined');
  });

  it('computes the next semantic pressed state for toggle buttons', () => {
    expect(
      getButtonPressTransition({
        disabled: false,
        loading: false,
        toggleable: true,
        isPressed: false,
      }),
    ).toEqual({ blocked: false, nextPressed: true });
  });

  it('does not create a pressed transition for action buttons', () => {
    expect(
      getButtonPressTransition({
        disabled: false,
        loading: false,
        toggleable: false,
        isPressed: false,
      }),
    ).toEqual({ blocked: false });
  });

  it.each([
    { disabled: true, loading: false },
    { disabled: false, loading: true },
  ])('blocks disabled and loading buttons', ({ disabled, loading }) => {
    expect(
      getButtonPressTransition({
        disabled,
        loading,
        toggleable: true,
        isPressed: false,
      }),
    ).toEqual({ blocked: true });
  });

  it('resolves state-layer colors from semantic state', () => {
    expect(
      getButtonStateColor({
        variant: 'filled',
        toggleable: true,
        isPressed: false,
      }),
    ).toBe('on-surface-variant');
    expect(
      getButtonStateColor({
        variant: 'secondary',
        toggleable: true,
        isPressed: true,
      }),
    ).toBe('on-secondary');
  });

  it('resolves loading colors from the shared variant aliases', () => {
    expect(
      getButtonProgressColor({ variant: 'primary', disabled: false }),
    ).toBe('var(--color-on-primary)');
    expect(
      getButtonProgressColor({ variant: 'secondary', disabled: false }),
    ).toBe('var(--color-on-secondary-container)');
  });

  it('resolves one Motion shape contract for every adapter', () => {
    expect(
      getButtonShapeTransition({
        size: 'medium',
        shape: 'rounded',
        allowShapeTransformation: true,
        isPressed: false,
        disabled: false,
      }),
    ).toEqual({
      restingBorderRadius: '40px',
      pressedBorderRadius: '16px',
      enabled: true,
      transition: DEFAULT_BUTTON_SHAPE_TRANSITION,
    });

    expect(
      getButtonShapeTransition({
        size: 'large',
        shape: 'rounded',
        allowShapeTransformation: true,
        isPressed: true,
        disabled: false,
        transition: { type: 'tween', duration: 0.5, ease: 'easeInOut' },
      }),
    ).toEqual({
      restingBorderRadius: '28px',
      pressedBorderRadius: '28px',
      enabled: true,
      transition: { type: 'tween', duration: 0.5, ease: 'easeInOut' },
    });
  });
});
