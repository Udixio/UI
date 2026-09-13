import { describe, expect, it } from 'vitest';

import { Color } from '../src/color/color.base.js';
import { defineConfig } from '../src/config/index.js';
import { Context } from '../src/context/context.js';
import { loader } from '../src/loader/loader.js';
import { Variants } from '../src/variant/variants/index.js';

// The callback only reads `hue`, `chroma` and `tone`; a raw source avoids the
// gamut clipping `Color.from` would apply to a peak chroma.
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
    // Same chroma: judged more vivid at a dark tone, where the gamut is narrower.
    expect(neutralChromaFor(60, 30)).toBeGreaterThan(neutralChromaFor(60, 50));
  });

  it('clamps sources outside the range', () => {
    expect(neutralChromaFor(0, 50)).toBe(5);
    expect(neutralChromaFor(200, 50)).toBe(10);
  });

  it.each(['#000000', '#FFFFFF'])(
    'stays a real grey for a %s source, where the gamut has no width',
    async (sourceColor) => {
      const api = await loader(
        defineConfig({ sourceColor, isDark: false, variant: Variants.Udixio }),
        false,
      );
      await api.load();
      expect(api.palettes.get('neutral').chroma).toBeCloseTo(5, 5);
      expect(api.colors.get('surface').hex).not.toBe('#000000');
    },
  );
});
