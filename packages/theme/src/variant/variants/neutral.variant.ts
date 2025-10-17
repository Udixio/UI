import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../../material-color-utilities/htc';
import { defaultColors } from '../../color';

export const neutralVariant: Variant = variant({
  name: 'neutral',
  palettes: {
    primary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        sourceColor.hue,
        Hct.isBlue(sourceColor.hue) ? 12 : 8,
      ),
    secondary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        sourceColor.hue,
        Hct.isBlue(sourceColor.hue) ? 6 : 4,
      ),
    tertiary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColor,
          [0, 38, 105, 161, 204, 278, 333, 360],
          [-32, 26, 10, -39, 24, -15, -32],
        ),
        20,
      ),
    neutral: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(sourceColor.hue, 1.4),
    neutralVariant: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(sourceColor.hue, 1.4 * 2.2),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 50);
    },
  },
  customPalettes: (_, colorHct) =>
    TonalPalette.fromHueAndChroma(
      colorHct.hue,
      Hct.isBlue(colorHct.hue) ? 6 : 4,
    ),
  colors: defaultColors,
});
