import { describe, expect, it } from 'vitest';
import { defineTokens, resolveCurve } from './index.js';
import type { CurveTiming } from './index.js';

describe('resolveCurve', () => {
  it('resolves every duration and easing combination from the token tables in Node', () => {
    const tokens = defineTokens();
    for (const [duration, value] of Object.entries(tokens.duration)) {
      for (const [easing, curve] of Object.entries(tokens.easing)) {
        expect(resolveCurve({ duration: `duration.${duration}`, easing: `easing.${easing}` } as CurveTiming)).toEqual({ duration: value, easing: curve });
      }
    }
  });
  it('rejects malformed records, unknown references and inherited or extra properties', () => {
    const valid = { duration: 'duration.short1', easing: 'easing.linear' };
    for (const input of [null, undefined, [], 'duration.short1', {}, { ...valid, extra: true }, Object.create(valid), { ...valid, duration: 'duration.__proto__' }, { ...valid, duration: 'duration.constructor' }, { ...valid, easing: 'easing.toString' }, { ...valid, duration: 50 }, { ...valid, easing: 'linear' }, { ...valid, [Symbol('extra')]: true }]) {
      expect(() => resolveCurve(input as CurveTiming)).toThrow();
    }
  });
  it('does not invoke accessor properties', () => {
    let read = false;
    const input: CurveTiming = { get duration(): 'duration.short1' { read = true; return 'duration.short1'; }, easing: 'easing.linear' };
    expect(() => resolveCurve(input)).toThrow();
    expect(read).toBe(false);
  });
});
