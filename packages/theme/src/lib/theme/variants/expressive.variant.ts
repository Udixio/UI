import { Variant } from '../variant';
import {
  DynamicScheme,
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
        DynamicScheme.getRotatedHue(
          sourceColorHct,
          [0, 105, 140, 204, 253, 278, 300, 333, 360],
          [-165, 160, -105, 101, -101, -160, -170, -165],
        ),
        48,
      ),
    neutral: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
    neutralVariant: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
  },
  customPalettes: (colorHct) => TonalPalette.fromHueAndChroma(colorHct.hue, 16),
  colors: {},
};
