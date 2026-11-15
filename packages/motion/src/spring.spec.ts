import { describe, expect, it } from 'vitest';
import { springOffset, springSettleTime, springVelocity } from './spring.js';
import type { SpringParams } from './spring.js';
import type { SpringRef } from './motion-spec.js';
import { resolveSpring, springParams } from './tokens.js';
import type { MotionScheme } from './tokens.js';

const refs: SpringRef[] = [
  'spring.fast.spatial', 'spring.fast.effects',
  'spring.default.spatial', 'spring.default.effects',
  'spring.slow.spatial', 'spring.slow.effects',
];
const schemes: MotionScheme[] = ['expressive', 'standard'];
const underdamped: SpringParams = { dampingRatio: 0.6, stiffness: 800 };
const critical: SpringParams = { dampingRatio: 1, stiffness: 800 };

/** Stops of a generated linear() easing as [progress in 0..1, value] pairs. */
function stopsOf(easing: string): Array<[number, number]> {
  const body = /^linear\((.*)\)$/.exec(easing)?.[1];
  if (body === undefined) throw new Error(`Not a linear() easing: ${easing}`);
  return body.split(',').map(stop => {
    const [value, position] = stop.trim().split(/\s+/);
    return [parseFloat(position) / 100, Number(value)];
  });
}

/** Value of a linear() easing at progress `p`, interpolated between its stops. */
function easedAt(stops: Array<[number, number]>, p: number): number {
  for (let i = 1; i < stops.length; i++) {
    const [p1, v1] = stops[i];
    if (p <= p1) {
      const [p0, v0] = stops[i - 1];
      return v0 + ((v1 - v0) * (p - p0)) / (p1 - p0);
    }
  }
  return stops[stops.length - 1][1];
}

/** Central difference of `springOffset` with respect to time, in seconds. */
function numericVelocity(params: SpringParams, offset: number, velocity: number, t: number): number {
  const h = 1e-5;
  return (springOffset(params, offset, velocity, t + h) - springOffset(params, offset, velocity, t - h)) / (2 * h);
}

describe('springOffset', () => {
  it('starts at the offset and tends to the target', () => {
    for (const params of [underdamped, critical]) {
      expect(springOffset(params, 1, 0, 0)).toBe(1);
      expect(Math.abs(springOffset(params, 1, 0, 10))).toBeLessThan(1e-9);
    }
  });

  for (const scheme of schemes) {
    for (const ref of refs) {
      it(`${ref} under ${scheme} matches its linear() easing at ten instants`, () => {
        const token = resolveSpring(ref, { scheme, support: { linear: true, fallback: false } });
        const params = springParams(ref, scheme);
        const stops = stopsOf(token.easing);
        for (let step = 1; step <= 10; step++) {
          const ms = (token.duration * step) / 10;
          const expected = easedAt(stops, ms / token.duration);
          const actual = 1 - springOffset(params, 1, 0, ms / 1000);
          expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.005);
        }
      });
    }
  }
});

describe('springVelocity', () => {
  it('starts at the initial velocity', () => {
    expect(springVelocity(underdamped, 1, -3, 0)).toBeCloseTo(-3, 9);
    expect(springVelocity(critical, 0.5, 2, 0)).toBeCloseTo(2, 9);
  });

  it('is the time derivative of the offset, underdamped and critically damped', () => {
    const cases: Array<[SpringParams, number, number]> = [
      [underdamped, 1, 0],
      [underdamped, 1, 5],
      [critical, 1, 0],
      [critical, -0.5, 2],
    ];
    for (const [params, offset, velocity] of cases) {
      for (const t of [0.01, 0.05, 0.2, 0.5]) {
        const analytic = springVelocity(params, offset, velocity, t);
        const numeric = numericVelocity(params, offset, velocity, t);
        expect(Math.abs(analytic - numeric)).toBeLessThanOrEqual(1e-3 * Math.max(Math.abs(numeric), 1));
      }
    }
  });
});

describe('springSettleTime', () => {
  for (const scheme of schemes) {
    for (const ref of refs) {
      it(`${ref} under ${scheme} settles within an envelope bound of its token duration`, () => {
        const token = resolveSpring(ref, { scheme, support: { linear: true, fallback: false } });
        const settle = springSettleTime(springParams(ref, scheme), 1, 0, 0.001) * 1000;
        expect(settle).toBeGreaterThanOrEqual(0.85 * token.duration);
        expect(settle).toBeLessThanOrEqual(1.25 * token.duration);
      });
    }
  }

  it('is zero when the offset is already within epsilon', () => {
    expect(springSettleTime(underdamped, 0, 0, 0.001)).toBe(0);
  });

  it('is capped at five seconds', () => {
    expect(springSettleTime({ dampingRatio: 0.001, stiffness: 1 }, 1, 0, 0.001)).toBe(5);
  });
});

describe('overdamped springs', () => {
  it('are refused by every function', () => {
    const overdamped: SpringParams = { dampingRatio: 1.2, stiffness: 800 };
    expect(() => springOffset(overdamped, 1, 0, 0.1)).toThrow(new RangeError('Unsupported damping ratio'));
    expect(() => springVelocity(overdamped, 1, 0, 0.1)).toThrow(RangeError);
    expect(() => springSettleTime(overdamped, 1, 0, 0.001)).toThrow(RangeError);
  });
});

describe('springParams', () => {
  it('returns the physical parameters of the token for the scheme', () => {
    expect(springParams('spring.default.spatial', 'expressive')).toEqual({ dampingRatio: 0.8, stiffness: 380 });
    expect(springParams('spring.default.spatial', 'standard')).toEqual({ dampingRatio: 0.9, stiffness: 700 });
    expect(springParams('spring.fast.effects', 'standard')).toEqual({ dampingRatio: 1, stiffness: 3800 });
  });

  it('refuses unknown references', () => {
    const unknownRef: string = 'spring.huge.spatial';
    expect(() => springParams(unknownRef as SpringRef, 'expressive')).toThrow(RangeError);
  });
});
