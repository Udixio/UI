import { describe, expect, it } from 'vitest';
import { defineTokens } from './index.js';

const effects = [
  [1, 3800, 150, 'cubic-bezier(0.31, 0.94, 0.34, 1)'],
  [1, 1600, 200, 'cubic-bezier(0.34, 0.8, 0.34, 1)'],
  [1, 800, 300, 'cubic-bezier(0.34, 0.88, 0.34, 1)'],
];
const spatial = {
  expressive: [
    [0.6, 800, 350, 'cubic-bezier(0.42, 1.67, 0.21, 0.9)'],
    [0.8, 380, 500, 'cubic-bezier(0.38, 1.21, 0.22, 1)'],
    [0.8, 200, 650, 'cubic-bezier(0.39, 1.29, 0.35, 0.98)'],
  ],
  standard: [
    [0.9, 1400, 350, 'cubic-bezier(0.27, 1.06, 0.18, 1)'],
    [0.9, 700, 500, 'cubic-bezier(0.27, 1.06, 0.18, 1)'],
    [0.9, 300, 750, 'cubic-bezier(0.27, 1.06, 0.18, 1)'],
  ],
};

describe('M3 spring tokens', () => {
  it.each(['expressive', 'standard'] as const)('exposes all %s physical values and official fallbacks', (scheme) => {
    const tokens = defineTokens({ scheme });
    (['fast', 'default', 'slow'] as const).forEach((speed, index) => {
      for (const [type, expected] of [['spatial', spatial[scheme][index]], ['effects', effects[index]]] as const) {
        const [dampingRatio, stiffness, duration, easing] = expected;
        expect(tokens.spring[speed][type]).toEqual({ dampingRatio, stiffness, fallback: { duration, easing } });
      }
    });
  });
  it('defaults to expressive', () => {
    expect(defineTokens()).toEqual(defineTokens({ scheme: 'expressive' }));
  });
  it('returns independent token trees', () => {
    const first = defineTokens();
    const second = defineTokens();
    expect(first.spring.fast.spatial).not.toBe(second.spring.fast.spatial);
    expect(first.spring.fast.spatial.fallback).not.toBe(second.spring.fast.spatial.fallback);
  });
  it('rejects an unknown scheme', () => {
    expect(() => defineTokens({ scheme: 'invalid' as never })).toThrow('Unknown motion scheme: invalid');
  });
});
