import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';

export const fidelityVariant: Variant = variant({
  name: 'fidelity',
  palettes: {
    primary: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: sourceColor.chroma,
    }),
    secondary: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: sourceColor.chroma / 1.4,
    }),
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 20, 71, 161, 333, 360],
        [-40, 48, -32, 40, -32],
      ),
      chroma: sourceColor.chroma,
    }),
    neutral: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: 5,
    }),
    neutralVariant: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: 5 * 1.7,
    }),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return {
        hue: errorHue,
        chroma: 60,
      };
    },
  },
  customPalettes: ({ sourceColor }, colorHct) => ({
    hue: colorHct.hue,
    chroma: sourceColor.chroma,
  }),
});
