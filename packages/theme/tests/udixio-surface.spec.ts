import { describe, expect, it } from 'vitest';

import { Color } from '../src/color/color.base.js';
import { loader } from '../src/loader/loader.js';
import { Variants } from '../src/variant/variants/index.js';

const SURFACE_ROLES = [
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
] as const;

type SurfaceRole = (typeof SURFACE_ROLES)[number];

async function getSurfaceTones({
  hue,
  isDark = false,
  contrastLevel = 0,
}: {
  hue: number;
  isDark?: boolean;
  contrastLevel?: number;
}): Promise<Record<SurfaceRole, number>> {
  const api = await loader(
    {
      sourceColor: Color.from({ hue, chroma: 20, tone: 50 }),
      variant: Variants.Udixio,
      isDark,
      contrastLevel,
    },
    false,
  );

  return Object.fromEntries(
    SURFACE_ROLES.map((role) => [role, api.colors.get(role).tone]),
  ) as Record<SurfaceRole, number>;
}

describe('udixio surface tones', () => {
  it('keeps the layer calculation continuous and applies the yellow lift', async () => {
    const yellow = await getSurfaceTones({ hue: 115 });
    const nonYellow = await getSurfaceTones({ hue: 30 });

    expect(yellow).toEqual({
      surface: 99,
      surfaceDim: 90,
      surfaceBright: 99,
      surfaceContainerLowest: 100,
      surfaceContainerLow: 98,
      surfaceContainer: 96,
      surfaceContainerHigh: 94,
      surfaceContainerHighest: 92,
    });
    expect(nonYellow).toEqual({
      surface: 98,
      surfaceDim: 87,
      surfaceBright: 98,
      surfaceContainerLowest: 100,
      surfaceContainerLow: 96,
      surfaceContainer: 94,
      surfaceContainerHigh: 92,
      surfaceContainerHighest: 90,
    });
  });

  it('keeps the same continuous layer calculation in dark themes', async () => {
    await expect(getSurfaceTones({ hue: 115, isDark: true })).resolves.toEqual({
      surface: 4,
      surfaceDim: 4,
      surfaceBright: 18,
      surfaceContainerLowest: 0,
      surfaceContainerLow: 6,
      surfaceContainer: 9,
      surfaceContainerHigh: 12,
      surfaceContainerHighest: 15,
    });
  });

  it('applies contrast to surface layer tones', async () => {
    await expect(
      getSurfaceTones({ hue: 115, contrastLevel: 1 }),
    ).resolves.toEqual({
      surface: 98,
      surfaceDim: 80,
      surfaceBright: 98,
      surfaceContainerLowest: 100,
      surfaceContainerLow: 96,
      surfaceContainer: 92,
      surfaceContainerHigh: 88,
      surfaceContainerHighest: 84,
    });

    await expect(
      getSurfaceTones({ hue: 115, contrastLevel: -1 }),
    ).resolves.toEqual({
      surface: 100,
      surfaceDim: 100,
      surfaceBright: 100,
      surfaceContainerLowest: 100,
      surfaceContainerLow: 100,
      surfaceContainer: 100,
      surfaceContainerHigh: 100,
      surfaceContainerHighest: 100,
    });
  });
});
