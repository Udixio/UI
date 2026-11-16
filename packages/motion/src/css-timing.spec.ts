import { describe, expect, it } from 'vitest';
import { cssTiming } from './css-timing.js';
import { defineTokens } from './tokens.js';

describe('cssTiming', () => {
  it('names the spring custom properties and falls back to the expressive stylesheet values', () => {
    const fast = defineTokens({ scheme: 'expressive' }).spring.fast.spatial.fallback;

    expect(cssTiming('spring.fast.spatial')).toEqual({
      duration: `var(--udx-motion-spring-fast-spatial-duration, ${fast.duration}ms)`,
      easing: `var(--udx-motion-spring-fast-spatial-easing, ${fast.easing})`,
    });
  });

  it('keeps the stylesheet fallback of the fast spatial spring in the documented values', () => {
    expect(cssTiming('spring.fast.spatial')).toEqual({
      duration: 'var(--udx-motion-spring-fast-spatial-duration, 350ms)',
      easing: 'var(--udx-motion-spring-fast-spatial-easing, cubic-bezier(0.42, 1.67, 0.21, 0.9))',
    });
  });

  it('uses the effects tokens for the effects kind', () => {
    expect(cssTiming('spring.default.effects').duration).toBe(
      'var(--udx-motion-spring-default-effects-duration, 200ms)',
    );
  });

  it('gives a curve its duration in milliseconds and its CSS easing', () => {
    expect(cssTiming({ duration: 'duration.medium2', easing: 'easing.standard' })).toEqual({
      duration: '300ms',
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    });
  });

  it('rejects an unknown spring reference', () => {
    expect(() => cssTiming('spring.huge.spatial' as never)).toThrow(RangeError);
    expect(() => cssTiming('spring.fast' as never)).toThrow(RangeError);
  });

  it('rejects a curve whose tokens are unknown', () => {
    expect(() => cssTiming({ duration: 'duration.nope', easing: 'easing.standard' } as never)).toThrow(RangeError);
  });
});
