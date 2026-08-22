import { describe, expect, it } from 'vitest';

import { Color } from '../src/color/color.js';
import { defineConfig } from '../src/config/define-config.js';
import { loader } from '../src/loader/loader.js';

describe('theme configuration', () => {
  it('accepts simple hex values for the source, colors and palettes', async () => {
    const api = await loader(
      defineConfig({
        sourceColor: '#6750A4',
        colors: {
          static: {
            brand: '#FF5722',
            brandAlias: { alias: 'brand' },
          },
          fromPalette: {
            highlight: {
              palette: 'accent',
              tone: () => 60,
            },
          },
        },
        palettes: {
          accent: '#E91E63',
        },
      }),
      false,
    );

    expect(api.context.sourceColor).toBeInstanceOf(Color);
    expect(api.context.sourceColor.hex).toBe('#6750a4');
    expect(api.colors.get('brand').hex).toBe('#FF5722');
    expect(api.colors.get('brandAlias').hex).toBe('#ff5722');
    expect(api.colors.get('highlight').tone).toBe(60);
    expect(api.palettes.get('accent').hue).toBeCloseTo(
      Color.fromHex('#E91E63').hue,
      0,
    );
  });

  it('normalizes dynamic hex source colors when the context reads them', async () => {
    const sourceColor = (context: { isDark: boolean }) =>
      context.isDark ? '#A08EC4' : '#6750A4';
    const api = await loader(defineConfig({ sourceColor }), false);

    expect(api.context.rawSourceColor).toBe(sourceColor);
    expect(api.context.sourceColor.hex).toBe('#6750a4');

    api.context.update({ isDark: true });

    expect(api.context.sourceColor.hex).toBe('#a08ec4');
  });

  it('also accepts Color instances for advanced configuration', async () => {
    const brand = Color.fromHex('#FF5722');
    const api = await loader(
      defineConfig({
        sourceColor: brand,
        colors: { static: { brand } },
        palettes: { accent: brand },
      }),
      false,
    );

    expect(api.context.sourceColor).toBe(brand);
    expect(api.colors.get('brand')).toBe(brand);
    expect(api.palettes.get('accent').hue).toBeCloseTo(brand.hue, 0);
  });
});
