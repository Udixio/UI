import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';
import { defaultColors } from '../../color';

export const tonalSpotVariant: Variant = variant({
  name: 'tonalSpot',
  palettes: {
    primary: ({ sourceColor, isDark }) =>
      TonalPalette.fromHueAndChroma(sourceColor.hue, isDark ? 26 : 32),
    secondary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(sourceColor.hue, 16),
    tertiary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColor,
          [0, 20, 71, 161, 333, 360],
          [-40, 48, -32, 40, -32],
        ),
        28,
      ),
    neutral: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(sourceColor.hue, 5),
    neutralVariant: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(sourceColor.hue, 5 * 1.7),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 60);
    },
  },
  customPalettes: (_, colorHct) =>
    TonalPalette.fromHueAndChroma(colorHct.hue, 16),
  colors: defaultColors,
});
