import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../../material-color-utilities/htc';

const getVibrantNeutralHue = (sourceColor: Hct): number => {
  return getRotatedHue(
    sourceColor,
    [0, 38, 105, 140, 333, 360],
    [-14, 10, -14, 10, -14],
  );
};

const getVibrantNeutralChroma = (sourceColor: Hct): number => {
  return 28;
};

export const vibrantVariant: Variant = variant({
  name: 'vibrant',
  palettes: {
    primary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(sourceColor.hue, 74),
    secondary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColor,
          [0, 38, 105, 140, 333, 360],
          [-14, 10, -14, 10, -14],
        ),
        56,
      ),
    tertiary: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColor,
          [0, 38, 71, 105, 140, 161, 253, 333, 360],
          [-72, 35, 24, -24, 62, 50, 62, -72],
        ),
        56,
      ),
    neutral: ({ sourceColor }) =>
      TonalPalette.fromHueAndChroma(
        getVibrantNeutralHue(sourceColor),
        getVibrantNeutralChroma(sourceColor),
      ),
    neutralVariant: ({ sourceColor }) => {
      const vibrantNeutralHue = getVibrantNeutralHue(sourceColor);
      const vibrantNeutralChroma = getVibrantNeutralChroma(sourceColor);
      return TonalPalette.fromHueAndChroma(
        vibrantNeutralHue,
        vibrantNeutralChroma * 1.29,
      );
    },
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 80);
    },
  },
  customPalettes: (_, colorHct) =>
    TonalPalette.fromHueAndChroma(
      getRotatedHue(
        colorHct,
        [0, 38, 105, 140, 333, 360],
        [-14, 10, -14, 10, -14],
      ),
      56,
    ),
});
