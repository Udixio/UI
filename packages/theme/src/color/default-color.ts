import { toneDeltaPair } from '../material-color-utilities';
import { highestSurface } from './color.manager';
import { AddColorsOptions } from './color.api';
import { Hct } from '../material-color-utilities/htc';
import { ColorFromPalette, getInitialToneFromBackground } from './color';
import { Scheme } from '../theme';
import { DynamicColorKey, getCurve, tMaxC, tMinC } from './color.utils';
import { Contrast } from '@material/material-color-utilities';

const inverseTone = (tone: number) => {
  return 100 - tone;
};

export const defaultColors: AddColorsOptions = ({ colors, scheme: s }) => {
  const getColor = (key: DynamicColorKey) => {
    return colors.getColor(key);
  };

  return {
    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////
    surface: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.isDark) {
          return 4;
        } else {
          if (s.variant == 'fidelity') {
            return 100;
          }
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 99;
          } else if (s.variant === 'vibrant') {
            return 97;
          } else {
            return 98;
          }
        }
      },
      isBackground: true,
    },
    surfaceDim: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.isDark) {
          return 4;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 90;
          } else if (s.variant === 'vibrant') {
            return 85;
          } else {
            return 87;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (!s.isDark) {
          if (s.variant === 'neutral') {
            return 2.5;
          } else if (s.variant === 'tonalSpot') {
            return 1.7;
          } else if (s.variant === 'expressive') {
            return Hct.isYellow(s.getPalette('neutral').hue) ? 2.7 : 1.75;
          } else if (s.variant === 'vibrant') {
            return 1.36;
          }
        }
        return 1;
      },
    },
    surfaceBright: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.isDark) {
          return 18;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 99;
          } else if (s.variant === 'vibrant') {
            return 97;
          } else {
            return 98;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (s.isDark) {
          if (s.variant === 'neutral') {
            return 2.5;
          } else if (s.variant === 'tonalSpot') {
            return 1.7;
          } else if (s.variant === 'expressive') {
            return Hct.isYellow(s.getPalette('neutral').hue) ? 2.7 : 1.75;
          } else if (s.variant === 'vibrant') {
            return 1.36;
          }
        }
        return 1;
      },
    },
    surfaceContainerLowest: {
      palette: () => s.getPalette('neutral'),
      tone: () => (s.isDark ? 0 : 100),
      isBackground: true,
    },
    surfaceContainerLow: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.isDark) {
          return 6;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 98;
          } else if (s.variant === 'vibrant') {
            return 95;
          } else {
            return 96;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 1.3;
        } else if (s.variant === 'tonalSpot') {
          return 1.25;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 1.3 : 1.15;
        } else if (s.variant === 'vibrant') {
          return 1.08;
        }
        return 1;
      },
    },
    surfaceContainer: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.isDark) {
          return 9;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 96;
          } else if (s.variant === 'vibrant') {
            return 92;
          } else {
            return 94;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 1.6;
        } else if (s.variant === 'tonalSpot') {
          return 1.4;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 1.6 : 1.3;
        } else if (s.variant === 'vibrant') {
          return 1.15;
        }
        return 1;
      },
    },
    surfaceContainerHigh: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.isDark) {
          return 12;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 94;
          } else if (s.variant === 'vibrant') {
            return 90;
          } else {
            return 92;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 1.9;
        } else if (s.variant === 'tonalSpot') {
          return 1.5;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 1.95 : 1.45;
        } else if (s.variant === 'vibrant') {
          return 1.22;
        }
        return 1;
      },
    },
    surfaceContainerHighest: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.isDark) {
          return 15;
        } else {
          if (Hct.isYellow(s.getPalette('neutral').hue)) {
            return 92;
          } else if (s.variant === 'vibrant') {
            return 88;
          } else {
            return 90;
          }
        }
      },
      isBackground: true,
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue) ? 2.3 : 1.6;
        } else if (s.variant === 'vibrant') {
          return 1.29;
        } else {
          // default
          return 1;
        }
      },
    },
    onSurface: {
      palette: () => s.getPalette('neutral'),
      tone: () => {
        if (s.variant === 'vibrant') {
          return tMaxC(s.getPalette('neutral'), 0, 100, 1.1);
        } else {
          // For all other variants, the initial tone should be the default
          // tone, which is the same as the background color.
          return getInitialToneFromBackground(() => highestSurface(s, colors));
        }
      },
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      background: () => highestSurface(s, colors),
      contrastCurve: () => (s.isDark ? getCurve(11) : getCurve(9)),
    },
    onSurfaceVariant: {
      palette: () => s.getPalette('neutralVariant'),
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }
        return 1;
      },
      background: () => highestSurface(s, colors),
      contrastCurve: () => (s.isDark ? getCurve(6) : getCurve(4.5)),
    },
    outline: {
      palette: () => s.getPalette('neutralVariant'),
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }
        return 1;
      },
      background: () => highestSurface(s, colors),
      contrastCurve: () => getCurve(3),
    },
    outlineVariant: {
      palette: () => s.getPalette('neutralVariant'),
      chromaMultiplier: () => {
        if (s.variant === 'neutral') {
          return 2.2;
        } else if (s.variant === 'tonalSpot') {
          return 1.7;
        } else if (s.variant === 'expressive') {
          return Hct.isYellow(s.getPalette('neutral').hue)
            ? s.isDark
              ? 3.0
              : 2.3
            : 1.6;
        }

        return 1;
      },
      background: () => highestSurface(s, colors),
      contrastCurve: () => getCurve(1.5),
    },
    inverseSurface: {
      palette: () => s.getPalette('neutral'),
      tone: () => (s.isDark ? 98 : 4),
      isBackground: true,
    },
    inverseOnSurface: {
      palette: () => s.getPalette('neutral'),
      tone: () => (s.isDark ? 20 : 95),
      background: () => colors.getColor('inverseSurface'),
      contrastCurve: () => getCurve(7),
    },
    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////
    primary: {
      palette: () => s.getPalette('primary'),
      tone: () => {
        if (s.variant === 'neutral') {
          return s.isDark ? 80 : 40;
        } else if (s.variant === 'tonalSpot') {
          if (s.isDark) {
            return 80;
          } else {
            return tMaxC(s.getPalette('primary'));
          }
        } else if (s.variant === 'expressive') {
          return tMaxC(
            s.getPalette('primary'),
            0,
            Hct.isYellow(s.getPalette('primary').hue)
              ? 25
              : Hct.isCyan(s.getPalette('primary').hue)
                ? 88
                : 98,
          );
        } else if (s.variant == 'fidelity') {
          return s.sourceColorHct.tone;
        } else {
          return tMaxC(
            s.getPalette('primary'),
            0,
            Hct.isCyan(s.getPalette('primary').hue) ? 88 : 98,
          );
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        s.variant == 'fidelity'
          ? () => {
              const surfaceTone = colors.getColor('surface').getTone();
              const primaryTone = (
                colors.getColor('primary') as ColorFromPalette
              ).option.tone();
              let selfTone = primaryTone;
              if (Contrast.ratioOfTones(surfaceTone, selfTone) < 3) {
                const result = inverseTone(primaryTone);
                if (Contrast.ratioOfTones(surfaceTone, result) >= 3) {
                  selfTone = result;
                }
              }
              return selfTone;
            }
          : toneDeltaPair(
              colors.getColor('primaryContainer'),
              colors.getColor('primary'),
              5,
              'relative_lighter',
              true,
              'farther',
            ),
    },
    primaryDim: {
      palette: () => s.getPalette('primary'),
      tone: () => {
        if (s.variant === 'neutral') {
          return 85;
        } else if (s.variant === 'tonalSpot') {
          return tMaxC(s.getPalette('primary'), 0, 90);
        } else {
          return tMaxC(s.getPalette('primary'));
        }
      },
      isBackground: true,
      background: () => getColor('surfaceContainerHigh'),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          colors.getColor('primaryDim'),
          colors.getColor('primary'),
          5,
          'darker',
          true,
          'farther',
        ),
    },
    onPrimary: {
      palette: () => s.getPalette('primary'),
      background: () => colors.getColor('primary'),
      contrastCurve: () => getCurve(6),
    },
    primaryContainer: {
      palette: () => s.getPalette('primary'),
      tone: () => {
        if (s.variant === 'neutral') {
          return s.isDark ? 30 : 90;
        } else if (s.variant === 'tonalSpot') {
          return s.isDark
            ? tMinC(s.getPalette('primary'), 35, 93)
            : tMaxC(s.getPalette('primary'), 0, 90);
        } else if (s.variant === 'expressive') {
          return s.isDark
            ? tMaxC(s.getPalette('primary'), 30, 93)
            : tMaxC(
                s.getPalette('primary'),
                78,
                Hct.isCyan(s.getPalette('primary').hue) ? 88 : 90,
              );
        }
        if (s.variant == 'fidelity') {
          return s.isDark
            ? tMaxC(s.getPalette('primary'), 30, 93)
            : tMaxC(
                s.getPalette('primary'),
                78,
                Hct.isCyan(s.getPalette('primary').hue) ? 88 : 90,
              );
        } else {
          // VIBRANT
          return s.isDark
            ? tMinC(s.getPalette('primary'), 66, 93)
            : tMaxC(
                s.getPalette('primary'),
                66,
                Hct.isCyan(s.getPalette('primary').hue) ? 88 : 93,
              );
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      adjustTone: () =>
        s.variant == 'fidelity'
          ? toneDeltaPair(
              colors.getColor('primary'),
              colors.getColor('primaryContainer'),
              15,
              'relative_darker',
              true,
              'farther',
            )
          : undefined,
      contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onPrimaryContainer: {
      palette: () => s.getPalette('primary'),
      background: () => colors.getColor('primaryContainer'),
      contrastCurve: () => getCurve(6),
    },

    primaryFixed: {
      palette: () => s.getPalette('primary'),
      tone: () => {
        const tempS = new Scheme({
          ...s.options,
          isDark: false,
          contrastLevel: 0,
        });
        const color = getColor('primaryContainer');
        if (color instanceof ColorFromPalette) {
          return color.getTone(tempS);
        } else {
          throw new Error(
            'Primary container color must be an instance of ColorFromPalette',
          );
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    primaryFixedDim: {
      palette: () => s.getPalette('primary'),
      tone: () => colors.getColor('primaryFixed').getTone(),
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
      palette: () => s.getPalette('primary'),
      background: () => colors.getColor('primaryFixedDim'),
      contrastCurve: () => getCurve(7),
    },

    onPrimaryFixedVariant: {
      palette: () => s.getPalette('primary'),
      background: () => colors.getColor('primaryFixedDim'),
      contrastCurve: () => getCurve(4.5),
    },

    inversePrimary: {
      palette: () => s.getPalette('primary'),
      tone: () => tMaxC(s.getPalette('primary')),
      background: () => colors.getColor('inverseSurface'),
      contrastCurve: () => getCurve(6),
    },
    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////
    secondary: {
      palette: () => s.getPalette('secondary'),
      tone: () => {
        if (s.variant === 'neutral') {
          return s.isDark
            ? tMinC(s.getPalette('secondary'), 0, 98)
            : tMaxC(s.getPalette('secondary'));
        } else if (s.variant === 'vibrant') {
          return tMaxC(s.getPalette('secondary'), 0, s.isDark ? 90 : 98);
        } else {
          // EXPRESSIVE and TONAL_SPOT
          return s.isDark ? 80 : tMaxC(s.getPalette('secondary'));
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
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
      palette: () => s.getPalette('secondary'),
      tone: () => {
        if (s.variant === 'neutral') {
          return 85;
        } else {
          return tMaxC(s.getPalette('secondary'), 0, 90);
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
      palette: () => s.getPalette('secondary'),
      background: () => getColor('secondary'),
      contrastCurve: () => getCurve(6),
    },
    secondaryContainer: {
      palette: () => s.getPalette('secondary'),
      tone: () => {
        if (s.variant === 'vibrant') {
          return s.isDark
            ? tMinC(s.getPalette('secondary'), 30, 40)
            : tMaxC(s.getPalette('secondary'), 84, 90);
        } else if (s.variant === 'expressive') {
          return s.isDark ? 15 : tMaxC(s.getPalette('secondary'), 90, 95);
        } else {
          return s.isDark ? 25 : 90;
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      adjustTone: () => undefined,
      contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onSecondaryContainer: {
      palette: () => s.getPalette('secondary'),
      background: () => getColor('secondaryContainer'),
      contrastCurve: () => getCurve(6),
    },

    secondaryFixed: {
      palette: () => s.getPalette('secondary'),
      tone: () => {
        const tempS = new Scheme({
          ...s.options,
          isDark: false,
          contrastLevel: 0,
        });

        const color = getColor('secondaryContainer');
        if (color instanceof ColorFromPalette) {
          return color.getTone(tempS);
        } else {
          throw new Error(
            'Primary container color must be an instance of ColorFromPalette',
          );
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    secondaryFixedDim: {
      palette: () => s.getPalette('secondary'),
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
      palette: () => s.getPalette('secondary'),
      background: () => getColor('secondaryFixedDim'),
      contrastCurve: () => getCurve(7),
    },

    onSecondaryFixedVariant: {
      palette: () => s.getPalette('secondary'),
      background: () => getColor('secondaryFixedDim'),
      contrastCurve: () => getCurve(4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////
    tertiary: {
      palette: () => s.getPalette('tertiary'),
      tone: () => {
        if (s.variant === 'expressive' || s.variant === 'vibrant') {
          return tMaxC(
            s.getPalette('tertiary'),
            0,
            Hct.isCyan(s.getPalette('tertiary').hue) ? 88 : s.isDark ? 98 : 100,
          );
        } else {
          // NEUTRAL and TONAL_SPOT
          return s.isDark
            ? tMaxC(s.getPalette('tertiary'), 0, 98)
            : tMaxC(s.getPalette('tertiary'));
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
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
      palette: () => s.getPalette('tertiary'),
      tone: () => {
        if (s.variant === 'tonalSpot') {
          return tMaxC(s.getPalette('tertiary'), 0, 90);
        } else {
          return tMaxC(s.getPalette('tertiary'));
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
      palette: () => s.getPalette('tertiary'),
      background: () => getColor('tertiary'),
      contrastCurve: () => getCurve(6),
    },
    tertiaryContainer: {
      palette: () => s.getPalette('tertiary'),
      tone: () => {
        if (s.variant === 'neutral') {
          return s.isDark
            ? tMaxC(s.getPalette('tertiary'), 0, 93)
            : tMaxC(s.getPalette('tertiary'), 0, 96);
        } else if (s.variant === 'tonalSpot') {
          return tMaxC(s.getPalette('tertiary'), 0, s.isDark ? 93 : 100);
        } else if (s.variant === 'expressive') {
          return tMaxC(
            s.getPalette('tertiary'),
            75,
            Hct.isCyan(s.getPalette('tertiary').hue) ? 88 : s.isDark ? 93 : 100,
          );
        } else {
          // VIBRANT
          return s.isDark
            ? tMaxC(s.getPalette('tertiary'), 0, 93)
            : tMaxC(s.getPalette('tertiary'), 72, 100);
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      adjustTone: () => undefined,
      contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onTertiaryContainer: {
      palette: () => s.getPalette('tertiary'),
      background: () => getColor('tertiaryContainer'),
      contrastCurve: () => getCurve(6),
    },

    tertiaryFixed: {
      palette: () => s.getPalette('tertiary'),
      tone: () => {
        const tempS = new Scheme({
          ...s.options,
          isDark: false,
          contrastLevel: 0,
        });

        const color = getColor('tertiaryContainer');
        if (color instanceof ColorFromPalette) {
          return color.getTone(tempS);
        } else {
          throw new Error(
            'Primary container color must be an instance of ColorFromPalette',
          );
        }
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    tertiaryFixedDim: {
      palette: () => s.getPalette('tertiary'),
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
      palette: () => s.getPalette('tertiary'),
      background: () => getColor('tertiaryFixedDim'),
      contrastCurve: () => getCurve(7),
    },

    onTertiaryFixedVariant: {
      palette: () => s.getPalette('tertiary'),
      background: () => getColor('tertiaryFixedDim'),
      contrastCurve: () => getCurve(4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////

    error: {
      palette: () => s.getPalette('error'),
      tone: () => {
        return s.isDark
          ? tMinC(s.getPalette('error'), 0, 98)
          : tMaxC(s.getPalette('error'));
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      contrastCurve: () => getCurve(4.5),
      adjustTone: () =>
        toneDeltaPair(
          colors.getColor('errorContainer'),
          colors.getColor('error'),
          5,
          'relative_lighter',
          true,
          'farther',
        ),
    },
    errorDim: {
      palette: () => s.getPalette('error'),
      tone: () => tMinC(s.getPalette('error')),
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
      palette: () => s.getPalette('error'),
      background: () => colors.getColor('error'),
      contrastCurve: () => getCurve(6),
    },
    errorContainer: {
      palette: () => s.getPalette('error'),
      tone: () => {
        return s.isDark
          ? tMinC(s.getPalette('error'), 30, 93)
          : tMaxC(s.getPalette('error'), 0, 90);
      },
      isBackground: true,
      background: () => highestSurface(s, colors),
      adjustTone: () => undefined,
      contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onErrorContainer: {
      palette: () => s.getPalette('error'),
      background: () => colors.getColor('errorContainer'),
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
