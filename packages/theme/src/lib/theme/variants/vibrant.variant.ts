import { getPiecewiseHue, getRotatedHue, Variant } from '../variant';
import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../../material-color-utilities/htc';

const getVibrantNeutralHue = (sourceColorHct: Hct): number => {
  return getRotatedHue(
    sourceColorHct,
    [0, 38, 105, 140, 333, 360],
    [-14, 10, -14, 10, -14],
  );
};

const getVibrantNeutralChroma = (sourceColorHct: Hct): number => {
  const neutralHue = getVibrantNeutralHue(sourceColorHct);
  return 28;
};

export const vibrantVariant: Variant = {
  palettes: {
    primary: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(sourceColorHct.hue, 74),
    secondary: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColorHct,
          [0, 38, 105, 140, 333, 360],
          [-14, 10, -14, 10, -14],
        ),
        56,
      ),
    tertiary: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(
        getRotatedHue(
          sourceColorHct,
          [0, 38, 71, 105, 140, 161, 253, 333, 360],
          [-72, 35, 24, -24, 62, 50, 62, -72],
        ),
        56,
      ),
    neutral: ({ sourceColorHct }) =>
      TonalPalette.fromHueAndChroma(
        getVibrantNeutralHue(sourceColorHct),
        getVibrantNeutralChroma(sourceColorHct),
      ),
    neutralVariant: ({ sourceColorHct }) => {
      const vibrantNeutralHue = getVibrantNeutralHue(sourceColorHct);
      const vibrantNeutralChroma = getVibrantNeutralChroma(sourceColorHct);
      return TonalPalette.fromHueAndChroma(
        vibrantNeutralHue,
        vibrantNeutralChroma * 1.29,
      );
    },
    error: ({ sourceColorHct }) => {
      const errorHue = getPiecewiseHue(
        sourceColorHct,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return TonalPalette.fromHueAndChroma(errorHue, 80);
    },
  },
  customPalettes: ({ colorHct }) =>
    TonalPalette.fromHueAndChroma(
      getRotatedHue(
        colorHct,
        [0, 38, 105, 140, 333, 360],
        [-14, 10, -14, 10, -14],
      ),
      56,
    ),

  colors: {
    surface: {
      tone: (s) => {
        if (s.isDark) {
          return 4;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 99;
          } else {
            return 97;
          }
        }
      },
      surfaceDim: {
        tone: (s) => {
          if (s.isDark) {
            return 4;
          } else {
            if (Hct.isYellow(s.getPalette('neutral').hue)) {
              return 90;
            } else {
              return 85;
            }
          }
        },
        chromaMultiplier: (s) => {
          if (!s.isDark) {
            return 1.36;
          }
          return 1;
        },
      },
      surfaceBright: {
        tone: (s) => {
          if (s.isDark) {
            return 18;
          } else {
            if (Hct.isYellow(s.neutralPalette.hue)) {
              return 99;
            } else {
              return 97;
            }
          }
        },
        chromaMultiplier: (s) => {
          if (s.isDark) {
            return 1.36;
          }
          return 1;
        },
      },
    },
  },
};
