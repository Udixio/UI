import { describe, expect, it } from 'vitest';

import { GAMUT_CHROMA_RANGE } from '../src/color/gamut.js';
import { Context } from '../src/context/context.js';
import { Variants } from '../src/variant/variants/index.js';

// Le callback ne lit que `hue` et `chroma` ; une source brute évite le
// rabattement au gamut qu'appliquerait `Color.from` sur un chroma de pointe.
const neutralChromaFor = (sourceChroma: number): number => {
  const sourceColor = { hue: 25, chroma: sourceChroma };
  const context = { sourceColor } as unknown as Context;
  return Variants.Udixio.paletteCallbacks['neutral'](context).chroma;
};

describe('udixio neutral palette chroma', () => {
  it('keeps the neutral a fixed proportion of the source chroma', () => {
    const [low, high] = GAMUT_CHROMA_RANGE;
    const ratio = 5 / low;
    expect(neutralChromaFor(low)).toBeCloseTo(5, 6);
    expect(neutralChromaFor(high)).toBeCloseTo(high * ratio, 6);
    expect(neutralChromaFor(80)).toBeCloseTo(80 * ratio, 6);
  });

  it('clamps sources outside the range', () => {
    const [low, high] = GAMUT_CHROMA_RANGE;
    expect(neutralChromaFor(0)).toBe(5);
    expect(neutralChromaFor(200)).toBeCloseTo(5 * (high / low), 6);
  });
});
