import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import { Color } from '../../color/color';
import { defaultColors } from '../../color';

const getVibrantNeutralHue = (sourceColor: Color): number => {
  return getRotatedHue(
    sourceColor,
    [0, 38, 105, 140, 333, 360],
    [-14, 10, -14, 10, -14],
  );
};

const getVibrantNeutralChroma = (sourceColor: Color): number => {
  return 28;
};

export const vibrantVariant: Variant = variant({
  name: 'vibrant',
  palettes: {
    primary: ({ sourceColor }) => ({ hue: sourceColor.hue, chroma: 74 }),
    secondary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 38, 105, 140, 333, 360],
        [-14, 10, -14, 10, -14],
      ),
      chroma: 56,
    }),
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 38, 71, 105, 140, 161, 253, 333, 360],
        [-72, 35, 24, -24, 62, 50, 62, -72],
      ),
      chroma: 56,
    }),
    neutral: ({ sourceColor }) => ({
      hue: getVibrantNeutralHue(sourceColor),
      chroma: getVibrantNeutralChroma(sourceColor),
    }),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return { hue: errorHue, chroma: 80 };
    },
  },
  customPalettes: (_, colorHct) => ({
    hue: getRotatedHue(
      colorHct,
      [0, 38, 105, 140, 333, 360],
      [-14, 10, -14, 10, -14],
    ),
    chroma: 56,
  }),
  colors: defaultColors,
});
