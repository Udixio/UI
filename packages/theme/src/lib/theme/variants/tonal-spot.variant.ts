import { Variant } from '../variant';
import {
  DynamicScheme,
  sanitizeDegreesDouble,
  TonalPalette
} from '@material/material-color-utilities';

export const tonalSpotVariant: Variant = {
  palettes: {
    primary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, isDark ? 26 : 32),
    secondary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16),
    tertiary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(
          sourceColorHct, [0, 20, 71, 161, 333, 360],
          [-40, 48, -32, 40, -32]),
       28 );
    neutral: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        sourceColorHct.hue,  5),
    neutralVariant: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
  },
  customPalettes: (colorHct) => TonalPalette.fromHueAndChroma(colorHct.hue, 16),
  colors: {},
};
