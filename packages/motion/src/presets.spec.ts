import { describe, expect, it } from 'vitest';
import { resolveMotion } from './define-motion.js';
import { blink, breathe, cascade, parallax, reflow, rise, rotate, shake } from './presets.js';

describe('presets', () => {
  it('defines reflow as a layout motion without keyframes', () => {
    expect(reflow.spec.verb).toBe('layout');
    expect(resolveMotion('reflow')).toBe(reflow);
  });

  it('defines cascade as a staggered entry that rises and fades', () => {
    expect(cascade.spec).toEqual({
      verb: 'appear',
      keyframes: [
        { opacity: 0, y: 16 },
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

  it('makes each loop preset pausable by its user', () => {
    for (const ref of [rotate, breathe, blink]) expect(ref.spec.pause).toBe('control');
  });
});
