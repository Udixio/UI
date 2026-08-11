import {
  applyToneDelta,
  avoidBackgroundGap,
  contrastAgainst,
  onColor,
} from '../../color/tone-adjusters';
import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import {
  calculateToneAdjustmentPercentage,
  DynamicColorKey,
  getCurve,
  tMaxC,
  tMinC,
} from '../../color/color.utils';
import {
  AddColorsOptions,
  capitalizeFirstLetter,
  Color,
  ColorApi,
  ColorManager,
} from '../../color';
import { Contrast } from '@material/material-color-utilities';
import { Context } from '../../context';
import { API } from '../../API';

const surfaceContainerToneDelta = 2.5;

const inverseTone = (tone: number) => {
  return 100 - tone;
};

export const normalize = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number] = [0, 1],
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  const clampedValue = Math.max(inputMin, Math.min(value, inputMax));

  const normalizedValue = (clampedValue - inputMin) / (inputMax - inputMin);

  return outputMin + normalizedValue * (outputMax - outputMin);
};

const surfaceContainerTone = (
  layer: number,
  api: Pick<API, 'palettes' | 'context'>,
) => {
  const t = surfaceContainerToneDelta * layer * (1 + api.context.contrastLevel);
  if (api.context.isDark) {
    return t * 1.5;
  } else {
    if (Color.isYellow(api.palettes.get('neutral').hue)) {
      return 100 - t - surfaceContainerToneDelta;
    }
    return 100 - t;
  }
};

const highestSurface = (
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

// Permet de réutiliser la logique "si contraste < minContrast, pousser le tone vers l'inverse"
// pour n'importe quelle couleur (pas seulement `primary`), et avec une référence configurable.
export const createMinContrastToneAdjuster = (
  ctx: Context,
  colors: ColorManager | ColorApi,
  options: {
    baseTone: number;
    referenceKey?: DynamicColorKey; // par défaut: la surface la plus "haute"
  },
) => {
  const { baseTone, referenceKey } = options;
  const minContrast =
    ctx.contrastLevel >= 0
      ? normalize(ctx.contrastLevel, [0, 1], [3, 7])
      : normalize(ctx.contrastLevel, [-1, 0], [0, 3]);

  const referenceTone = referenceKey
    ? colors.get(referenceKey).tone
    : highestSurface(ctx, colors).tone;

  let selfTone = baseTone;
  if (Contrast.ratioOfTones(referenceTone, selfTone) < minContrast) {
    const ratio = calculateToneAdjustmentPercentage(
      referenceTone,
      selfTone,
      minContrast,
    );
    const inverseT = ctx.isDark ? 100 : 0;
    selfTone = selfTone + (inverseT - selfTone) * ratio;
  }

  return selfTone;
};

export const udixioVariant: Variant = variant({
  name: 'udixio',
  palettes: {
    primary: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: sourceColor.chroma,
    }),
    secondary: ({ sourceColor }) => ({
      hue: sourceColor.hue,
      chroma: sourceColor.chroma * 0.5,
    }),
    tertiary: ({ sourceColor }) => ({
      hue: getRotatedHue(
        sourceColor,
        [0, 20, 71, 161, 333, 360],
        [-40, 48, -32, 40, -32],
      ),
      chroma: sourceColor.chroma,
    }),
    neutral: ({ sourceColor }) => {
      return {
        hue: sourceColor.hue,
        chroma: 5,
      };
    },
    error: ({ sourceColor }) => {
      const errorHue = getPiecewiseHue(
        sourceColor,
        [0, 3, 13, 23, 33, 43, 153, 273, 360],
        [12, 22, 32, 12, 22, 32, 22, 12],
      );
      return {
        hue: errorHue,
        chroma: 60,
      };
    },
  },
  customPalettes: ({ sourceColor }, colorHct) => ({
    hue: colorHct.hue,
    chroma: sourceColor.chroma,
  }),

  colorsFromCustomPalette: (key: string) => {
    const colorKey = key as DynamicColorKey;
    // const colorDimKey = (colorKey + 'Dim') as DynamicColorKey;
    const ColorKey = capitalizeFirstLetter(key);
    const onColorKey = ('on' + ColorKey) as DynamicColorKey;
    const colorContainerKey = (colorKey + 'Container') as DynamicColorKey;
    const onColorContainerKey = ('on' +
      ColorKey +
      'Container') as DynamicColorKey;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // const inverseColorKey = ('inverse' + ColorKey) as DynamicColorKey;
    // const colorFixedKey = (colorKey + 'Fixed') as DynamicColorKey;
    // const colorFixedDimKey = (colorKey + 'FixedDim') as DynamicColorKey;
    // const onColorFixedKey = ('on' + ColorKey + 'Fixed') as DynamicColorKey;
    // const onColorFixedVariantKey = ('on' +
    //   ColorKey +
    //   'FixedVariant') as DynamicColorKey;
    const colors: AddColorsOptions = ({ palettes, colors, context: ctx }) => ({
      [colorKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => {
          return colors.get('primary').tone;
          // return ctx.isDark ? 80 : tMaxC(palettes.get(colorKey));
        },
      },
      // [colorDimKey]: {
      //   palette: () => palettes.get(colorKey),
      //   tone: () => {
      //     if (ctx.variant.name === 'neutral') {
      //       return 85;
      //     } else {
      //       return tMaxC(palettes.get(colorKey), 0, 90);
      //     }
      //   },
      //   isBackground: true,
      //   background: () => colors.get('surfaceContainerHigh'),
      //   contrastCurve: () => getCurve(4.5),
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       colors.get(colorDimKey),
      //       colors.get(colorKey),
      //       5,
      //       'darker',
      //       true,
      //       'farther',
      //     ),
      // },
      [onColorKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => colors.get(colorKey).tone,
        adjustTone: onColor(
          () => colors.get(colorKey),
          () => getCurve(6),
        ),
      },
      [colorContainerKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => {
          return ctx.isDark
            ? tMinC(palettes.get(colorKey), 35, 93)
            : tMaxC(palettes.get(colorKey), 0, 90);
        },
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            answer = applyToneDelta(
            answer,
            {
              relativeTo: colors.get(colorKey),
              delta: 15,
              polarity: 'relative_lighter',
              constraint: 'farther',
            },
            context.isDark,
          );
            const curve = ctx.contrastLevel > 0 ? getCurve(1.5) : undefined;
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, colors), ratio, context.contrastLevel);
            }
            answer = avoidBackgroundGap(answer);
            return answer;
          },
      },
      [onColorContainerKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => colors.get(colorContainerKey).tone,
        adjustTone: onColor(
          () => colors.get(colorContainerKey),
          () => getCurve(6),
        ),
      },
      // [colorFixedKey]: {
      //   palette: () => palettes.get(colorKey),
      //   tone: () => {
      //     return ctx.temp({ isDark: false, contrastLevel: 0 }, () => {
      //       const color = colors.get(colorContainerKey);
      //       return color.tone;
      //     });
      //   },
      //   isBackground: true,
      //   background: () => highestSurface(ctx, colors),
      //   contrastCurve: () =>
      //     ctx.contrastLevel > 0 ? getCurve(1.5) : undefined,
      // },
      // [colorFixedDimKey]: {
      //   palette: () => palettes.get(colorKey),
      //   tone: () => colors.get(colorFixedKey).tone,
      //   isBackground: true,
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       colors.get(colorFixedDimKey),
      //       colors.get(colorFixedKey),
      //       5,
      //       'darker',
      //       true,
      //       'exact',
      //     ),
      // },
      // [onColorFixedKey]: {
      //   palette: () => palettes.get(colorKey),
      //   background: () => this.get(colorFixedDimKey),
      //   contrastCurve: () => getCurve(7),
      // },
      // [onColorFixedVariantKey]: {
      //   palette: () => palettes.get(colorKey),
      //   background: () => colors.get(colorFixedDimKey),
      //   contrastCurve: () => getCurve(4.5),
      // },
    });

    return colors;
  },
  colors: ({ colors, context: ctx, palettes }) => {
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
          if (ctx.isDark) {
            return 2;
          } else {
            return 99;
          }
        },
      },
      surfaceDim: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          if (!ctx.isDark) {
            return 1.7;
          }
          return 1;
        },
        tone: () => {
          if (ctx.isDark) {
            return surfaceContainerTone(0.5, { palettes, context: ctx });
          } else {
            return surfaceContainerTone(5, { palettes, context: ctx });
          }
        },
      },
      surfaceBright: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          if (ctx.isDark) {
            return 1.7;
          }
          return 1;
        },
        tone: () => {
          if (ctx.isDark) {
            return surfaceContainerTone(5, { palettes, context: ctx });
          } else {
            return surfaceContainerTone(0.5, { palettes, context: ctx });
          }
        },
      },
      surfaceContainerLowest: {
        palette: () => palettes.get('neutral'),
        tone: () => surfaceContainerTone(0, { palettes, context: ctx }),
      },
      surfaceContainerLow: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.25;
        },
        tone: () => surfaceContainerTone(1, { palettes, context: ctx }),
      },
      surfaceContainer: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.4;
        },
        tone: () => surfaceContainerTone(2, { palettes, context: ctx }),
      },
      surfaceContainerHigh: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.5;
        },
        tone: () => surfaceContainerTone(3, { palettes, context: ctx }),
      },
      surfaceContainerHighest: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.7;
        },
        tone: () => surfaceContainerTone(4, { palettes, context: ctx }),
      },
      onSurface: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.7;
        },
        tone: () => {
          return highestSurface(ctx, colors).tone;
        },
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            const curve = (ctx.isDark ? getCurve(11) : getCurve(9));
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, colors), ratio, context.contrastLevel);
            }
            return answer;
          },
      },
      onSurfaceVariant: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.7;
        },
        tone: () => highestSurface(ctx, colors).tone,
        adjustTone: onColor(
          () => highestSurface(ctx, colors),
          () => (ctx.isDark ? getCurve(6) : getCurve(4.5)),
        ),
      },
      outline: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.7;
        },
        tone: () => highestSurface(ctx, colors).tone,
        adjustTone: onColor(
          () => highestSurface(ctx, colors),
          () => getCurve(3),
        ),
      },
      outlineVariant: {
        palette: () => palettes.get('neutral'),
        chromaMultiplier: () => {
          return 1.7;
        },
        tone: () => highestSurface(ctx, colors).tone,
        adjustTone: onColor(
          () => highestSurface(ctx, colors),
          () => getCurve(1.5),
        ),
      },
      inverseSurface: {
        palette: () => palettes.get('neutral'),
        tone: () => 100 - colors.get('surface').tone,
      },
      inverseOnSurface: {
        palette: () => palettes.get('neutral'),
        tone: () => (ctx.isDark ? 20 : 95),
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            const curve = getCurve(7);
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, colors.get('inverseSurface'), ratio, context.contrastLevel);
            }
            return answer;
          },
      },
      ////////////////////////////////////////////////////////////////
      // Primaries [P]                                              //
      ////////////////////////////////////////////////////////////////
      primary: {
        palette: () => palettes.get('primary'),
        tone: () => {
          return ctx.sourceColor.tone;
        },
        adjustTone: ({ context, tone }) => {
          return createMinContrastToneAdjuster(ctx, colors, {
            baseTone: tone,
          });
        },
      },
      // primaryDim: {
      //   palette: () => palettes.get('primary'),
      //   tone: () => {
      //     if (c.variant.name === 'neutral') {
      //       return 85;
      //     } else if (c.variant.name === 'tonalSpot') {
      //       return tMaxC(palettes.get('primary'), 0, 90);
      //     } else {
      //       return tMaxC(palettes.get('primary'));
      //     }
      //   },
      //   isBackground: true,
      //   background: () => getColor('surfaceContainerHigh'),
      //   contrastCurve: () => getCurve(4.5),
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       colors.get('primaryDim'),
      //       colors.get('primary'),
      //       5,
      //       'darker',
      //       true,
      //       'farther',
      //     ),
      // },
      onPrimary: {
        palette: () => palettes.get('primary'),
        tone: () => colors.get('primary').tone,
        adjustTone: onColor(
          () => colors.get('primary'),
          () => getCurve(6),
        ),
      },
      primaryContainer: {
        palette: () => palettes.get('primary'),
        tone: () => {
          return ctx.isDark
            ? tMinC(palettes.get('primary'), 35, 93)
            : tMaxC(palettes.get('primary'), 0, 90);
        },
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            answer = applyToneDelta(
            answer,
            {
              relativeTo: colors.get('primary'),
              delta: 15,
              polarity: 'relative_lighter',
              constraint: 'farther',
            },
            context.isDark,
          );
            const curve = ctx.contrastLevel > 0 ? getCurve(1.5) : undefined;
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, colors), ratio, context.contrastLevel);
            }
            answer = avoidBackgroundGap(answer);
            return answer;
          },
      },
      onPrimaryContainer: {
        palette: () => palettes.get('primary'),
        tone: () => colors.get('primaryContainer').tone,
        adjustTone: onColor(
          () => colors.get('primaryContainer'),
          () => getCurve(6),
        ),
      },

      // primaryFixed: {
      //   palette: () => palettes.get('primary'),
      //   tone: () => {
      //     return c.temp(
      //       {
      //         isDark: false,
      //         contrastLevel: 0,
      //       },
      //       () => {
      //         const color = getColor('primaryContainer');
      //         return color.tone;
      //       },
      //     );
      //   },
      //   isBackground: true,
      //   background: () => highestSurface(c, colors),
      //   contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
      // },

      // primaryFixedDim: {
      //   palette: () => palettes.get('primary'),
      //   tone: () => colors.get('primaryFixed').tone,
      //   isBackground: true,
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       getColor('primaryFixedDim'),
      //       getColor('primaryFixed'),
      //       5,
      //       'darker',
      //       true,
      //       'exact',
      //     ),
      // },

      // onPrimaryFixed: {
      //   palette: () => palettes.get('primary'),
      //   background: () => colors.get('primaryFixedDim'),
      //   contrastCurve: () => getCurve(7),
      // },

      // onPrimaryFixedVariant: {
      //   palette: () => palettes.get('primary'),
      //   background: () => colors.get('primaryFixedDim'),
      //   contrastCurve: () => getCurve(4.5),
      // },

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
          return colors.get('primary').tone;
        },
      },
      // secondaryDim: {
      //   palette: () => palettes.get('secondary'),
      //   tone: () => {
      //     if (c.variant.name === 'neutral') {
      //       return 85;
      //     } else {
      //       return tMaxC(palettes.get('secondary'), 0, 90);
      //     }
      //   },
      //   isBackground: true,
      //   background: () => getColor('surfaceContainerHigh'),
      //   contrastCurve: () => getCurve(4.5),
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       getColor('secondaryDim'),
      //       getColor('secondary'),
      //       5,
      //       'darker',
      //       true,
      //       'farther',
      //     ),
      // },
      onSecondary: {
        palette: () => palettes.get('secondary'),
        tone: () => getColor('secondary').tone,
        adjustTone: onColor(
          () => getColor('secondary'),
          () => getCurve(6),
        ),
      },
      secondaryContainer: {
        palette: () => palettes.get('secondary'),
        tone: () => {
          return ctx.isDark
            ? tMinC(palettes.get('secondary'), 35, 93)
            : tMaxC(palettes.get('secondary'), 0, 90);
        },
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            answer = applyToneDelta(
            answer,
            {
              relativeTo: colors.get('secondary'),
              delta: 15,
              polarity: 'relative_lighter',
              constraint: 'farther',
            },
            context.isDark,
          );
            const curve = ctx.contrastLevel > 0 ? getCurve(1.5) : undefined;
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, colors), ratio, context.contrastLevel);
            }
            answer = avoidBackgroundGap(answer);
            return answer;
          },
      },
      onSecondaryContainer: {
        palette: () => palettes.get('secondary'),
        tone: () => getColor('secondaryContainer').tone,
        adjustTone: onColor(
          () => getColor('secondaryContainer'),
          () => getCurve(6),
        ),
      },

      // secondaryFixed: {
      //   palette: () => palettes.get('secondary'),
      //   tone: () => {
      //     return c.temp(
      //       {
      //         isDark: false,
      //         contrastLevel: 0,
      //       },
      //       () => {
      //         const color = getColor('secondaryContainer');
      //         return color.tone;
      //       },
      //     );
      //   },
      //   isBackground: true,
      //   background: () => highestSurface(c, colors),
      //   contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
      // },

      // secondaryFixedDim: {
      //   palette: () => palettes.get('secondary'),
      //   tone: () => getColor('secondaryFixed').tone,
      //   isBackground: true,
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       getColor('secondaryFixedDim'),
      //       getColor('secondaryFixed'),
      //       5,
      //       'darker',
      //       true,
      //       'exact',
      //     ),
      // },

      // onSecondaryFixed: {
      //   palette: () => palettes.get('secondary'),
      //   background: () => getColor('secondaryFixedDim'),
      //   contrastCurve: () => getCurve(7),
      // },

      // onSecondaryFixedVariant: {
      //   palette: () => palettes.get('secondary'),
      //   background: () => getColor('secondaryFixedDim'),
      //   contrastCurve: () => getCurve(4.5),
      // },

      ////////////////////////////////////////////////////////////////
      // Tertiaries [T]                                             //
      ////////////////////////////////////////////////////////////////
      tertiary: {
        palette: () => palettes.get('tertiary'),
        tone: () => {
          const tone = colors.get('primary').tone;
          return Math.max(20, Math.min(80, tone));
        },
      },
      // tertiaryDim: {
      //   palette: () => palettes.get('tertiary'),
      //   tone: () => {
      //     if (c.variant.name === 'tonalSpot') {
      //       return tMaxC(palettes.get('tertiary'), 0, 90);
      //     } else {
      //       return tMaxC(palettes.get('tertiary'));
      //     }
      //   },
      //   isBackground: true,
      //   background: () => getColor('surfaceContainerHigh'),
      //   contrastCurve: () => getCurve(4.5),
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       getColor('tertiaryDim'),
      //       getColor('tertiary'),
      //       5,
      //       'darker',
      //       true,
      //       'farther',
      //     ),
      // },
      onTertiary: {
        palette: () => palettes.get('tertiary'),
        tone: () => getColor('tertiary').tone,
        adjustTone: onColor(
          () => getColor('tertiary'),
          () => getCurve(6),
        ),
      },
      tertiaryContainer: {
        palette: () => palettes.get('tertiary'),
        tone: () => {
          return tMaxC(palettes.get('tertiary'), 0, ctx.isDark ? 93 : 100);
        },
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            answer = applyToneDelta(
            answer,
            {
              relativeTo: colors.get('tertiary'),
              delta: 15,
              polarity: 'relative_lighter',
              constraint: 'farther',
            },
            context.isDark,
          );
            const curve = ctx.contrastLevel > 0 ? getCurve(1.5) : undefined;
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, colors), ratio, context.contrastLevel);
            }
            answer = avoidBackgroundGap(answer);
            return answer;
          },
      },
      onTertiaryContainer: {
        palette: () => palettes.get('tertiary'),
        tone: () => getColor('tertiaryContainer').tone,
        adjustTone: onColor(
          () => getColor('tertiaryContainer'),
          () => getCurve(6),
        ),
      },

      // tertiaryFixed: {
      //   palette: () => palettes.get('tertiary'),
      //   tone: () => {
      //     return c.temp(
      //       {
      //         isDark: false,
      //         contrastLevel: 0,
      //       },
      //       () => {
      //         const color = getColor('tertiaryContainer');
      //         return color.tone;
      //       },
      //     );
      //   },
      //   isBackground: true,
      //   background: () => highestSurface(c, colors),
      //   contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
      // },

      // tertiaryFixedDim: {
      //   palette: () => palettes.get('tertiary'),
      //   tone: () => getColor('tertiaryFixed').tone,
      //   isBackground: true,
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       getColor('tertiaryFixedDim'),
      //       getColor('tertiaryFixed'),
      //       5,
      //       'darker',
      //       true,
      //       'exact',
      //     ),
      // },

      // onTertiaryFixed: {
      //   palette: () => palettes.get('tertiary'),
      //   background: () => getColor('tertiaryFixedDim'),
      //   contrastCurve: () => getCurve(7),
      // },

      // onTertiaryFixedVariant: {
      //   palette: () => palettes.get('tertiary'),
      //   background: () => getColor('tertiaryFixedDim'),
      //   contrastCurve: () => getCurve(4.5),
      // },

      ////////////////////////////////////////////////////////////////
      // Errors [E]                                                 //
      ////////////////////////////////////////////////////////////////

      error: {

        palette: () => palettes.get('error'),

        tone: () => {
          return ctx.isDark
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

              answer = contrastAgainst(answer, highestSurface(ctx, colors), ratio, context.contrastLevel);

            }

            answer = avoidBackgroundGap(answer);

            return answer;

          },

      },
      // errorDim: {
      //   palette: () => palettes.get('error'),
      //   tone: () => tMinC(palettes.get('error')),
      //   isBackground: true,
      //   background: () => getColor('surfaceContainerHigh'),
      //   contrastCurve: () => getCurve(4.5),
      //   adjustTone: () =>
      //     toneDeltaPair(
      //       getColor('errorDim'),
      //       getColor('error'),
      //       5,
      //       'darker',
      //       true,
      //       'farther',
      //     ),
      // },
      onError: {
        palette: () => palettes.get('error'),
        tone: () => colors.get('error').tone,
        adjustTone: onColor(
          () => colors.get('error'),
          () => getCurve(6),
        ),
      },
      errorContainer: {
        palette: () => palettes.get('error'),
        tone: () => {
          return ctx.isDark
            ? tMinC(palettes.get('error'), 30, 93)
            : tMaxC(palettes.get('error'), 0, 90);
        },
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            const curve = ctx.contrastLevel > 0 ? getCurve(1.5) : undefined;
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, colors), ratio, context.contrastLevel);
              answer = avoidBackgroundGap(answer);
            }
            return answer;
          },
      },
      onErrorContainer: {
        palette: () => palettes.get('error'),
        tone: () => colors.get('errorContainer').tone,
        adjustTone: onColor(
          () => colors.get('errorContainer'),
          () => getCurve(4.5),
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
  },
});
