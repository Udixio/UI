import { describe, expect, it } from 'vitest';
import { getStateLayerTransitionStyle } from './state-layer.js';

describe('state layer transition style', () => {
  it('snaps the layer when the motion has no timing', () => {
    expect(getStateLayerTransitionStyle()).toBeUndefined();
    expect(getStateLayerTransitionStyle({})).toBeUndefined();
  });

  it('transitions the colour and opacity of the layer over the token of its motion', () => {
    expect(
      getStateLayerTransitionStyle({
        timing: { duration: 'duration.medium2', easing: 'easing.standard' },
      }),
    ).toEqual({
      transitionProperty: 'background-color, opacity',
      transitionDuration: '300ms',
      transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    });
  });

  it('routes a spring timing through the stylesheet custom properties', () => {
    expect(getStateLayerTransitionStyle({ timing: 'spring.default.effects' })).toEqual({
      transitionProperty: 'background-color, opacity',
      transitionDuration: 'var(--udx-motion-spring-default-effects-duration, 200ms)',
      transitionTimingFunction: 'var(--udx-motion-spring-default-effects-easing, cubic-bezier(0.34, 0.8, 0.34, 1))',
    });
  });
});
