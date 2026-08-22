import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import { Color } from '../../color/color.base';
import { defaultColors } from '../../color';

export const neutralVariant: Variant = variant({
  name: 'neutral',
  palettes: {
    primary: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: Color.isBlue(sourceColor.hue) ? 12 : 8,
    }),
    secondary: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: Color.isBlue(sourceColor.hue) ? 6 : 4,
    }),
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 38, 105, 161, 204, 278, 333, 360],
        [-32, 26, 10, -39, 24, -15, -32],
      ),
      chroma: 20,
    }),
    neutral: ({ sourceColor }) => ({ hue: sourceColor.hue, chroma: 1.4 }),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return { hue: errorHue, chroma: 50 };
    },
  },
  customPalettes: (_, colorHct) => ({
    hue: colorHct.hue,
    chroma: Color.isBlue(colorHct.hue) ? 6 : 4,
  }),
  colors: defaultColors,
});
