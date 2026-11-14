import { describe, expect, it } from 'vitest';
import { resolveMotion } from './define-motion.js';
import './presets.js';

describe('presets', () => {
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
});
