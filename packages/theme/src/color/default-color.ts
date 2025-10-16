import { toneDeltaPair } from '../material-color-utilities';
import { highestSurface } from './color.manager';
import { AddColorsOptions } from './color.api';
import { Hct } from '../material-color-utilities/htc';
import { getInitialToneFromBackground } from './color';

import { DynamicColorKey, getCurve, tMaxC, tMinC } from './color.utils';

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
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.isDark) {
          return 4;
        } else {
          if (Hct.isYellow(palettes.get('neutral').hue)) {
            return 99;
          } else if (c.variant.name === 'vibrant') {
            return 97;
          } else {
            return 98;
          }
        }
      },
      isBackground: true,
    },
    surfaceDim: {
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.isDark) {
          return 4;
        } else {
          if (Hct.isYellow(palettes.get('neutral').hue)) {
            return 90;
          } else if (c.variant.name === 'vibrant') {
            return 85;
          } else {
            return 87;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (!c.isDark) {
          if (c.variant.name === 'neutral') {
            return 2.5;
          } else if (c.variant.name === 'tonalSpot') {
            return 1.7;
          } else if (c.variant.name === 'expressive') {
            return Hct.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
          } else if (c.variant.name === 'vibrant') {
            return 1.36;
          }
        }
        return 1;
      },
    },
    surfaceBright: {
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.isDark) {
          return 18;
        } else {
          if (Hct.isYellow(palettes.get('neutral').hue)) {
            return 99;
          } else if (c.variant.name === 'vibrant') {
            return 97;
          } else {
            return 98;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (c.isDark) {
          if (c.variant.name === 'neutral') {
            return 2.5;
          } else if (c.variant.name === 'tonalSpot') {
            return 1.7;
          } else if (c.variant.name === 'expressive') {
            return Hct.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
          } else if (c.variant.name === 'vibrant') {
            return 1.36;
          }
        }
        return 1;
      },
    },
    surfaceContainerLowest: {
      palette: () => palettes.get('neutral'),
      tone: () => (c.isDark ? 0 : 100),
      isBackground: true,
    },
    surfaceContainerLow: {
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.isDark) {
          return 6;
        } else {
          if (Hct.isYellow(palettes.get('neutral').hue)) {
            return 98;
          } else if (c.variant.name === 'vibrant') {
            return 95;
          } else {
            return 96;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 1.3;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.25;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue) ? 1.3 : 1.15;
        } else if (c.variant.name === 'vibrant') {
          return 1.08;
        }
        return 1;
      },
    },
    surfaceContainer: {
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.isDark) {
          return 9;
        } else {
          if (Hct.isYellow(palettes.get('neutral').hue)) {
            return 96;
          } else if (c.variant.name === 'vibrant') {
            return 92;
          } else {
            return 94;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 1.6;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.4;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue) ? 1.6 : 1.3;
        } else if (c.variant.name === 'vibrant') {
          return 1.15;
        }
        return 1;
      },
    },
    surfaceContainerHigh: {
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.isDark) {
          return 12;
        } else {
          if (Hct.isYellow(palettes.get('neutral').hue)) {
            return 94;
          } else if (c.variant.name === 'vibrant') {
            return 90;
          } else {
            return 92;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 1.9;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.5;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue) ? 1.95 : 1.45;
        } else if (c.variant.name === 'vibrant') {
          return 1.22;
        }
        return 1;
      },
    },
    surfaceContainerHighest: {
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.isDark) {
          return 15;
        } else {
          if (Hct.isYellow(palettes.get('neutral').hue)) {
            return 92;
          } else if (c.variant.name === 'vibrant') {
            return 88;
          } else {
            return 90;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue) ? 2.3 : 1.6;
        } else if (c.variant.name === 'vibrant') {
          return 1.29;
        } else {
          // default
          return 1;
        }
      },
    },
    onSurface: {
      palette: () => palettes.get('neutral'),
      tone: () => {
        if (c.variant.name === 'vibrant') {
          return tMaxC(palettes.get('neutral'), 0, 100, 1.1);
        } else {
          // For all other variants, the initial tone should be the default
          // tone, which is the same as the background color.
          return getInitialToneFromBackground(highestSurface(c, colors));
        }
      },
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      background: () => highestSurface(c, colors),
      contrastCurve: () => (c.isDark ? getCurve(11) : getCurve(9)),
    },
    onSurfaceVariant: {
      palette: () => palettes.get('neutralVariant'),
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }
        return 1;
      },
      background: () => highestSurface(c, colors),
      contrastCurve: () => (c.isDark ? getCurve(6) : getCurve(4.5)),
    },
    outline: {
      palette: () => palettes.get('neutralVariant'),
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }
        return 1;
      },
      background: () => highestSurface(c, colors),
      contrastCurve: () => getCurve(3),
    },
    outlineVariant: {
      palette: () => palettes.get('neutralVariant'),
      chromaMultiplier: () => {
        if (c.variant.name === 'neutral') {
          return 2.2;
        } else if (c.variant.name === 'tonalSpot') {
          return 1.7;
        } else if (c.variant.name === 'expressive') {
          return Hct.isYellow(palettes.get('neutral').hue)
            ? c.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      background: () => highestSurface(c, colors),
      contrastCurve: () => getCurve(1.5),
    },
    inverseSurface: {
      palette: () => palettes.get('neutral'),
      tone: () => (c.isDark ? 98 : 4),
      isBackground: true,
    },
    inverseOnSurface: {
      palette: () => palettes.get('neutral'),
      tone: () => (c.isDark ? 20 : 95),
      background: () => colors.get('inverseSurface'),
      contrastCurve: () => getCurve(7),
    },
    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////
    primary: {
      palette: () => palettes.get('primary'),
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
            Hct.isYellow(palettes.get('primary').hue)
              ? 25
              : Hct.isCyan(palettes.get('primary').hue)
                ? 88
                : 98,
          );
        } else {
          return tMaxC(
            palettes.get('primary'),
            0,
            Hct.isCyan(palettes.get('primary').hue) ? 88 : 98,
          );
        }
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          colors.get('primaryContainer'),
          colors.get('primary'),
          5,
          'relative_lighter',
          true,
          'farther',
        ),
    },
    primaryDim: {
      palette: () => palettes.get('primary'),
      tone: () => {
        if (c.variant.name === 'neutral') {
          return 85;
        } else if (c.variant.name === 'tonalSpot') {
          return tMaxC(palettes.get('primary'), 0, 90);
        } else {
          return tMaxC(palettes.get('primary'));
        }
      },
      isBackground: true,
      background: () => getColor('surfaceContainerHigh'),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          colors.get('primaryDim'),
          colors.get('primary'),
          5,
          'darker',
          true,
          'farther',
        ),
    },
    onPrimary: {
      palette: () => palettes.get('primary'),
      background: () => colors.get('primary'),
      contrastCurve: () => getCurve(6),
    },
    primaryContainer: {
      palette: () => palettes.get('primary'),
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
                Hct.isCyan(palettes.get('primary').hue) ? 88 : 90,
              );
        }
        // VIBRANT
        return c.isDark
          ? tMinC(palettes.get('primary'), 66, 93)
          : tMaxC(
              palettes.get('primary'),
              66,
              Hct.isCyan(palettes.get('primary').hue) ? 88 : 93,
            );
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onPrimaryContainer: {
      palette: () => palettes.get('primary'),
      background: () => colors.get('primaryContainer'),
      contrastCurve: () => getCurve(6),
    },

    primaryFixed: {
      palette: () => palettes.get('primary'),
      tone: () => {
        return c.temp(
          {
            isDark: false,
            contrastLevel: 0,
          },
          () => {
            const color = getColor('primaryContainer');
            return color.getTone();
          },
        );
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    primaryFixedDim: {
      palette: () => palettes.get('primary'),
      tone: () => colors.get('primaryFixed').getTone(),
      isBackground: true,
      adjustTone: () =>
        toneDeltaPair(
          getColor('primaryFixedDim'),
          getColor('primaryFixed'),
          5,
          'darker',
          true,
          'exact',
        ),
    },

    onPrimaryFixed: {
      palette: () => palettes.get('primary'),
      background: () => colors.get('primaryFixedDim'),
      contrastCurve: () => getCurve(7),
    },

    onPrimaryFixedVariant: {
      palette: () => palettes.get('primary'),
      background: () => colors.get('primaryFixedDim'),
      contrastCurve: () => getCurve(4.5),
    },

    inversePrimary: {
      palette: () => palettes.get('primary'),
      tone: () => tMaxC(palettes.get('primary')),
      background: () => colors.get('inverseSurface'),
      contrastCurve: () => getCurve(6),
    },
    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////
    secondary: {
      palette: () => palettes.get('secondary'),
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
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          getColor('secondaryContainer'),
          getColor('secondary'),
          5,
          'relative_lighter',
          true,
          'farther',
        ),
    },
    secondaryDim: {
      palette: () => palettes.get('secondary'),
      tone: () => {
        if (c.variant.name === 'neutral') {
          return 85;
        } else {
          return tMaxC(palettes.get('secondary'), 0, 90);
        }
      },
      isBackground: true,
      background: () => getColor('surfaceContainerHigh'),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          getColor('secondaryDim'),
          getColor('secondary'),
          5,
          'darker',
          true,
          'farther',
        ),
    },
    onSecondary: {
      palette: () => palettes.get('secondary'),
      background: () => getColor('secondary'),
      contrastCurve: () => getCurve(6),
    },
    secondaryContainer: {
      palette: () => palettes.get('secondary'),
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
      isBackground: true,
      background: () => highestSurface(c, colors),
      adjustTone: () => undefined,
      contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onSecondaryContainer: {
      palette: () => palettes.get('secondary'),
      background: () => getColor('secondaryContainer'),
      contrastCurve: () => getCurve(6),
    },

    secondaryFixed: {
      palette: () => palettes.get('secondary'),
      tone: () => {
        return c.temp(
          {
            isDark: false,
            contrastLevel: 0,
          },
          () => {
            const color = getColor('secondaryContainer');
            return color.getTone();
          },
        );
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    secondaryFixedDim: {
      palette: () => palettes.get('secondary'),
      tone: () => getColor('secondaryFixed').getTone(),
      isBackground: true,
      adjustTone: () =>
        toneDeltaPair(
          getColor('secondaryFixedDim'),
          getColor('secondaryFixed'),
          5,
          'darker',
          true,
          'exact',
        ),
    },

    onSecondaryFixed: {
      palette: () => palettes.get('secondary'),
      background: () => getColor('secondaryFixedDim'),
      contrastCurve: () => getCurve(7),
    },

    onSecondaryFixedVariant: {
      palette: () => palettes.get('secondary'),
      background: () => getColor('secondaryFixedDim'),
      contrastCurve: () => getCurve(4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////
    tertiary: {
      palette: () => palettes.get('tertiary'),
      tone: () => {
        if (c.variant.name === 'expressive' || c.variant.name === 'vibrant') {
          return tMaxC(
            palettes.get('tertiary'),
            0,
            Hct.isCyan(palettes.get('tertiary').hue) ? 88 : c.isDark ? 98 : 100,
          );
        } else {
          // NEUTRAL and TONAL_SPOT
          return c.isDark
            ? tMaxC(palettes.get('tertiary'), 0, 98)
            : tMaxC(palettes.get('tertiary'));
        }
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          getColor('tertiaryContainer'),
          getColor('tertiary'),
          5,
          'relative_lighter',
          true,
          'farther',
        ),
    },
    tertiaryDim: {
      palette: () => palettes.get('tertiary'),
      tone: () => {
        if (c.variant.name === 'tonalSpot') {
          return tMaxC(palettes.get('tertiary'), 0, 90);
        } else {
          return tMaxC(palettes.get('tertiary'));
        }
      },
      isBackground: true,
      background: () => getColor('surfaceContainerHigh'),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          getColor('tertiaryDim'),
          getColor('tertiary'),
          5,
          'darker',
          true,
          'farther',
        ),
    },
    onTertiary: {
      palette: () => palettes.get('tertiary'),
      background: () => getColor('tertiary'),
      contrastCurve: () => getCurve(6),
    },
    tertiaryContainer: {
      palette: () => palettes.get('tertiary'),
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
            Hct.isCyan(palettes.get('tertiary').hue) ? 88 : c.isDark ? 93 : 100,
          );
        } else {
          // VIBRANT
          return c.isDark
            ? tMaxC(palettes.get('tertiary'), 0, 93)
            : tMaxC(palettes.get('tertiary'), 72, 100);
        }
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      adjustTone: () => undefined,
      contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onTertiaryContainer: {
      palette: () => palettes.get('tertiary'),
      background: () => getColor('tertiaryContainer'),
      contrastCurve: () => getCurve(6),
    },

    tertiaryFixed: {
      palette: () => palettes.get('tertiary'),
      tone: () => {
        return c.temp(
          {
            isDark: false,
            contrastLevel: 0,
          },
          () => {
            const color = getColor('tertiaryContainer');
            return color.getTone();
          },
        );
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    tertiaryFixedDim: {
      palette: () => palettes.get('tertiary'),
      tone: () => getColor('tertiaryFixed').getTone(),
      isBackground: true,
      adjustTone: () =>
        toneDeltaPair(
          getColor('tertiaryFixedDim'),
          getColor('tertiaryFixed'),
          5,
          'darker',
          true,
          'exact',
        ),
    },

    onTertiaryFixed: {
      palette: () => palettes.get('tertiary'),
      background: () => getColor('tertiaryFixedDim'),
      contrastCurve: () => getCurve(7),
    },

    onTertiaryFixedVariant: {
      palette: () => palettes.get('tertiary'),
      background: () => getColor('tertiaryFixedDim'),
      contrastCurve: () => getCurve(4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////

    error: {
      palette: () => palettes.get('error'),
      tone: () => {
        return c.isDark
          ? tMinC(palettes.get('error'), 0, 98)
          : tMaxC(palettes.get('error'));
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          colors.get('errorContainer'),
          colors.get('error'),
          5,
          'relative_lighter',
          true,
          'farther',
        ),
    },
    errorDim: {
      palette: () => palettes.get('error'),
      tone: () => tMinC(palettes.get('error')),
      isBackground: true,
      background: () => getColor('surfaceContainerHigh'),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          getColor('errorDim'),
          getColor('error'),
          5,
          'darker',
          true,
          'farther',
        ),
    },
    onError: {
      palette: () => palettes.get('error'),
      background: () => colors.get('error'),
      contrastCurve: () => getCurve(6),
    },
    errorContainer: {
      palette: () => palettes.get('error'),
      tone: () => {
        return c.isDark
          ? tMinC(palettes.get('error'), 30, 93)
          : tMaxC(palettes.get('error'), 0, 90);
      },
      isBackground: true,
      background: () => highestSurface(c, colors),
      adjustTone: () => undefined,
      contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onErrorContainer: {
      palette: () => palettes.get('error'),
      background: () => colors.get('errorContainer'),
      contrastCurve: () => getCurve(4.5),
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
