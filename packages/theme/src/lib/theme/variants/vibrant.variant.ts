import {
  getRotatedHue,
  hues,
  secondaryRotations,
  tertiaryRotations,
  Variant,
} from '../variant';
import { TonalPalette } from '@material/material-color-utilities';

export const vibrant: Variant = {
  palettes: {
    primary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 200.0),
    secondary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(sourceColorHct, hues, secondaryRotations),
        24.0,
      ),
    tertiary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(sourceColorHct, hues, tertiaryRotations),
        32.0,
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
};
