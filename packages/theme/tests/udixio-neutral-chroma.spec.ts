import { describe, expect, it } from 'vitest';

import { Color } from '../src/color/color.base.js';
import { Context } from '../src/context/context.js';
import { Variants } from '../src/variant/variants/index.js';

// Le callback ne lit que `hue`, `chroma` et `tone` ; une source brute évite le
// rabattement au gamut qu'appliquerait `Color.from` sur un chroma de pointe.
const neutralChromaFor = (chroma: number, tone: number): number => {
  const sourceColor = { hue: 25, chroma, tone };
  const context = { sourceColor } as unknown as Context;
  return Variants.Udixio.paletteCallbacks['neutral'](context).chroma;
};

describe('udixio neutral palette chroma', () => {
  it('maps the range at the source tone onto [5, 10]', () => {
    for (const tone of [30, 50, 80]) {
      const [low, high] = Color.chromaRangeAt(tone);
      expect(neutralChromaFor(low, tone)).toBeCloseTo(5, 6);
      expect(neutralChromaFor(high, tone)).toBeCloseTo(10, 6);
      expect(neutralChromaFor((low + high) / 2, tone)).toBeCloseTo(7.5, 6);
    }
  });

  it('reads the range at the source tone, not a global one', () => {
    // Même chroma : jugé plus vif à un ton sombre, où le gamut est plus étroit.
    expect(neutralChromaFor(60, 30)).toBeGreaterThan(neutralChromaFor(60, 50));
  });

  it('clamps sources outside the range', () => {
    expect(neutralChromaFor(0, 50)).toBe(5);
    expect(neutralChromaFor(200, 50)).toBe(10);
  });
});
