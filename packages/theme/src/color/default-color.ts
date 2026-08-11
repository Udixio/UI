import {
  applyToneDelta,
  avoidBackgroundGap,
  backgroundGapTone,
  contrastAgainst,
  contrastTone,
  onColor,
} from './tone-adjusters';
import { ColorManager } from './color.manager';
import { AddColorsOptions, ColorApi } from './color.api';
import { Color } from './color';

import { DynamicColorKey, getCurve, tMaxC, tMinC } from './color.utils';
import { Context } from '../context';

export const highestSurface = (
  context: Context,
  colorService: ColorManager | ColorApi,
): Color => {
  if (colorService instanceof ColorApi) {
    return context.isDark
      ? colorService.get('surfaceBright')
      : colorService.get('surfaceDim');
  } else {
    return context.isDark
      ? colorService.get('surfaceBright')
      : colorService.get('surfaceDim');
  }
};

export const defaultColors: AddColorsOptions = ({
  colors,
  context: c,
  palettes,
}) => {
  const getColor = (key: DynamicColorKey) => {
    return colors.get(key);
  };

  return {
    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////
    surface: {
      palette: 'neutral',
      tone: () => {
        if (c.isDark) {
          return 4;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 99;
          } else if (c.variant.name === 'vibrant') {
            return 97;
          } else {
            return 98;
          }
        }
      },
    },
    surfaceDim: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (!c.isDark) {
          if (c.variant.name === 'neutral') {
            return 2.5;
          } else if (c.variant.name === 'tonalSpot') {
            return 1.7;
          } else if (c.variant.name === 'expressive') {
            return Color.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
          } else if (c.variant.name === 'vibrant') {
            return 1.36;
          }
        }
        return 1;
      },
      tone: () => {
        if (c.isDark) {
          return 4;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 90;
          } else if (c.variant.name === 'vibrant') {
            return 85;
          } else {
            return 87;
          }
        }
      },
    },
    surfaceBright: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.isDark) {
          if (c.variant.name === 'neutral') {
            return 2.5;
          } else if (c.variant.name === 'tonalSpot') {
            return 1.7;
          } else if (c.variant.name === 'expressive') {
            return Color.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
          } else if (c.variant.name === 'vibrant') {
            return 1.36;
          }
        }
        return 1;
      },
      tone: () => {
        if (c.isDark) {
          return 18;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 99;
          } else if (c.variant.name === 'vibrant') {
            return 97;
          } else {
            return 98;
          }
        }
      },
    },
    surfaceContainerLowest: {
      palette: 'neutral',
      tone: () => (c.isDark ? 0 : 100),
    },
    surfaceContainerLow: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 1.3;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.25;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue) ? 1.3 : 1.15;
        } else if (c.variant.name === 'vibrant') {
          return 1.08;
        }
        return 1;
      },
      tone: () => {
        if (c.isDark) {
          return 6;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 98;
          } else if (c.variant.name === 'vibrant') {
            return 95;
          } else {
            return 96;
          }
        }
      },
    },
    surfaceContainer: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 1.6;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.4;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue) ? 1.6 : 1.3;
        } else if (c.variant.name === 'vibrant') {
          return 1.15;
        }
        return 1;
      },
      tone: () => {
        if (c.isDark) {
          return 9;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 96;
          } else if (c.variant.name === 'vibrant') {
            return 92;
          } else {
            return 94;
          }
        }
      },
    },
    surfaceContainerHigh: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 1.9;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.5;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue) ? 1.95 : 1.45;
        } else if (c.variant.name === 'vibrant') {
          return 1.22;
        }
        return 1;
      },
      tone: () => {
        if (c.isDark) {
          return 12;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 94;
          } else if (c.variant.name === 'vibrant') {
            return 90;
          } else {
            return 92;
          }
        }
      },
    },
    surfaceContainerHighest: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue) ? 2.3 : 1.6;
        } else if (c.variant.name === 'vibrant') {
          return 1.29;
        } else {
          // default
          return 1;
        }
      },
      tone: () => {
        if (c.isDark) {
          return 15;
        } else {
          if (Color.isYellow(palettes.get('neutral').hue)) {
            return 92;
          } else if (c.variant.name === 'vibrant') {
            return 88;
          } else {
            return 90;
          }
        }
      },
    },
    onSurface: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      tone: () => {
        if (c.variant.name === 'vibrant') {
          return tMaxC(palettes.get('neutral'), 0, 100, 1.1);
        } else {
          // For all other variants, the initial tone should be the default
          // tone, which is the same as the background color.
          return highestSurface(c, colors).tone;
        }
      },
      adjustTone: contrastAgainst(
        (api) => highestSurface(api.context, api.colors),
        (context) => (context.isDark ? getCurve(11) : getCurve(9)),
      ),
    },
    onSurfaceVariant: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }
        return 1;
      },
      adjustTone: onColor(
        (api) => highestSurface(api.context, api.colors),
        (context) => (context.isDark ? getCurve(6) : getCurve(4.5)),
      ),
    },
    outline: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }
        return 1;
      },
      adjustTone: onColor((api) => highestSurface(api.context, api.colors), 3),
    },
    outlineVariant: {
      palette: 'neutral',
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Color.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      adjustTone: onColor(
        (api) => highestSurface(api.context, api.colors),
        1.5,
      ),
    },
    inverseSurface: {
      palette: 'neutral',
      tone: () => (c.isDark ? 98 : 4),
    },
    inverseOnSurface: {
      palette: 'neutral',
      adjustTone: onColor('inverseSurface', 7),
    },
    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////
    primary: {
      palette: 'primary',
      tone: () => {
        if (c.variant.name === 'neutral') {
          return c.isDark ? 80 : 40;
        } else if (c.variant.name === 'tonalSpot') {
          if (c.isDark) {
            return 80;
          } else {
            return tMaxC(palettes.get('primary'));
          }
        } else if (c.variant.name === 'expressive') {
          return tMaxC(
            palettes.get('primary'),
            0,
            Color.isYellow(palettes.get('primary').hue)
              ? 25
              : Color.isCyan(palettes.get('primary').hue)
                ? 88
                : 98,
          );
        } else {
          return tMaxC(
            palettes.get('primary'),
            0,
            Color.isCyan(palettes.get('primary').hue) ? 88 : 98,
          );
        }
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'primaryContainer',
          delta: 5,
          polarity: 'relativeDarker',
          constraint: 'farther',
        }),
        contrastAgainst((api) => highestSurface(api.context, api.colors), 4.5),
        avoidBackgroundGap(),
      ],
    },
    primaryDim: {
      palette: 'primary',
      tone: () => {
        if (c.variant.name === 'neutral') {
          return 85;
        } else if (c.variant.name === 'tonalSpot') {
          return tMaxC(palettes.get('primary'), 0, 90);
        } else {
          return tMaxC(palettes.get('primary'));
        }
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
    },
    onPrimary: {
      palette: 'primary',
      adjustTone: onColor('primary', 6),
    },
    primaryContainer: {
      palette: 'primary',
      tone: () => {
        if (c.variant.name === 'neutral') {
          return c.isDark ? 30 : 90;
        } else if (c.variant.name === 'tonalSpot') {
          return c.isDark
            ? tMinC(palettes.get('primary'), 35, 93)
            : tMaxC(palettes.get('primary'), 0, 90);
        } else if (c.variant.name === 'expressive') {
          return c.isDark
            ? tMaxC(palettes.get('primary'), 30, 93)
            : tMaxC(
                palettes.get('primary'),
                78,
                Color.isCyan(palettes.get('primary').hue) ? 88 : 90,
              );
        }
        // VIBRANT
        return c.isDark
          ? tMinC(palettes.get('primary'), 66, 93)
          : tMaxC(
              palettes.get('primary'),
              66,
              Color.isCyan(palettes.get('primary').hue) ? 88 : 93,
            );
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                (api) => highestSurface(api.context, api.colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    },
    onPrimaryContainer: {
      palette: 'primary',
      adjustTone: onColor('primaryContainer', 6),
    },

    primaryFixed: {
      palette: 'primary',

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
                (api) => highestSurface(api.context, api.colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    },

    primaryFixedDim: {
      palette: 'primary',

      tone: () => colors.get('primaryFixed').tone,

      adjustTone: applyToneDelta({
        relativeTo: 'primaryFixed',
        delta: 5,
        polarity: 'darker',
        constraint: 'exact',
      }),
    },

    onPrimaryFixed: {
      palette: 'primary',

      adjustTone: onColor('primaryFixedDim', 7),
    },

    onPrimaryFixedVariant: {
      palette: 'primary',

      adjustTone: onColor('primaryFixedDim', 4.5),
    },

    inversePrimary: {
      palette: 'primary',

      tone: () => tMaxC(palettes.get('primary')),

      adjustTone: contrastAgainst('inverseSurface', 6),
    },
    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////
    secondary: {
      palette: 'secondary',
      tone: () => {
        if (c.variant.name === 'neutral') {
          return c.isDark
            ? tMinC(palettes.get('secondary'), 0, 98)
            : tMaxC(palettes.get('secondary'));
        } else if (c.variant.name === 'vibrant') {
          return tMaxC(palettes.get('secondary'), 0, c.isDark ? 90 : 98);
        } else {
          // EXPRESSIVE and TONAL_SPOT
          return c.isDark ? 80 : tMaxC(palettes.get('secondary'));
        }
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'secondaryContainer',
          delta: 5,
          polarity: 'relativeDarker',
          constraint: 'farther',
        }),
        contrastAgainst((api) => highestSurface(api.context, api.colors), 4.5),
        avoidBackgroundGap(),
      ],
    },
    secondaryDim: {
      palette: 'secondary',
      tone: () => {
        if (c.variant.name === 'neutral') {
          return 85;
        } else {
          return tMaxC(palettes.get('secondary'), 0, 90);
        }
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
    },
    onSecondary: {
      palette: 'secondary',
      adjustTone: onColor('secondary', 6),
    },
    secondaryContainer: {
      palette: 'secondary',
      tone: () => {
        if (c.variant.name === 'vibrant') {
          return c.isDark
            ? tMinC(palettes.get('secondary'), 30, 40)
            : tMaxC(palettes.get('secondary'), 84, 90);
        } else if (c.variant.name === 'expressive') {
          return c.isDark ? 15 : tMaxC(palettes.get('secondary'), 90, 95);
        } else {
          return c.isDark ? 25 : 90;
        }
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                (api) => highestSurface(api.context, api.colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    },
    onSecondaryContainer: {
      palette: 'secondary',
      adjustTone: onColor('secondaryContainer', 6),
    },

    secondaryFixed: {
      palette: 'secondary',

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
                (api) => highestSurface(api.context, api.colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    },

    secondaryFixedDim: {
      palette: 'secondary',

      tone: () => getColor('secondaryFixed').tone,

      adjustTone: applyToneDelta({
        relativeTo: 'secondaryFixed',
        delta: 5,
        polarity: 'darker',
        constraint: 'exact',
      }),
    },

    onSecondaryFixed: {
      palette: 'secondary',

      adjustTone: onColor('secondaryFixedDim', 7),
    },

    onSecondaryFixedVariant: {
      palette: 'secondary',

      adjustTone: onColor('secondaryFixedDim', 4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////
    tertiary: {
      palette: 'tertiary',
      tone: () => {
        if (c.variant.name === 'expressive' || c.variant.name === 'vibrant') {
          return tMaxC(
            palettes.get('tertiary'),
            0,
            Color.isCyan(palettes.get('tertiary').hue)
              ? 88
              : c.isDark
                ? 98
                : 100,
          );
        } else {
          // NEUTRAL and TONAL_SPOT
          return c.isDark
            ? tMaxC(palettes.get('tertiary'), 0, 98)
            : tMaxC(palettes.get('tertiary'));
        }
      },
      adjustTone: [
        applyToneDelta({
          relativeTo: 'tertiaryContainer',
          delta: 5,
          polarity: 'relativeDarker',
          constraint: 'farther',
        }),
        contrastAgainst((api) => highestSurface(api.context, api.colors), 4.5),
        avoidBackgroundGap(),
      ],
    },
    tertiaryDim: {
      palette: 'tertiary',
      tone: () => {
        if (c.variant.name === 'tonalSpot') {
          return tMaxC(palettes.get('tertiary'), 0, 90);
        } else {
          return tMaxC(palettes.get('tertiary'));
        }
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
    },
    onTertiary: {
      palette: 'tertiary',
      adjustTone: onColor('tertiary', 6),
    },
    tertiaryContainer: {
      palette: 'tertiary',
      tone: () => {
        if (c.variant.name === 'neutral') {
          return c.isDark
            ? tMaxC(palettes.get('tertiary'), 0, 93)
            : tMaxC(palettes.get('tertiary'), 0, 96);
        } else if (c.variant.name === 'tonalSpot') {
          return tMaxC(palettes.get('tertiary'), 0, c.isDark ? 93 : 100);
        } else if (c.variant.name === 'expressive') {
          return tMaxC(
            palettes.get('tertiary'),
            75,
            Color.isCyan(palettes.get('tertiary').hue)
              ? 88
              : c.isDark
                ? 93
                : 100,
          );
        } else {
          // VIBRANT
          return c.isDark
            ? tMaxC(palettes.get('tertiary'), 0, 93)
            : tMaxC(palettes.get('tertiary'), 72, 100);
        }
      },
      adjustTone: (args) =>
        // La courbe ne vaut rien en contraste nul ou négatif ; sans passe de
        // contraste, un fond n'est pas écarté de la zone médiane non plus.
        args.context.contrastLevel > 0
          ? backgroundGapTone(
              contrastTone(
                args.tone,
                (api) => highestSurface(api.context, api.colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    },
    onTertiaryContainer: {
      palette: 'tertiary',
      adjustTone: onColor('tertiaryContainer', 6),
    },

    tertiaryFixed: {
      palette: 'tertiary',

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
                (api) => highestSurface(api.context, api.colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    },

    tertiaryFixedDim: {
      palette: 'tertiary',

      tone: () => getColor('tertiaryFixed').tone,

      adjustTone: applyToneDelta({
        relativeTo: 'tertiaryFixed',
        delta: 5,
        polarity: 'darker',
        constraint: 'exact',
      }),
    },

    onTertiaryFixed: {
      palette: 'tertiary',

      adjustTone: onColor('tertiaryFixedDim', 7),
    },

    onTertiaryFixedVariant: {
      palette: 'tertiary',

      adjustTone: onColor('tertiaryFixedDim', 4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////

    error: {
      palette: 'error',

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

        contrastAgainst((api) => highestSurface(api.context, api.colors), 4.5),

        avoidBackgroundGap(),
      ],
    },
    errorDim: {
      palette: 'error',
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
    },
    onError: {
      palette: 'error',
      adjustTone: onColor('error', 6),
    },
    errorContainer: {
      palette: 'error',
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
                (api) => highestSurface(api.context, api.colors),
                1.5,
                args,
              ),
            )
          : args.tone,
    },
    onErrorContainer: {
      palette: 'error',
      adjustTone: onColor('errorContainer', 4.5),
    },

    /////////////////////////////////////////////////////////////////
    // Remapped Colors                                             //
    /////////////////////////////////////////////////////////////////
    surfaceVariant: {
      alias: 'surfaceContainerHighest',
    },
    surfaceTint: {
      alias: 'primary',
    },
    background: {
      alias: 'surface',
    },
    onBackground: {
      alias: 'onSurface',
    },
  };
};
