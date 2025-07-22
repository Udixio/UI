import { getPiecewiseHue, getRotatedHue, Variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../../material-color-utilities/htc';

export const neutralVariant: Variant = {
  palettes: {
    primary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        sourceColorHct.hue,
        Hct.isBlue(sourceColorHct.hue) ? 12 : 8,
      ),
    secondary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        sourceColorHct.hue,
        Hct.isBlue(sourceColorHct.hue) ? 6 : 4,
      ),
    tertiary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColorHct,
          [0, 38, 105, 161, 204, 278, 333, 360],
          [-32, 26, 10, -39, 24, -15, -32],
        ),
        20,
      ),
    neutral: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 1.4),
    neutralVariant: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 1.4 * 2.2),
    error: (sourceColorHct) => {
      const errorHue = getPiecewiseHue(
        sourceColorHct,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 50);
    },
  },
  customPalettes: (colorHct) =>
    TonalPalette.fromHueAndChroma(
      colorHct.hue,
      Hct.isBlue(colorHct.hue) ? 6 : 4,
    ),
  colors: {},
};
