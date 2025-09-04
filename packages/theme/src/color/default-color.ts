import { toneDeltaPair } from '../material-color-utilities';
import { DynamicColor } from '../material-color-utilities/dynamic_color';
import { highestSurface } from './color.manager';
import { AddColorsOptions, ColorApi } from './color.api';
import { Hct } from '../material-color-utilities/htc';
import { ColorOptions } from './configurable-color';
import { Scheme } from '../theme';
import { DynamicColorKey, getCurve, tMaxC, tMinC } from './color.utils';
import { Contrast } from '@material/material-color-utilities';

const inverseTone = (tone: number) => {
  return 100 - tone;
};

export const defaultColors: AddColorsOptions = (colorService: ColorApi) => {
  const getColor = (key: DynamicColorKey) => {
    return colorService.getColor(key).getMaterialColor();
  };

  const colors: Record<
    DynamicColorKey,
    | (Partial<ColorOptions> & { alias?: never })
    | { alias: string; palette?: never; tone?: never }
  > = {
    ////////////////////////////////////////////////////////////////
    // Surfaces [S]                                               //
    ////////////////////////////////////////////////////////////////
    surface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
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
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
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
      chromaMultiplier: (s) => {
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
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
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
      chromaMultiplier: (s) => {
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
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 0 : 100),
      isBackground: true,
    },
    surfaceContainerLow: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
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
      chromaMultiplier: (s) => {
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
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
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
      chromaMultiplier: (s) => {
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
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
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
      chromaMultiplier: (s) => {
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
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
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
      chromaMultiplier: (s) => {
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
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => {
        if (s.variant === 'vibrant') {
          return tMaxC(s.getPalette('neutral'), 0, 100, 1.1);
        } else {
          // For all other variants, the initial tone should be the default
          // tone, which is the same as the background color.
          return DynamicColor.getInitialToneFromBackground((s) =>
            highestSurface(s, colorService),
          )(s);
        }
      },
      chromaMultiplier: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => (s.isDark ? getCurve(11) : getCurve(9)),
    },
    onSurfaceVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      chromaMultiplier: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => (s.isDark ? getCurve(6) : getCurve(4.5)),
    },
    outline: {
      palette: (s) => s.getPalette('neutralVariant'),
      chromaMultiplier: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(3),
    },
    outlineVariant: {
      palette: (s) => s.getPalette('neutralVariant'),
      chromaMultiplier: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(1.5),
    },
    inverseSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 98 : 4),
      isBackground: true,
    },
    inverseOnSurface: {
      palette: (s) => s.getPalette('neutral'),
      tone: (s) => (s.isDark ? 20 : 95),
      background: (s) =>
        colorService.getColor('inverseSurface').getMaterialColor(),
      contrastCurve: (s) => getCurve(7),
    },
    ////////////////////////////////////////////////////////////////
    // Primaries [P]                                              //
    ////////////////////////////////////////////////////////////////
    primary: {
      palette: (s) => s.getPalette('primary'),
      tone: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
        s.variant == 'fidelity'
          ? () => {
              const surfaceTone = colorService
                .getColor('surface')
                .getMaterialColor()
                .tone(s);
              const primaryTone = colorService
                .getColor('primary')
                .getMaterialColor()
                .tone(s);
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
              colorService.getColor('primaryContainer').getMaterialColor(),
              colorService.getColor('primary').getMaterialColor(),
              5,
              'relative_lighter',
              true,
              'farther',
            ),
    },
    primaryDim: {
      palette: (s) => s.getPalette('primary'),
      tone: (s) => {
        if (s.variant === 'neutral') {
          return 85;
        } else if (s.variant === 'tonalSpot') {
          return tMaxC(s.getPalette('primary'), 0, 90);
        } else {
          return tMaxC(s.getPalette('primary'));
        }
      },
      isBackground: true,
      background: (s) => getColor('surfaceContainerHigh'),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
        toneDeltaPair(
          colorService.getColor('primaryDim').getMaterialColor(),
          colorService.getColor('primary').getMaterialColor(),
          5,
          'darker',
          true,
          'farther',
        ),
    },
    onPrimary: {
      palette: (s) => s.getPalette('primary'),
      background: (s) => colorService.getColor('primary').getMaterialColor(),
      contrastCurve: (s) => getCurve(6),
    },
    primaryContainer: {
      palette: (s) => s.getPalette('primary'),
      tone: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      adjustTone: (s) =>
        s.variant == 'fidelity'
          ? toneDeltaPair(
              colorService.getColor('primary').getMaterialColor(),
              colorService.getColor('primaryContainer').getMaterialColor(),
              15,
              'relative_darker',
              true,
              'farther',
            )
          : undefined,
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onPrimaryContainer: {
      palette: (s) => s.getPalette('primary'),
      background: (s) =>
        colorService.getColor('primaryContainer').getMaterialColor(),
      contrastCurve: (s) => getCurve(6),
    },

    primaryFixed: {
      palette: (s) => s.getPalette('primary'),
      tone: (s) => {
        const tempS = new Scheme({
          ...s.options,
          isDark: false,
          contrastLevel: 0,
        });
        return getColor('primaryContainer').getTone(tempS);
      },
      isBackground: true,
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    primaryFixedDim: {
      palette: (s) => s.getPalette('primary'),
      tone: (s) =>
        colorService.getColor('primaryFixed').getMaterialColor().getTone(s),
      isBackground: true,
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('primary'),
      background: (s) =>
        colorService.getColor('primaryFixedDim').getMaterialColor(),
      contrastCurve: (s) => getCurve(7),
    },

    onPrimaryFixedVariant: {
      palette: (s) => s.getPalette('primary'),
      background: (s) =>
        colorService.getColor('primaryFixedDim').getMaterialColor(),
      contrastCurve: (s) => getCurve(4.5),
    },

    inversePrimary: {
      palette: (s) => s.getPalette('primary'),
      tone: (s) => tMaxC(s.getPalette('primary')),
      background: (s) =>
        colorService.getColor('inverseSurface').getMaterialColor(),
      contrastCurve: (s) => getCurve(6),
    },
    ////////////////////////////////////////////////////////////////
    // Secondaries [Q]                                            //
    ////////////////////////////////////////////////////////////////
    secondary: {
      palette: (s) => s.getPalette('secondary'),
      tone: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('secondary'),
      tone: (s) => {
        if (s.variant === 'neutral') {
          return 85;
        } else {
          return tMaxC(s.getPalette('secondary'), 0, 90);
        }
      },
      isBackground: true,
      background: (s) => getColor('surfaceContainerHigh'),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('secondary'),
      background: (s) => getColor('secondary'),
      contrastCurve: (s) => getCurve(6),
    },
    secondaryContainer: {
      palette: (s) => s.getPalette('secondary'),
      tone: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      adjustTone: (s) => undefined,
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onSecondaryContainer: {
      palette: (s) => s.getPalette('secondary'),
      background: (s) => getColor('secondaryContainer'),
      contrastCurve: (s) => getCurve(6),
    },

    secondaryFixed: {
      palette: (s) => s.getPalette('secondary'),
      tone: (s) => {
        const tempS = new Scheme({
          ...s.options,
          isDark: false,
          contrastLevel: 0,
        });
        return getColor('secondaryContainer').getTone(tempS);
      },
      isBackground: true,
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    secondaryFixedDim: {
      palette: (s) => s.getPalette('secondary'),
      tone: (s) => getColor('secondaryFixed').getTone(s),
      isBackground: true,
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('secondary'),
      background: (s) => getColor('secondaryFixedDim'),
      contrastCurve: (s) => getCurve(7),
    },

    onSecondaryFixedVariant: {
      palette: (s) => s.getPalette('secondary'),
      background: (s) => getColor('secondaryFixedDim'),
      contrastCurve: (s) => getCurve(4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Tertiaries [T]                                             //
    ////////////////////////////////////////////////////////////////
    tertiary: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => {
        if (s.variant === 'tonalSpot') {
          return tMaxC(s.getPalette('tertiary'), 0, 90);
        } else {
          return tMaxC(s.getPalette('tertiary'));
        }
      },
      isBackground: true,
      background: (s) => getColor('surfaceContainerHigh'),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('tertiary'),
      background: (s) => getColor('tertiary'),
      contrastCurve: (s) => getCurve(6),
    },
    tertiaryContainer: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => {
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
      background: (s) => highestSurface(s, colorService),
      adjustTone: (s) => undefined,
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onTertiaryContainer: {
      palette: (s) => s.getPalette('tertiary'),
      background: (s) => getColor('tertiaryContainer'),
      contrastCurve: (s) => getCurve(6),
    },

    tertiaryFixed: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => {
        const tempS = new Scheme({
          ...s.options,
          isDark: false,
          contrastLevel: 0,
        });
        return getColor('tertiaryContainer').getTone(tempS);
      },
      isBackground: true,
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },

    tertiaryFixedDim: {
      palette: (s) => s.getPalette('tertiary'),
      tone: (s) => getColor('tertiaryFixed').getTone(s),
      isBackground: true,
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('tertiary'),
      background: (s) => getColor('tertiaryFixedDim'),
      contrastCurve: (s) => getCurve(7),
    },

    onTertiaryFixedVariant: {
      palette: (s) => s.getPalette('tertiary'),
      background: (s) => getColor('tertiaryFixedDim'),
      contrastCurve: (s) => getCurve(4.5),
    },

    ////////////////////////////////////////////////////////////////
    // Errors [E]                                                 //
    ////////////////////////////////////////////////////////////////

    error: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => {
        return s.isDark
          ? tMinC(s.getPalette('error'), 0, 98)
          : tMaxC(s.getPalette('error'));
      },
      isBackground: true,
      background: (s) => highestSurface(s, colorService),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
        toneDeltaPair(
          colorService.getColor('errorContainer').getMaterialColor(),
          colorService.getColor('error').getMaterialColor(),
          5,
          'relative_lighter',
          true,
          'farther',
        ),
    },
    errorDim: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => tMinC(s.getPalette('error')),
      isBackground: true,
      background: (s) => getColor('surfaceContainerHigh'),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
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
      palette: (s) => s.getPalette('error'),
      background: (s) => colorService.getColor('error').getMaterialColor(),
      contrastCurve: (s) => getCurve(6),
    },
    errorContainer: {
      palette: (s) => s.getPalette('error'),
      tone: (s) => {
        return s.isDark
          ? tMinC(s.getPalette('error'), 30, 93)
          : tMaxC(s.getPalette('error'), 0, 90);
      },
      isBackground: true,
      background: (s) => highestSurface(s, colorService),
      adjustTone: (s) => undefined,
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    },
    onErrorContainer: {
      palette: (s) => s.getPalette('error'),
      background: (s) =>
        colorService.getColor('errorContainer').getMaterialColor(),
      contrastCurve: (s) => getCurve(4.5),
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
  return {
    colors,
  };
};
