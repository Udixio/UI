import { getPiecewiseHue, getRotatedHue, Variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../../material-color-utilities/htc';

const getExpressiveNeutralHue = (sourceColorHct: Hct): number => {
  const hue = getRotatedHue(
    sourceColorHct,
    [0, 71, 124, 253, 278, 300, 360],
    [10, 0, 10, 0, 10, 0],
  );
  return hue;
};
const getExpressiveNeutralChroma = (
  sourceColorHct: Hct,
  isDark: boolean,
): number => {
  const neutralHue = getExpressiveNeutralHue(sourceColorHct);
  return isDark ? (Hct.isYellow(neutralHue) ? 6 : 14) : 18;
};

export const expressiveVariant: Variant = {
  palettes: {
    primary: ({ sourceColorHct, isDark }) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, isDark ? 36 : 48),
    secondary: ({ sourceColorHct, isDark }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColorHct,
          [0, 105, 140, 204, 253, 278, 300, 333, 360],
          [-160, 155, -100, 96, -96, -156, -165, -160],
        ),
        isDark ? 16 : 24,
      ),
    tertiary: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColorHct,
          [0, 105, 140, 204, 253, 278, 300, 333, 360],
          [-165, 160, -105, 101, -101, -160, -170, -165],
        ),
        48,
      ),
    neutral: ({ sourceColorHct, isDark }) =>
      TonalPalette.fromHueAndChroma(
        getExpressiveNeutralHue(sourceColorHct),
        getExpressiveNeutralChroma(sourceColorHct, isDark),
      ),
    neutralVariant: ({ sourceColorHct, isDark }) => {
      const expressiveNeutralHue = getExpressiveNeutralHue(sourceColorHct);
      const expressiveNeutralChroma = getExpressiveNeutralChroma(
        sourceColorHct,
        isDark,
      );
      return TonalPalette.fromHueAndChroma(
        expressiveNeutralHue,
        expressiveNeutralChroma *
          (expressiveNeutralHue >= 105 && expressiveNeutralHue < 125
            ? 1.6
            : 2.3),
      );
    },
    error: ({ sourceColorHct }) => {
      const errorHue = getPiecewiseHue(
        sourceColorHct,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 64);
    },
  },
  customPalettes: ({ colorHct, isDark }) =>
    TonalPalette.fromHueAndChroma(
      getRotatedHue(
        colorHct,
        [0, 105, 140, 204, 253, 278, 300, 333, 360],
        [-160, 155, -100, 96, -96, -156, -165, -160],
      ),
      isDark ? 16 : 24,
    ),
};
