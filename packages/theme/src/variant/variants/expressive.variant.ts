import { getPiecewiseHue, getRotatedHue, variant } from '../variant';
import { Color } from '../../color/color.base';
import { defaultColors } from '../../color';

const getExpressiveNeutralHue = (sourceColor: Color): number => {
  const hue = getRotatedHue(
    sourceColor,
    [0, 71, 124, 253, 278, 300, 360],
    [10, 0, 10, 0, 10, 0],
  );
  return hue;
};
const getExpressiveNeutralChroma = (
  sourceColor: Color,
  isDark: boolean,
): number => {
  const neutralHue = getExpressiveNeutralHue(sourceColor);
  return isDark ? (Color.isYellow(neutralHue) ? 6 : 14) : 18;
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
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 105, 140, 204, 253, 278, 300, 333, 360],
        [-165, 160, -105, 101, -101, -160, -170, -165],
      ),
      chroma: 48,
    }),
    neutral: ({ sourceColor, isDark }) => ({
      hue: getExpressiveNeutralHue(sourceColor),
      chroma: getExpressiveNeutralChroma(sourceColor, isDark),
    }),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return { hue: errorHue, chroma: 64 };
    },
  },
  customPalettes: ({ isDark }, color) => ({
    hue: getRotatedHue(
      color,
      [0, 105, 140, 204, 253, 278, 300, 333, 360],
      [-160, 155, -100, 96, -96, -156, -165, -160],
    ),
    chroma: isDark ? 16 : 24,
  }),
  colors: defaultColors,
});
