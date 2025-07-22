import { Variant } from '../variant';
import {
  DynamicScheme,
  TonalPalette,
} from '@material/material-color-utilities';
import { Hct } from '../../material-color-utilities/htc';

export const tonalSpot: Variant = {
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
        DynamicScheme.getRotatedHue(
          sourceColorHct,
          [0, 38, 105, 161, 204, 278, 333, 360],
          [-32, 26, 10, -39, 24, -15, -32],
        ),
        20,
      ),
    neutral: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
    neutralVariant: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
  },
  customPalettes: (colorHct) => TonalPalette.fromHueAndChroma(colorHct.hue, 16),
  colors: {},
};
