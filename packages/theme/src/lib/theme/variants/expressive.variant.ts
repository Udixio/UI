import { Variant } from '../variant';
import {
  DynamicScheme,
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';

export const tonalSpot: Variant = {
  palettes: {
    primary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, isDark ? 36 : 48),
    secondary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(
          sourceColorHct,
          [0, 105, 140, 204, 253, 278, 300, 333, 360],
          [-160, 155, -100, 96, -96, -156, -165, -160],
        ),
        isDark ? 16 : 24,
      ),
    tertiary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        sanitizeDegreesDouble(sourceColorHct.hue + 60.0),
        24.0,
      ),
    neutral: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
    neutralVariant: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
  },
  customPalettes: (colorHct) => TonalPalette.fromHueAndChroma(colorHct.hue, 16),
  colors: {},
};
