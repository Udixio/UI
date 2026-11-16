import { describe, expect, it } from 'vitest';
import {
  collapseTimingOf,
  getComponentTransition,
  getStaggeredComponentTransition,
  resolveComponentMotion,
} from './component-motion.js';

describe('component motion', () => {
  it('collapses a spatial spring on the effects spring of its speed, and keeps any other timing', () => {
    expect(collapseTimingOf('spring.default.spatial')).toBe('spring.default.effects');
    expect(collapseTimingOf('spring.fast.spatial')).toBe('spring.fast.effects');
    expect(collapseTimingOf('spring.slow.spatial')).toBe('spring.slow.effects');
    expect(collapseTimingOf('spring.fast.effects')).toBe('spring.fast.effects');
    const curve = { duration: 'duration.long1', easing: 'easing.standard' } as const;
    expect(collapseTimingOf(curve)).toBe(curve);
  });

  it('defaults to a 300 ms curve on the standard easing', () => {
    expect(resolveComponentMotion()).toEqual({
      timing: { duration: 'duration.medium2', easing: 'easing.standard' },
    });
    expect(getComponentTransition()).toBe('all 300ms cubic-bezier(0.2, 0, 0, 1)');
  });

  it('keeps the timing it is given', () => {
    expect(
      getComponentTransition({ timing: { duration: 'duration.long1', easing: 'easing.standard' } }),
    ).toBe('all 450ms cubic-bezier(0.2, 0, 0, 1)');
  });

  it('times a spring through its stylesheet variables', () => {
    const transition = getComponentTransition({ timing: 'spring.default.spatial' });

    expect(transition.startsWith('all var(--udx-motion-spring-default-spatial-duration,')).toBe(true);
  });

  it('staggers the gap of a container to start after the rest of the duration, on the same easing', () => {
    expect(getStaggeredComponentTransition(undefined, 2)).toBe(
      'all 300ms cubic-bezier(0.2, 0, 0, 1), gap calc(300ms / 2) cubic-bezier(0.2, 0, 0, 1) calc(300ms - 300ms / 2)',
    );
    expect(getStaggeredComponentTransition(undefined, 3)).toBe(
      'all 300ms cubic-bezier(0.2, 0, 0, 1), gap calc(300ms / 3) cubic-bezier(0.2, 0, 0, 1) calc(300ms - 300ms / 3)',
    );
  });

  it('uses the default timing of a surface with no motion of its own, and keeps the motion it is given', () => {
    expect(getComponentTransition(undefined, 'spring.default.spatial').startsWith(
      'all var(--udx-motion-spring-default-spatial-duration,',
    )).toBe(true);
    expect(getComponentTransition({ timing: 'spring.fast.effects' }, 'spring.default.spatial').startsWith(
      'all var(--udx-motion-spring-fast-effects-duration,',
    )).toBe(true);
    expect(getStaggeredComponentTransition(undefined, 2, 'spring.default.spatial')).toContain(
      'gap calc(var(--udx-motion-spring-default-spatial-duration,',
    );
  });
});
