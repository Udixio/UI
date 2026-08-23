import {
  applyToneDelta,
  avoidBackgroundGap,
  backgroundGapTone,
  contrastAgainst,
  contrastTone,
  onColor,
} from '../../color/tone-adjusters';
import { Color } from '../../color/color.base';
import type { ColorApi } from '../../color/color.api';
import type { ColorsConfig } from '../../color/color.types';
import {
  DynamicColorKey,
  getCurve,
  tMaxC,
  tMinC,
} from '../../color/color.utils';
import type { Context } from '../../context';

import { getPiecewiseHue, getRotatedHue, variant } from '../variant';

const getExpressiveNeutralHue = (sourceColor: Color): number => {
  const hue = getRotatedHue(
    sourceColor,
    [0, 71, 124, 253, 278, 300, 360],
    [10, 0, 10, 0, 10, 0],
  );
  return hue;
};
const getExpressiveNeutralChroma = (
  sourceColor: Color,
  isDark: boolean,
): number => {
  const neutralHue = getExpressiveNeutralHue(sourceColor);
  return isDark ? (Color.isYellow(neutralHue) ? 6 : 14) : 18;
};

const highestSurface = (context: Context, colors: ColorApi): Color =>
  context.isDark ? colors.get('surfaceBright') : colors.get('surfaceDim');

export const expressiveColors: ColorsConfig = ({
  colors,
  context: c,
  palettes,
}) => {
  const getColor = (key: DynamicColorKey) => colors.get(key);

  return {
    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////
    surface: Color.fromPalette('neutral', {
      tone: () => {
        if (c.isDark) {
          return 4;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 99;
          } else {
            return 98;
          }
        }
      },
    }),
    surfaceDim: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        if (!c.isDark) {
          return Color.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
        }
        return 1;
      },
      tone: () => {
        if (c.isDark) {
          return 4;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 90;
          } else {
            return 87;
          }
        }
      },
    }),
    surfaceBright: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        if (c.isDark) {
          return Color.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
        }
        return 1;
      },
      tone: () => {
        if (c.isDark) {
          return 18;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 99;
          } else {
            return 98;
          }
        }
      },
    }),
    surfaceContainerLowest: Color.fromPalette('neutral', {
      tone: () => (c.isDark ? 0 : 100),
    }),
    surfaceContainerLow: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue) ? 1.3 : 1.15;
      },
      tone: () => {
        if (c.isDark) {
          return 6;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 98;
          } else {
            return 96;
          }
        }
      },
    }),
    surfaceContainer: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue) ? 1.6 : 1.3;
      },
      tone: () => {
        if (c.isDark) {
          return 9;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 96;
          } else {
            return 94;
          }
        }
      },
    }),
    surfaceContainerHigh: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue) ? 1.95 : 1.45;
      },
      tone: () => {
        if (c.isDark) {
          return 12;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 94;
          } else {
            return 92;
          }
        }
      },
    }),
    surfaceContainerHighest: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue) ? 2.3 : 1.6;
      },
      tone: () => {
        if (c.isDark) {
          return 15;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 92;
          } else {
            return 90;
          }
        }
      },
    }),
    onSurface: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue)
          ? c.isDark
            ? 3.0
            : 2.3
          : 1.6;
      },
      tone: () => {
        // For all other variants, the initial tone should be the default
        // tone, which is the same as the background color.
        return highestSurface(c, colors).tone;
      },
      adjustTone: contrastAgainst(
        () => highestSurface(c, colors),
        () => (c.isDark ? getCurve(11) : getCurve(9)),
      ),
    }),
    onSurfaceVariant: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue)
          ? c.isDark
            ? 3.0
            : 2.3
          : 1.6;
      },
      adjustTone: onColor(
        () => highestSurface(c, colors),
        () => (c.isDark ? getCurve(6) : getCurve(4.5)),
      ),
    }),
    outline: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue)
          ? c.isDark
            ? 3.0
            : 2.3
          : 1.6;
      },
      adjustTone: onColor(() => highestSurface(c, colors), 3),
    }),
    outlineVariant: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return Color.isYellow(palettes.get('neutral').hue)
          ? c.isDark
            ? 3.0
            : 2.3
          : 1.6;
      },
      adjustTone: onColor(() => highestSurface(c, colors), 1.5),
    }),
    inverseSurface: Color.fromPalette('neutral', {
      tone: () => (c.isDark ? 98 : 4),
    }),
    inverseOnSurface: Color.fromPalette('neutral', {
      adjustTone: onColor('inverseSurface', 7),
    }),
    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////
    primary: Color.fromPalette('primary', {
      tone: () => {
        return tMaxC(
          palettes.get('primary'),
          0,
          Color.isYellow(palettes.get('primary').hue)
            ? 25
            : Color.isCyan(palettes.get('primary').hue)
              ? 88
              : 98,
        );
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'primaryContainer',
          delta: 5,
          polarity: 'relativeDarker',
          constraint: 'farther',
        }),
        contrastAgainst(() => highestSurface(c, colors), 4.5),
        avoidBackgroundGap(),
      ],
    }),
    primaryDim: Color.fromPalette('primary', {
      tone: () => {
        return tMaxC(palettes.get('primary'));
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'primary',
          delta: 5,
          polarity: 'darker',
          constraint: 'farther',
        }),
        contrastAgainst('surfaceContainerHigh', 4.5),
        avoidBackgroundGap(),
      ],
    }),
    onPrimary: Color.fromPalette('primary', {
      adjustTone: onColor('primary', 6),
    }),
    primaryContainer: Color.fromPalette('primary', {
      tone: () => {
        return c.isDark
          ? tMaxC(palettes.get('primary'), 30, 93)
          : tMaxC(
              palettes.get('primary'),
              78,
              Color.isCyan(palettes.get('primary').hue) ? 88 : 90,
            );
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                () => highestSurface(c, colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    }),
    onPrimaryContainer: Color.fromPalette('primary', {
      adjustTone: onColor('primaryContainer', 6),
    }),
    primaryFixed: Color.fromPalette('primary', {
      tone: () => {
        return c.temp(
          {
            isDark: false,
            contrastLevel: 0,
          },
          () => {
            const color = getColor('primaryContainer');
            return color.tone;
          },
        );
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                () => highestSurface(c, colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    }),
    primaryFixedDim: Color.fromPalette('primary', {
      tone: () => colors.get('primaryFixed').tone,
      adjustTone: applyToneDelta({
        relativeTo: 'primaryFixed',
        delta: 5,
        polarity: 'darker',
        constraint: 'exact',
      }),
    }),
    onPrimaryFixed: Color.fromPalette('primary', {
      adjustTone: onColor('primaryFixedDim', 7),
    }),
    onPrimaryFixedVariant: Color.fromPalette('primary', {
      adjustTone: onColor('primaryFixedDim', 4.5),
    }),
    inversePrimary: Color.fromPalette('primary', {
      tone: () => tMaxC(palettes.get('primary')),
      adjustTone: contrastAgainst('inverseSurface', 6),
    }),
    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////
    secondary: Color.fromPalette('secondary', {
      tone: () => {
        return c.isDark ? 80 : tMaxC(palettes.get('secondary'));
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'secondaryContainer',
          delta: 5,
          polarity: 'relativeDarker',
          constraint: 'farther',
        }),
        contrastAgainst(() => highestSurface(c, colors), 4.5),
        avoidBackgroundGap(),
      ],
    }),
    secondaryDim: Color.fromPalette('secondary', {
      tone: () => {
        return tMaxC(palettes.get('secondary'), 0, 90);
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'secondary',
          delta: 5,
          polarity: 'darker',
          constraint: 'farther',
        }),
        contrastAgainst('surfaceContainerHigh', 4.5),
        avoidBackgroundGap(),
      ],
    }),
    onSecondary: Color.fromPalette('secondary', {
      adjustTone: onColor('secondary', 6),
    }),
    secondaryContainer: Color.fromPalette('secondary', {
      tone: () => {
        return c.isDark ? 15 : tMaxC(palettes.get('secondary'), 90, 95);
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                () => highestSurface(c, colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    }),
    onSecondaryContainer: Color.fromPalette('secondary', {
      adjustTone: onColor('secondaryContainer', 6),
    }),
    secondaryFixed: Color.fromPalette('secondary', {
      tone: () => {
        return c.temp(
          {
            isDark: false,
            contrastLevel: 0,
          },
          () => {
            const color = getColor('secondaryContainer');
            return color.tone;
          },
        );
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                () => highestSurface(c, colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    }),
    secondaryFixedDim: Color.fromPalette('secondary', {
      tone: () => getColor('secondaryFixed').tone,
      adjustTone: applyToneDelta({
        relativeTo: 'secondaryFixed',
        delta: 5,
        polarity: 'darker',
        constraint: 'exact',
      }),
    }),
    onSecondaryFixed: Color.fromPalette('secondary', {
      adjustTone: onColor('secondaryFixedDim', 7),
    }),
    onSecondaryFixedVariant: Color.fromPalette('secondary', {
      adjustTone: onColor('secondaryFixedDim', 4.5),
    }),
    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////
    tertiary: Color.fromPalette('tertiary', {
      tone: () => {
        return tMaxC(
          palettes.get('tertiary'),
          0,
          Color.isCyan(palettes.get('tertiary').hue) ? 88 : c.isDark ? 98 : 100,
        );
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'tertiaryContainer',
          delta: 5,
          polarity: 'relativeDarker',
          constraint: 'farther',
        }),
        contrastAgainst(() => highestSurface(c, colors), 4.5),
        avoidBackgroundGap(),
      ],
    }),
    tertiaryDim: Color.fromPalette('tertiary', {
      tone: () => {
        return tMaxC(palettes.get('tertiary'));
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'tertiary',
          delta: 5,
          polarity: 'darker',
          constraint: 'farther',
        }),
        contrastAgainst('surfaceContainerHigh', 4.5),
        avoidBackgroundGap(),
      ],
    }),
    onTertiary: Color.fromPalette('tertiary', {
      adjustTone: onColor('tertiary', 6),
    }),
    tertiaryContainer: Color.fromPalette('tertiary', {
      tone: () => {
        return tMaxC(
          palettes.get('tertiary'),
          75,
          Color.isCyan(palettes.get('tertiary').hue) ? 88 : c.isDark ? 93 : 100,
        );
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                () => highestSurface(c, colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    }),
    onTertiaryContainer: Color.fromPalette('tertiary', {
      adjustTone: onColor('tertiaryContainer', 6),
    }),
    tertiaryFixed: Color.fromPalette('tertiary', {
      tone: () => {
        return c.temp(
          {
            isDark: false,
            contrastLevel: 0,
          },
          () => {
            const color = getColor('tertiaryContainer');
            return color.tone;
          },
        );
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                () => highestSurface(c, colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    }),
    tertiaryFixedDim: Color.fromPalette('tertiary', {
      tone: () => getColor('tertiaryFixed').tone,
      adjustTone: applyToneDelta({
        relativeTo: 'tertiaryFixed',
        delta: 5,
        polarity: 'darker',
        constraint: 'exact',
      }),
    }),
    onTertiaryFixed: Color.fromPalette('tertiary', {
      adjustTone: onColor('tertiaryFixedDim', 7),
    }),
    onTertiaryFixedVariant: Color.fromPalette('tertiary', {
      adjustTone: onColor('tertiaryFixedDim', 4.5),
    }),
    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////
    error: Color.fromPalette('error', {
      tone: () => {
        return c.isDark
          ? tMinC(palettes.get('error'), 0, 98)
          : tMaxC(palettes.get('error'));
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'errorContainer',
          delta: 5,
          polarity: 'relativeDarker',
          constraint: 'farther',
        }),
        contrastAgainst(() => highestSurface(c, colors), 4.5),
        avoidBackgroundGap(),
      ],
    }),
    errorDim: Color.fromPalette('error', {
      tone: () => tMinC(palettes.get('error')),
      adjustTone: [
        applyToneDelta({
          relativeTo: 'error',
          delta: 5,
          polarity: 'darker',
          constraint: 'farther',
        }),
        contrastAgainst('surfaceContainerHigh', 4.5),
        avoidBackgroundGap(),
      ],
    }),
    onError: Color.fromPalette('error', {
      adjustTone: onColor('error', 6),
    }),
    errorContainer: Color.fromPalette('error', {
      tone: () => {
        return c.isDark
          ? tMinC(palettes.get('error'), 30, 93)
          : tMaxC(palettes.get('error'), 0, 90);
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                () => highestSurface(c, colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    }),
    onErrorContainer: Color.fromPalette('error', {
      adjustTone: onColor('errorContainer', 4.5),
    }),
    /////////////////////////////////////////////////////////////////
    // Remapped Colors                                             //
    /////////////////////////////////////////////////////////////////
    surfaceVariant: Color.alias('surfaceContainerHighest'),
    surfaceTint: Color.alias('primary'),
    background: Color.alias('surface'),
    onBackground: Color.alias('onSurface'),
  };
};

export const expressiveVariant = variant({
  name: 'expressive',
  palettes: {
    primary: ({ sourceColor, isDark }) => ({
      hue: sourceColor.hue,
      chroma: isDark ? 36 : 48,
    }),
    secondary: ({ sourceColor, isDark }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 105, 140, 204, 253, 278, 300, 333, 360],
        [-160, 155, -100, 96, -96, -156, -165, -160],
      ),

      chroma: isDark ? 16 : 24,
    }),
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 105, 140, 204, 253, 278, 300, 333, 360],
        [-165, 160, -105, 101, -101, -160, -170, -165],
      ),
      chroma: 48,
    }),
    neutral: ({ sourceColor, isDark }) => ({
      hue: getExpressiveNeutralHue(sourceColor),
      chroma: getExpressiveNeutralChroma(sourceColor, isDark),
    }),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return { hue: errorHue, chroma: 64 };
    },
  },
  customPalettes: ({ isDark }, color) => ({
    hue: getRotatedHue(
      color,
      [0, 105, 140, 204, 253, 278, 300, 333, 360],
      [-160, 155, -100, 96, -96, -156, -165, -160],
    ),
    chroma: isDark ? 16 : 24,
  }),
  colors: expressiveColors,
});
