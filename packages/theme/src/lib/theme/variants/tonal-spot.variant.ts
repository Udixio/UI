import { Variant } from '../variant';
import {
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';

export const tonalSpot: Variant = {
  palettes: {
    primary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 36.0),
    secondary: (sourceColorHct) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16.0),
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
};
