import {
  DEFAULT_BUTTON_SHAPE_TRANSITION,
  getIconButtonPressTransition,
  getIconButtonShapeTransition,
  getIconButtonStateColor,
} from './index.js';

describe('icon button behavior', () => {
  it('toggles semantic pressed state only when toggleable', () => {
    expect(
      getIconButtonPressTransition({
        disabled: false,
        toggleable: true,
        isPressed: false,
      }),
    ).toEqual({ blocked: false, nextPressed: true });
    expect(
      getIconButtonPressTransition({
        disabled: false,
        toggleable: false,
        isPressed: false,
      }),
    ).toEqual({ blocked: false });
  });

  it('blocks disabled interaction', () => {
    expect(
      getIconButtonPressTransition({
        disabled: true,
        toggleable: true,
        isPressed: false,
      }),
    ).toEqual({ blocked: true });
  });

  it('resolves state colors from variant and pressed state', () => {
    expect(
      getIconButtonStateColor({
        variant: 'filled',
        toggleable: true,
        isPressed: false,
      }),
    ).toBe('primary');
    expect(
      getIconButtonStateColor({
        variant: 'tonal',
        toggleable: true,
        isPressed: true,
      }),
    ).toBe('on-secondary');
  });

  it('uses shared shape motion and respects static feedback', () => {
    expect(
      getIconButtonShapeTransition({
        size: 'medium',
        shape: 'rounded',
        shapeFeedback: 'morph',
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
      getIconButtonShapeTransition({
        size: 'medium',
        shape: 'rounded',
        shapeFeedback: 'none',
        isPressed: true,
        disabled: false,
      }),
    ).toMatchObject({
      restingBorderRadius: '40px',
      enabled: false,
    });
  });
});
