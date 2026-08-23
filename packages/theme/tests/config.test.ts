import { describe, expect, it } from 'vitest';

import { Color } from '../src/color/color.js';
import { defineConfig } from '../src/config/define-config.js';
import { loader } from '../src/loader/loader.js';
import { Variants } from '../src/variant/variants/index.js';

describe('theme configuration', () => {
  it('accepts simple hex values for the source, colors and palettes', async () => {
    const api = await loader(
      defineConfig({
        sourceColor: '#6750A4',
        colors: {
          brand: '#FF5722',
          brandAlias: Color.alias('brand'),
          highlight: Color.fromPalette('accent', {
            tone: () => 60,
          }),
        },
        palettes: {
          accent: '#E91E63',
        },
      }),
      false,
    );

    expect(api.context.sourceColor).toBeInstanceOf(Color);
    expect(api.context.sourceColor.hex).toBe('#6750a4');
    expect(api.colors.get('brand').hex).toBe('#ff5722');
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
        colors: { brand },
        palettes: { accent: brand },
      }),
      false,
    );

    expect(api.context.sourceColor).toBe(brand);
    expect(api.colors.get('brand')).toBe(brand);
    expect(api.palettes.get('accent').hue).toBeCloseTo(brand.hue, 0);
  });

  it('initializes a shared dynamic Color independently for each theme', async () => {
    const highlight = Color.fromPalette('accent', { tone: () => 60 });
    const first = await loader(
      defineConfig({
        sourceColor: '#6750A4',
        colors: { highlight },
        palettes: { accent: '#E91E63' },
      }),
      false,
    );
    const second = await loader(
      defineConfig({
        sourceColor: '#6750A4',
        colors: { highlight },
        palettes: { accent: '#00A896' },
      }),
      false,
    );

    expect(first.colors.get('highlight').hue).not.toBeCloseTo(
      second.colors.get('highlight').hue,
      0,
    );
  });

  it('modifies an existing dynamic color without freezing its source', async () => {
    const api = await loader(
      defineConfig({
        sourceColor: '#6750A4',
        colors: {
          surface: (color) => color.withTone(color.tone + 2),
        },
      }),
      false,
    );

    const surface = api.colors.get('surface');
    expect(surface.tone).toBe(100);

    api.context.update({ isDark: true });

    expect(surface.tone).toBeCloseTo(6, 0);
  });

  it('reapplies configured colors when the variant changes', async () => {
    const api = await loader(
      defineConfig({
        sourceColor: '#6750A4',
        colors: {
          brand: '#FF5722',
          surface: (color) => color.withTone(color.tone + 2),
        },
      }),
      false,
    );

    api.context.update({ variant: Variants.Vibrant });

    expect(api.colors.get('brand').hex).toBe('#ff5722');
    expect(api.colors.get('surface').tone).toBeCloseTo(99, 0);
  });

  it('runs default customizations before palette resolution rules', async () => {
    const constrained = Color.fromPalette('accent', {
      tone: () => 50,
      adjustTone: ({ tone }) => Math.min(60, tone),
      chromaMultiplier: () => 2,
    });

    const api = await loader(
      defineConfig({
        sourceColor: '#6750A4',
        colors: {
          before: constrained.transform((color) =>
            color.withTone(color.tone + 20).withChroma(10),
          ),
          after: constrained.afterResolution().withTone(80).withChroma(10),
          callbackAfter: constrained,
        },
        palettes: {
          accent: '#E91E63',
        },
      }),
      false,
    );

    expect(api.colors.get('before').tone).toBe(60);
    expect(api.colors.get('before').chroma).toBeCloseTo(20, 0);
    expect(api.colors.get('after').tone).toBeCloseTo(80, 0);
    expect(api.colors.get('after').chroma).toBeCloseTo(10, 0);

    api.colors.addColors({
      callbackAfter: (color) =>
        color.afterResolution((resolved) =>
          resolved.withTone(Math.min(100, resolved.tone + 20)),
        ),
    });

    expect(api.colors.get('callbackAfter').tone).toBeCloseTo(70, 0);
  });
});
