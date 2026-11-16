import { describe, expect, it } from 'vitest';
import {
  getComponentTransition,
  getStaggeredComponentTransition,
  resolveComponentMotion,
} from './component-motion.js';

describe('component motion', () => {
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

  it('staggers the gap of a container to start after the rest of the duration', () => {
    expect(getStaggeredComponentTransition(undefined, 2)).toBe(
      'all 300ms cubic-bezier(0.2, 0, 0, 1), gap calc(300ms / 2) calc(300ms - 300ms / 2)',
    );
    expect(getStaggeredComponentTransition(undefined, 3)).toBe(
      'all 300ms cubic-bezier(0.2, 0, 0, 1), gap calc(300ms / 3) calc(300ms - 300ms / 3)',
    );
  });
});
