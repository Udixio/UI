/**
 * A variant is a shared description, not a theme.
 *
 * `Variants.TonalSpot` and friends are module singletons, so two themes built
 * in the same process reach for the same object. That is fine for the callbacks
 * — they are pure — but the instantiated palettes belong to a context, and used
 * to be stored on the variant itself. The second theme silently kept the first
 * one's palettes.
 *
 * It matters wherever more than one theme lives in a process: the React worker
 * rebuilding a theme from a snapshot, the documentation previewing several at
 * once, and any test file that loads a grid.
 */
import { describe, expect, it } from 'vitest';

import { loader, variant } from '../src/index.js';
import { Variants } from '../src/variant/variants/index.js';

describe('variant isolation', () => {
  it('gives each theme its own palettes, from the same variant', async () => {
    const first = await loader(
      { sourceColor: '#6750A4', variant: Variants.TonalSpot },
      false,
    );
    const second = await loader(
      { sourceColor: '#B3261E', variant: Variants.TonalSpot },
      false,
    );

    // Different source colours must give different palettes…
    expect(second.palettes.get('primary').hue).not.toBeCloseTo(
      first.palettes.get('primary').hue,
      0,
    );

    // …and building the second must not have disturbed the first.
    expect(first.colors.get('primary').hex).toBe('#655789');
  });

  it('keeps the two themes apart when their contexts diverge', async () => {
    const light = await loader(
      { sourceColor: '#6750A4', variant: Variants.Vibrant, isDark: false },
      false,
    );
    const dark = await loader(
      { sourceColor: '#6750A4', variant: Variants.Vibrant, isDark: true },
      false,
    );

    expect(light.colors.get('surface').tone).toBeGreaterThan(50);
    expect(dark.colors.get('surface').tone).toBeLessThan(50);
  });
});

describe('extending a variant', () => {
  it('exposes the raw callbacks, so one variant can start from another', async () => {
    const warmer = variant({
      name: 'warmer',
      palettes: {
        ...Variants.TonalSpot.paletteCallbacks,
        neutral: ({ sourceColor }) => sourceColor.rotate(20).withChroma(8),
      },
      customPalettes: Variants.TonalSpot.customPalettes,
      colors: Variants.TonalSpot.colors,
    });

    const base = await loader(
      { sourceColor: '#6750A4', variant: Variants.TonalSpot },
      false,
    );
    const api = await loader(
      { sourceColor: '#6750A4', variant: warmer },
      false,
    );

    // The overridden palette moved…
    expect(api.palettes.get('neutral').hue).toBeCloseTo(
      base.palettes.get('neutral').hue + 20,
      0,
    );
    // The HCT solver rounds; the value is what matters, not the decimal.
    expect(api.palettes.get('neutral').chroma).toBeCloseTo(8, 0);

    // …and the ones we did not touch came through unchanged.
    expect(api.palettes.get('primary').hue).toBeCloseTo(
      base.palettes.get('primary').hue,
      1,
    );
    expect(api.palettes.get('tertiary').hue).toBeCloseTo(
      base.palettes.get('tertiary').hue,
      1,
    );
  });
});
