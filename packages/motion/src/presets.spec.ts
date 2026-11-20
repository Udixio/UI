import { describe, expect, expectTypeOf, it } from 'vitest';
import { resolveMotion, type MotionName, type MotionRef, type MotionRegistry } from './define-motion.js';
import { blink, breathe, cascade, parallax, reflow, rise, rotate, shake } from './presets.js';
import type * as presets from './presets.js';

/** The names of the presets, read from their types. */
type PresetName = { [K in keyof typeof presets]: (typeof presets)[K] extends MotionRef<infer N> ? N : never }[keyof typeof presets];

describe('presets', () => {
  it('defines reflow as a layout motion without keyframes', () => {
    expect(reflow.spec.verb).toBe('layout');
    expect(resolveMotion('reflow')).toBe(reflow);
  });

  it('defines cascade as a staggered entry that rises and fades', () => {
    expect(cascade.spec).toEqual({
      verb: 'appear',
      keyframes: [
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0 },
      ],
      stagger: 'normal',
    });
    expect(resolveMotion('cascade')).toBe(cascade);
  });

  it('defines fade, slide, scale and press when the entry is imported', () => {
    expect(resolveMotion('fade')?.spec).toEqual({
      verb: 'appear',
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
    });
    expect(resolveMotion('slide')?.spec).toEqual({
      verb: 'appear',
      keyframes: [
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0 },
      ],
    });
    expect(resolveMotion('scale')?.spec).toEqual({
      verb: 'appear',
      keyframes: [
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1 },
      ],
    });
    expect(resolveMotion('press')?.spec).toEqual({
      verb: 'emphasize',
      keyframes: [{ scale: 1 }, { scale: 0.96 }, { scale: 1 }],
    });
  });

  it('defines rise, parallax, rotate, breathe, blink and shake, each with its verb', () => {
    const verbs = { rise: 'reveal', parallax: 'scrub', rotate: 'loop', breathe: 'loop', blink: 'loop', shake: 'emphasize' };
    for (const ref of [rise, parallax, rotate, breathe, blink, shake]) {
      expect(ref.spec.verb).toBe(verbs[ref.name as keyof typeof verbs]);
      expect(resolveMotion(ref.name)).toBe(ref);
    }
  });

  it('shakes on a 400 ms linear curve, so its 6 px peaks are reached', () => {
    expect(shake.spec.timing).toEqual({ duration: 'duration.medium4', easing: 'easing.linear' });
  });

  it('makes each loop preset pausable by its user', () => {
    for (const ref of [rotate, breathe, blink]) expect(ref.spec.pause).toBe('control');
  });
});

describe('motion names', () => {
  it('lists every preset in the registry of motion names, and only the presets, so that they autocomplete', () => {
    expectTypeOf<keyof MotionRegistry>().toEqualTypeOf<PresetName>();
  });

  it('types a motion name as a registered name or as any string, so that untyped names keep working', () => {
    expectTypeOf<'fade'>().toMatchTypeOf<MotionName>();
    expectTypeOf<'not-registered-yet'>().toMatchTypeOf<MotionName>();
    expectTypeOf<MotionName>().toMatchTypeOf<string>();
  });
});
