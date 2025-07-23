import { getPiecewiseHue, getRotatedHue, Variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';

export const tonalSpotVariant: Variant = {
  name: 'tonalSpot',
  palettes: {
    primary: ({ sourceColorHct, isDark }) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, isDark ? 26 : 32),
    secondary: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16),
    tertiary: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColorHct,
          [0, 20, 71, 161, 333, 360],
          [-40, 48, -32, 40, -32],
        ),
        28,
      ),
    neutral: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 5),
    neutralVariant: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 5 * 1.7),
    error: ({ sourceColorHct }) => {
      const errorHue = getPiecewiseHue(
        sourceColorHct,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 60);
    },
  },
  customPalettes: ({ colorHct }) =>
    TonalPalette.fromHueAndChroma(colorHct.hue, 16),
};
