import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import { defaultColors } from '../../color';

export const tonalSpotVariant: Variant = variant({
  name: 'tonalSpot',
  palettes: {
    primary: ({ sourceColor, isDark }) => ({
      hue: sourceColor.hue,
      chroma: isDark ? 26 : 32,
    }),
    secondary: ({ sourceColor }) => ({ hue: sourceColor.hue, chroma: 16 }),
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 20, 71, 161, 333, 360],
        [-40, 48, -32, 40, -32],
      ),
      chroma: 28,
    }),
    neutral: ({ sourceColor }) => ({ hue: sourceColor.hue, chroma: 5 }),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return { hue: errorHue, chroma: 60 };
    },
  },
  customPalettes: (_, colorHct) => ({ hue: colorHct.hue, chroma: 16 }),
  colors: defaultColors,
});
