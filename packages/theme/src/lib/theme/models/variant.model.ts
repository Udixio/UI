import {
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';
import { getRotatedHue, VariantEntity } from '../entities/variant.entity';

export class VariantModel {
  static tonalSpot: VariantEntity = {
    palettes: {
      primary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 36.0),
      secondary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 16.0),
      tertiary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(
          sanitizeDegreesDouble(sourceColorHct.hue + 60.0),
          24.0
        ),
      neutral: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
      neutralVariant: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
    },
    customPalettes: (colorHct) =>
      TonalPalette.fromHueAndChroma(colorHct.hue, 16),
  };
  static vibrant: VariantEntity = {
    palettes: {
      primary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 200.0),
      secondary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(
          getRotatedHue(sourceColorHct, this.hues, this.secondaryRotations),
          24.0
        ),
      tertiary: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(
          getRotatedHue(sourceColorHct, this.hues, this.tertiaryRotations),
          32.0
        ),
      neutral: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0),
      neutralVariant: (sourceColorHct) =>
        TonalPalette.fromHueAndChroma(sourceColorHct.hue, 8.0),
    },
    customPalettes: (colorHct) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(colorHct, this.hues, this.secondaryRotations),
        24.0
      ),
  };

  private static readonly hues = [
    0.0, 41.0, 61.0, 101.0, 131.0, 181.0, 251.0, 301.0, 360.0,
  ];

  private static readonly secondaryRotations = [
    18.0, 15.0, 10.0, 12.0, 15.0, 18.0, 15.0, 12.0, 12.0,
  ];
  private static readonly tertiaryRotations = [
    35.0, 30.0, 20.0, 25.0, 30.0, 35.0, 30.0, 25.0, 25.0,
  ];
}
