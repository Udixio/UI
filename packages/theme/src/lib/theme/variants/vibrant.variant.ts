import { getRotatedHue, hues, secondaryRotations, Variant } from '../variant';
import {
  DynamicScheme,
  TonalPalette,
} from '@material/material-color-utilities';

export const vibrant: Variant = {
  palettes: {
    primary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 74),
    secondary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(
          sourceColorHct,
          [0, 38, 105, 140, 333, 360],
          [-14, 10, -14, 10, -14],
        ),
        56,
      ),
    tertiary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        DynamicScheme.getRotatedHue(
          sourceColorHct,
          [0, 38, 71, 105, 140, 161, 253, 333, 360],
          [-72, 35, 24, -24, 62, 50, 62, -72],
        ),
        56,
      ),
    neutral: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
    neutralVariant: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
  },
  customPalettes: (colorHct) =>
    TonalPalette.fromHueAndChroma(
      getRotatedHue(colorHct, hues, secondaryRotations),
      24.0,
    ),

  colors: {},
};
