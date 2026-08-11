import {
  applyToneDelta,
  avoidBackgroundGap,
  contrastAgainst,
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
      palette: () => palettes.get('neutral'),
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
      palette: () => palettes.get('neutral'),
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
      palette: () => palettes.get('neutral'),
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
      palette: () => palettes.get('neutral'),
      tone: () => (c.isDark ? 0 : 100),
    },
    surfaceContainerLow: {
      palette: () => palettes.get('neutral'),
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
      palette: () => palettes.get('neutral'),
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
      palette: () => palettes.get('neutral'),
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
      palette: () => palettes.get('neutral'),
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
      palette: () => palettes.get('neutral'),
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          const curve = (c.isDark ? getCurve(11) : getCurve(9));
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
          }
          return answer;
        },
    },
    onSurfaceVariant: {
      palette: () => palettes.get('neutral'),
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
      tone: () => highestSurface(c, colors).tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          highestSurface(c, colors),
          (c.isDark ? getCurve(6) : getCurve(4.5)).get(context.contrastLevel),
          context.contrastLevel,
        ),
    },
    outline: {
      palette: () => palettes.get('neutral'),
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
      tone: () => highestSurface(c, colors).tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          highestSurface(c, colors),
          getCurve(3).get(context.contrastLevel),
          context.contrastLevel,
        ),
    },
    outlineVariant: {
      palette: () => palettes.get('neutral'),
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
      tone: () => highestSurface(c, colors).tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          highestSurface(c, colors),
          getCurve(1.5).get(context.contrastLevel),
          context.contrastLevel,
        ),
    },
    inverseSurface: {
      palette: () => palettes.get('neutral'),
      tone: () => (c.isDark ? 98 : 4),
    },
    inverseOnSurface: {
      palette: () => palettes.get('neutral'),
      tone: () => colors.get('inverseSurface').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          colors.get('inverseSurface'),
          getCurve(7).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          answer = applyToneDelta(
          answer,
          {
            relativeTo: colors.get('primaryContainer'),
            delta: 5,
            polarity: 'relative_darker',
            constraint: 'farther',
          },
          context.isDark,
        );
          const curve = getCurve(4.5);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
          }
          answer = avoidBackgroundGap(answer);
          return answer;
        },
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          answer = applyToneDelta(
          answer,
          {
            relativeTo: colors.get('primary'),
            delta: 5,
            polarity: 'darker',
            constraint: 'farther',
          },
          context.isDark,
        );
          const curve = getCurve(4.5);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, getColor('surfaceContainerHigh'), ratio, context.contrastLevel);
          }
          answer = avoidBackgroundGap(answer);
          return answer;
        },
    },
    onPrimary: {
      palette: () => palettes.get('primary'),
      tone: () => colors.get('primary').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          colors.get('primary'),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          const curve = (c.contrastLevel > 0 ? getCurve(1.5) : undefined);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
            answer = avoidBackgroundGap(answer);
          }
          return answer;
        },
    },
    onPrimaryContainer: {
      palette: () => palettes.get('primary'),
      tone: () => colors.get('primaryContainer').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          colors.get('primaryContainer'),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
            return color.tone;
          },
        );
      },

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          const curve = (c.contrastLevel > 0 ? getCurve(1.5) : undefined);

          if (curve) {

            const ratio = curve.get(context.contrastLevel);

            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);

            answer = avoidBackgroundGap(answer);

          }

          return answer;

        },

    },

    primaryFixedDim: {

      palette: () => palettes.get('primary'),

      tone: () => colors.get('primaryFixed').tone,

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          answer = applyToneDelta(

          answer,

          {

            relativeTo: getColor('primaryFixed'),

            delta: 5,

            polarity: 'darker',

            constraint: 'exact',

          },

          context.isDark,

        );

          return answer;

        },

    },

    onPrimaryFixed: {

      palette: () => palettes.get('primary'),

      tone: () => colors.get('primaryFixedDim').tone,

      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          colors.get('primaryFixedDim'),
          getCurve(7).get(context.contrastLevel),
          context.contrastLevel,
        ),

    },

    onPrimaryFixedVariant: {

      palette: () => palettes.get('primary'),

      tone: () => colors.get('primaryFixedDim').tone,

      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          colors.get('primaryFixedDim'),
          getCurve(4.5).get(context.contrastLevel),
          context.contrastLevel,
        ),

    },

    inversePrimary: {

      palette: () => palettes.get('primary'),

      tone: () => tMaxC(palettes.get('primary')),

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          const curve = getCurve(6);

          if (curve) {

            const ratio = curve.get(context.contrastLevel);

            answer = contrastAgainst(answer, colors.get('inverseSurface'), ratio, context.contrastLevel);

          }

          return answer;

        },

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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          answer = applyToneDelta(
          answer,
          {
            relativeTo: getColor('secondaryContainer'),
            delta: 5,
            polarity: 'relative_darker',
            constraint: 'farther',
          },
          context.isDark,
        );
          const curve = getCurve(4.5);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
          }
          answer = avoidBackgroundGap(answer);
          return answer;
        },
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          answer = applyToneDelta(
          answer,
          {
            relativeTo: getColor('secondary'),
            delta: 5,
            polarity: 'darker',
            constraint: 'farther',
          },
          context.isDark,
        );
          const curve = getCurve(4.5);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, getColor('surfaceContainerHigh'), ratio, context.contrastLevel);
          }
          answer = avoidBackgroundGap(answer);
          return answer;
        },
    },
    onSecondary: {
      palette: () => palettes.get('secondary'),
      tone: () => getColor('secondary').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('secondary'),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          const curve = (c.contrastLevel > 0 ? getCurve(1.5) : undefined);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
            answer = avoidBackgroundGap(answer);
          }
          return answer;
        },
    },
    onSecondaryContainer: {
      palette: () => palettes.get('secondary'),
      tone: () => getColor('secondaryContainer').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('secondaryContainer'),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
            return color.tone;
          },
        );
      },

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          const curve = (c.contrastLevel > 0 ? getCurve(1.5) : undefined);

          if (curve) {

            const ratio = curve.get(context.contrastLevel);

            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);

            answer = avoidBackgroundGap(answer);

          }

          return answer;

        },

    },

    secondaryFixedDim: {

      palette: () => palettes.get('secondary'),

      tone: () => getColor('secondaryFixed').tone,

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          answer = applyToneDelta(

          answer,

          {

            relativeTo: getColor('secondaryFixed'),

            delta: 5,

            polarity: 'darker',

            constraint: 'exact',

          },

          context.isDark,

        );

          return answer;

        },

    },

    onSecondaryFixed: {

      palette: () => palettes.get('secondary'),

      tone: () => getColor('secondaryFixedDim').tone,

      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('secondaryFixedDim'),
          getCurve(7).get(context.contrastLevel),
          context.contrastLevel,
        ),

    },

    onSecondaryFixedVariant: {

      palette: () => palettes.get('secondary'),

      tone: () => getColor('secondaryFixedDim').tone,

      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('secondaryFixedDim'),
          getCurve(4.5).get(context.contrastLevel),
          context.contrastLevel,
        ),

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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          answer = applyToneDelta(
          answer,
          {
            relativeTo: getColor('tertiaryContainer'),
            delta: 5,
            polarity: 'relative_darker',
            constraint: 'farther',
          },
          context.isDark,
        );
          const curve = getCurve(4.5);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
          }
          answer = avoidBackgroundGap(answer);
          return answer;
        },
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          answer = applyToneDelta(
          answer,
          {
            relativeTo: getColor('tertiary'),
            delta: 5,
            polarity: 'darker',
            constraint: 'farther',
          },
          context.isDark,
        );
          const curve = getCurve(4.5);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, getColor('surfaceContainerHigh'), ratio, context.contrastLevel);
          }
          answer = avoidBackgroundGap(answer);
          return answer;
        },
    },
    onTertiary: {
      palette: () => palettes.get('tertiary'),
      tone: () => getColor('tertiary').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('tertiary'),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          const curve = (c.contrastLevel > 0 ? getCurve(1.5) : undefined);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
            answer = avoidBackgroundGap(answer);
          }
          return answer;
        },
    },
    onTertiaryContainer: {
      palette: () => palettes.get('tertiary'),
      tone: () => getColor('tertiaryContainer').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('tertiaryContainer'),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
            return color.tone;
          },
        );
      },

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          const curve = (c.contrastLevel > 0 ? getCurve(1.5) : undefined);

          if (curve) {

            const ratio = curve.get(context.contrastLevel);

            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);

            answer = avoidBackgroundGap(answer);

          }

          return answer;

        },

    },

    tertiaryFixedDim: {

      palette: () => palettes.get('tertiary'),

      tone: () => getColor('tertiaryFixed').tone,

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          answer = applyToneDelta(

          answer,

          {

            relativeTo: getColor('tertiaryFixed'),

            delta: 5,

            polarity: 'darker',

            constraint: 'exact',

          },

          context.isDark,

        );

          return answer;

        },

    },

    onTertiaryFixed: {

      palette: () => palettes.get('tertiary'),

      tone: () => getColor('tertiaryFixedDim').tone,

      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('tertiaryFixedDim'),
          getCurve(7).get(context.contrastLevel),
          context.contrastLevel,
        ),

    },

    onTertiaryFixedVariant: {

      palette: () => palettes.get('tertiary'),

      tone: () => getColor('tertiaryFixedDim').tone,

      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          getColor('tertiaryFixedDim'),
          getCurve(4.5).get(context.contrastLevel),
          context.contrastLevel,
        ),

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

      adjustTone: ({ context, tone }) => {

          let answer = tone;

          answer = applyToneDelta(

          answer,

          {

            relativeTo: colors.get('errorContainer'),

            delta: 5,

            polarity: 'relative_darker',

            constraint: 'farther',

          },

          context.isDark,

        );

          const curve = getCurve(4.5);

          if (curve) {

            const ratio = curve.get(context.contrastLevel);

            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);

          }

          answer = avoidBackgroundGap(answer);

          return answer;

        },

    },
    errorDim: {
      palette: () => palettes.get('error'),
      tone: () => tMinC(palettes.get('error')),
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          answer = applyToneDelta(
          answer,
          {
            relativeTo: getColor('error'),
            delta: 5,
            polarity: 'darker',
            constraint: 'farther',
          },
          context.isDark,
        );
          const curve = getCurve(4.5);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, getColor('surfaceContainerHigh'), ratio, context.contrastLevel);
          }
          answer = avoidBackgroundGap(answer);
          return answer;
        },
    },
    onError: {
      palette: () => palettes.get('error'),
      tone: () => colors.get('error').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          colors.get('error'),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
    },
    errorContainer: {
      palette: () => palettes.get('error'),
      tone: () => {
        return c.isDark
          ? tMinC(palettes.get('error'), 30, 93)
          : tMaxC(palettes.get('error'), 0, 90);
      },
      adjustTone: ({ context, tone }) => {
          let answer = tone;
          const curve = (c.contrastLevel > 0 ? getCurve(1.5) : undefined);
          if (curve) {
            const ratio = curve.get(context.contrastLevel);
            answer = contrastAgainst(answer, highestSurface(c, colors), ratio, context.contrastLevel);
            answer = avoidBackgroundGap(answer);
          }
          return answer;
        },
    },
    onErrorContainer: {
      palette: () => palettes.get('error'),
      tone: () => colors.get('errorContainer').tone,
      adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          colors.get('errorContainer'),
          getCurve(4.5).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
