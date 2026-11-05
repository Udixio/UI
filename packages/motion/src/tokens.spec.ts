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
        expect(tokens.spring[speed][type]).toMatchObject({ dampingRatio, stiffness, fallback: { duration, easing } });
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

describe('analytical CSS spring timing', () => {
  it.each(['expressive', 'standard'] as const)('approximates every %s spring within 0.2%', (scheme) => {
    const tokens = defineTokens({ scheme });
    for (const speed of ['fast', 'default', 'slow'] as const) {
      for (const type of ['spatial', 'effects'] as const) {
        const spring = tokens.spring[speed][type];
        const { duration, easing } = spring.linear;
        const stops = easing.slice(7, -1).split(', ').map((stop) => {
          const [value, position] = stop.split(' ');
          return [Number(value), Number(position.slice(0, -1)) / 100];
        });
        expect(stops.length).toBeGreaterThanOrEqual(21);
        expect(stops.length).toBeLessThanOrEqual(26);
        expect(stops[0]).toEqual([0, 0]);
        expect(stops.at(-1)?.[1]).toBe(1);
        const omega = Math.sqrt(spring.stiffness);
        const zeta = spring.dampingRatio;
        let segment = 0;
        for (let i = 0; i <= 10000; i++) {
          const x = i / 10000;
          while (segment < stops.length - 2 && x > stops[segment + 1][1]) segment++;
          const [a, b] = [stops[segment], stops[segment + 1]];
          const actual = a[0] + (b[0] - a[0]) * (x - a[1]) / (b[1] - a[1]);
          const t = x * duration / 1000;
          const expected = zeta === 1
            ? 1 - (1 + omega * t) * Math.exp(-omega * t)
            : 1 - Math.exp(-zeta * omega * t) * (Math.cos(omega * Math.sqrt(1 - zeta ** 2) * t) + zeta / Math.sqrt(1 - zeta ** 2) * Math.sin(omega * Math.sqrt(1 - zeta ** 2) * t));
          expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.002);
        }
      }
    }
  });
});
