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

import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';

const highestSurface = (context: Context, colors: ColorApi): Color =>
  context.isDark ? colors.get('surfaceBright') : colors.get('surfaceDim');

export const tonalSpotColors: ColorsConfig = ({
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
          return 1.7;
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
          return 1.7;
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
        return 1.25;
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
        return 1.4;
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
        return 1.5;
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
        return 1.7;
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
        return 1.7;
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
        return 1.7;
      },
      adjustTone: onColor(
        () => highestSurface(c, colors),
        () => (c.isDark ? getCurve(6) : getCurve(4.5)),
      ),
    }),
    outline: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return 1.7;
      },
      adjustTone: onColor(() => highestSurface(c, colors), 3),
    }),
    outlineVariant: Color.fromPalette('neutral', {
      chromaMultiplier: () => {
        return 1.7;
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
        if (c.isDark) {
          return 80;
        } else {
          return tMaxC(palettes.get('primary'));
        }
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
        return tMaxC(palettes.get('primary'), 0, 90);
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
          ? tMinC(palettes.get('primary'), 35, 93)
          : tMaxC(palettes.get('primary'), 0, 90);
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
        return c.isDark ? 25 : 90;
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
        return c.isDark
          ? tMaxC(palettes.get('tertiary'), 0, 98)
          : tMaxC(palettes.get('tertiary'));
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
        return tMaxC(palettes.get('tertiary'), 0, 90);
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
        return tMaxC(palettes.get('tertiary'), 0, c.isDark ? 93 : 100);
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

export const tonalSpotVariant: Variant = variant({
  name: 'tonalSpot',
  palettes: {
    primary: ({ sourceColor, isDark }) => ({
      hue: sourceColor.hue,
      chroma: isDark ? 26 : 32,
    }),
    secondary: ({ sourceColor }) => ({ hue: sourceColor.hue, chroma: 16 }),
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 20, 71, 161, 333, 360],
        [-40, 48, -32, 40, -32],
      ),
      chroma: 28,
    }),
    neutral: ({ sourceColor }) => ({ hue: sourceColor.hue, chroma: 5 }),
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return { hue: errorHue, chroma: 60 };
    },
  },
  customPalettes: (_, colorHct) => ({ hue: colorHct.hue, chroma: 16 }),
  colors: tonalSpotColors,
});
