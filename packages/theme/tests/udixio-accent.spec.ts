import { Contrast } from '@material/material-color-utilities';
import { describe, expect, it } from 'vitest';

import { defineConfig } from '../src/config/index.js';
import { loader } from '../src/loader/loader.js';
import { Variants } from '../src/variant/variants/index.js';

const build = async (sourceColor: string, isDark: boolean) => {
  const api = await loader(
    defineConfig({ sourceColor, isDark, variant: Variants.Udixio }),
    false,
  );
  await api.load();
  return api.colors;
};

const primaryTone = async (sourceColor: string, isDark: boolean) =>
  (await build(sourceColor, isDark)).get('primary').tone;

describe('udixio primary across modes', () => {
  it('keeps the source tone where it is accessible', async () => {
    expect(await primaryTone('#D0BCFE', true)).toBeCloseTo(80, 0);
    expect(await primaryTone('#1E3A8A', false)).toBeCloseTo(27, 0);
  });

  it('mirrors black, white and a tinted white to the opposite extreme', async () => {
    expect(await primaryTone('#000000', true)).toBe(100);
    expect(await primaryTone('#FFFFFF', false)).toBeLessThan(5);
    expect(await primaryTone('#fbf4fe', false)).toBeLessThan(12);
  });

  it('keeps a grey in its role rather than flipping it', async () => {
    const tone = await primaryTone('#333333', true);
    expect(tone).toBeGreaterThan(75);
    expect(tone).toBeLessThan(95);
  });

  it('re-chooses a pastel between its mirror and the target, with a readable on-color', async () => {
    const colors = await build('#D0BCFE', false);
    const primary = colors.get('primary').tone;
    expect(primary).toBeGreaterThan(25);
    expect(
      Contrast.ratioOfTones(primary, colors.get('surfaceDim').tone),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      Contrast.ratioOfTones(primary, colors.get('onPrimary').tone),
    ).toBeGreaterThanOrEqual(6 - 0.05);
  });

  it('keeps a saturated yellow out of the near-black band', async () => {
    expect(await primaryTone('#FFCC00', false)).toBeGreaterThan(35);
  });

  it('lifts a dark saturated blue past the target, not to white', async () => {
    const tone = await primaryTone('#1E3A8A', true);
    expect(tone).toBeGreaterThanOrEqual(57);
    expect(tone).toBeLessThan(85);
  });
});

describe('udixio on-colors', () => {
  it('answers a white or black accent with the opposite extreme', async () => {
    expect((await build('#000000', true)).get('onPrimary').tone).toBe(0);
    expect(
      (await build('#FFFFFF', false)).get('onPrimary').tone,
    ).toBeGreaterThan(95);
  });

  it('starts from the inverse tone and only then asks for contrast', async () => {
    // T80 → T20 already exceeds 6:1; T30 → T70 does not and gets pushed.
    expect((await build('#D0BCFE', true)).get('onPrimary').tone).toBeCloseTo(
      20,
      0,
    );
    const light = await build('#D0BCFE', false);
    expect(
      Contrast.ratioOfTones(
        light.get('primary').tone,
        light.get('onPrimary').tone,
      ),
    ).toBeGreaterThanOrEqual(6 - 0.05);
  });
});
