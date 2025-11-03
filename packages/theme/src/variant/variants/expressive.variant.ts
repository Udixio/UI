import { getPiecewiseHue, getRotatedHue, variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../../material-color-utilities/htc';
import { defaultColors } from '../../color';

const getExpressiveNeutralHue = (sourceColor: Hct): number => {
  const hue = getRotatedHue(
    sourceColor,
    [0, 71, 124, 253, 278, 300, 360],
    [10, 0, 10, 0, 10, 0],
  );
  return hue;
};
const getExpressiveNeutralChroma = (
  sourceColor: Hct,
  isDark: boolean,
): number => {
  const neutralHue = getExpressiveNeutralHue(sourceColor);
  return isDark ? (Hct.isYellow(neutralHue) ? 6 : 14) : 18;
};

export const expressiveVariant = variant({
  name: 'expressive',
  palettes: {
    primary: ({ sourceColor, isDark }) => ({
      hue: sourceColor.hue,
      chroma: isDark ? 36 : 48,
    }),
    secondary: ({ sourceColor, isDark }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 105, 140, 204, 253, 278, 300, 333, 360],
        [-160, 155, -100, 96, -96, -156, -165, -160],
      ),

      chroma: isDark ? 16 : 24,
    }),
    tertiary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColor,
          [0, 105, 140, 204, 253, 278, 300, 333, 360],
          [-165, 160, -105, 101, -101, -160, -170, -165],
        ),
        48,
      ),
    neutral: ({ sourceColor, isDark }) =>
      TonalPalette.fromHueAndChroma(
        getExpressiveNeutralHue(sourceColor),
        getExpressiveNeutralChroma(sourceColor, isDark),
      ),
    neutralVariant: ({ sourceColor, isDark }) => {
      const expressiveNeutralHue = getExpressiveNeutralHue(sourceColor);
      const expressiveNeutralChroma = getExpressiveNeutralChroma(
        sourceColor,
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
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 64);
    },
  },
  customPalettes: ({ isDark }, color) =>
    TonalPalette.fromHueAndChroma(
      getRotatedHue(
        color,
        [0, 105, 140, 204, 253, 278, 300, 333, 360],
        [-160, 155, -100, 96, -96, -156, -165, -160],
      ),
      isDark ? 16 : 24,
    ),
  colors: defaultColors,
});
