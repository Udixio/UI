import { describe, expect, it } from 'vitest';
import { defineTokens } from './tokens.js';
import { validateMotionDocument } from './manifest.js';

describe('curve tokens', () => {
  it('returns independent initial tables in both schemes', () => {
    for (const scheme of ['expressive', 'standard'] as const) {
      const tokens = defineTokens({ scheme });
      expect(Object.values(tokens.duration)).toEqual([50,100,150,200,250,300,350,400,450,500,550,600,700,800,900,1000]);
      expect(Object.values(tokens.easing)).toEqual(['linear','cubic-bezier(0.2, 0, 0, 1)','cubic-bezier(0.3, 0, 1, 1)','cubic-bezier(0, 0, 0, 1)']);
      tokens.duration.short1 = 5;
      expect(defineTokens({ scheme }).duration.short1).toBe(50);
    }
  });
  it('accepts complete references and rejects invalid timing objects', () => {
    const check = (timing: unknown) => validateMotionDocument({version: 1, spec: {verb:'appear', keyframes:[{opacity:1}], timing}});
    expect(check({duration:'duration.medium2',easing:'easing.standard'}).valid).toBe(true);
    for (const timing of [null, [], {}, {duration:'duration.medium2'}, {duration:'duration.fake',easing:'easing.standard'}, {duration:'duration.medium2',easing:'easing.standard', extra:1}, Object.create({duration:'duration.medium2',easing:'easing.standard'})]) expect(check(timing).valid).toBe(false);
  });
});

it('exposes precise reference types', () => {
  const valid: import('./index.js').CurveTiming = { duration: 'duration.medium2', easing: 'easing.standard' };
  expect(valid.duration).toBe('duration.medium2');
  // @ts-expect-error Unknown duration references are not part of the contract.
  const badDuration: import('./index.js').DurationToken = 'duration.medium5';
  // @ts-expect-error Free CSS is not an easing reference.
  const badEasing: import('./index.js').EasingToken = 'ease-in';
  void badDuration; void badEasing;
  expect(defineTokens()).toEqual(defineTokens({ scheme: 'expressive' }));
});
