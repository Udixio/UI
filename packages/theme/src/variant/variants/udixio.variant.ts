import {
  type ColorRef,
  type ToneAdjuster,
  applyToneDelta,
  avoidBackgroundGap,
  backgroundGapTone,
  contrastAgainst,
  contrastTone,
  onColor,
} from '../../color/tone-adjusters';
import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import {
  calculateToneAdjustmentPercentage,
  capitalizeFirstLetter,
  Color,
  ColorApi,
  ColorManager,
  DynamicColorKey,
  getCurve,
  tMaxC,
  tMinC,
} from '../../color';
import type { ColorsConfig } from '../../color/color.types';
import { Contrast } from '@material/material-color-utilities';
import { Context } from '../../context';
import { API } from '../../API';

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

const clampTone = (tone: number) => Math.max(0, Math.min(100, tone));

/**
 * Computes a continuous distance from the mode edge for any surface layer.
 *
 * Dark surfaces separate quickly from black, then progress by three tones per
 * layer. Light surfaces use a four-tone first layer, two tones afterwards,
 * and gain one additional tone of depth beyond the highest container layer.
 */
const surfaceLayerDepth = (layer: number, isDark: boolean) => {
  const normalizedLayer = Math.max(0, layer);

  if (isDark) {
    return Math.min(normalizedLayer * 8, normalizedLayer * 3 + 3);
  }

  return (
    normalizedLayer * 2 +
    Math.min(normalizedLayer * 2, 2) +
    Math.max(0, normalizedLayer - 4)
  );
};

/** Keeps yellow surfaces perceptually lighter without changing the base scale. */
const yellowSurfaceLift = (layer: number) => {
  const normalizedLayer = Math.max(0, layer);
  return Math.min(normalizedLayer * 2, 2) + Math.max(0, normalizedLayer - 4);
};

/**
 * Maps a continuous surface layer to a tone. The base scale is independent of
 * hue; yellow only receives a light-mode perceptual lift.
 */
const surfaceContainerTone = (
  layer: number,
  api: Pick<API, 'palettes' | 'context'>,
) => {
  const { context } = api;
  let depth = surfaceLayerDepth(layer, context.isDark);

  if (!context.isDark && Color.isYellow(api.palettes.get('neutral').hue)) {
    depth -= yellowSurfaceLift(layer);
  }

  const contrastedDepth = depth * (1 + context.contrastLevel);
  return clampTone(context.isDark ? contrastedDepth : 100 - contrastedDepth);
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

/**
 * Pousse le ton vers le blanc ou le noir — selon le mode — jusqu'à atteindre un
 * contraste minimal avec une couleur de référence.
 *
 * Le seuil suit le niveau de contraste global : de 3:1 à 7:1 quand il monte de
 * 0 à 1, et il se relâche jusqu'à 0 dans les niveaux négatifs. C'est ce qui
 * distingue le variant `udixio` du contraste par courbe des variants standard.
 *
 * @param reference La couleur à contraster. Par défaut, la surface la plus
 *     haute du mode courant.
 */
export const minContrastTone =
  (reference?: ColorRef): ToneAdjuster =>
  ({ context, colors, tone }) => {
    const minContrast =
      context.contrastLevel >= 0
        ? normalize(context.contrastLevel, [0, 1], [3, 7])
        : normalize(context.contrastLevel, [-1, 0], [0, 3]);

    const referenceTone = reference
      ? resolveColorRef(reference, colors).tone
      : highestSurface(context, colors).tone;

    if (Contrast.ratioOfTones(referenceTone, tone) >= minContrast) {
      return tone;
    }
    const ratio = calculateToneAdjustmentPercentage(
      referenceTone,
      tone,
      minContrast,
    );
    const inverseT = context.isDark ? 100 : 0;
    return tone + (inverseT - tone) * ratio;
  };

/** `minContrastTone` n'a besoin que du registre, pas de l'API entière. */
const resolveColorRef = (reference: ColorRef, colors: ColorApi): Color => {
  if (typeof reference === 'string') return colors.get(reference);
  if (typeof reference === 'function') return reference();
  return reference;
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
    // const inverseColorKey = ('inverse' + ColorKey) as DynamicColorKey;
    // const colorFixedKey = (colorKey + 'Fixed') as DynamicColorKey;
    // const colorFixedDimKey = (colorKey + 'FixedDim') as DynamicColorKey;
    // const onColorFixedKey = ('on' + ColorKey + 'Fixed') as DynamicColorKey;
    // const onColorFixedVariantKey = ('on' +
    //   ColorKey +
    //   'FixedVariant') as DynamicColorKey;
    const colors: ColorsConfig = ({ palettes, colors, context: ctx }) => ({
      [colorKey]: Color.fromPalette(colorKey, {
        tone: () => {
          return colors.get('primary').tone;
          // return ctx.isDark ? 80 : tMaxC(palettes.get(colorKey));
        },
      }),
      // [colorDimKey]: {
      //   palette: colorKey,
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
      [onColorKey]: Color.fromPalette(colorKey, {
        adjustTone: onColor(colorKey, 6),
      }),
      [colorContainerKey]: Color.fromPalette(colorKey, {
        tone: () => {
          return ctx.isDark
            ? tMinC(palettes.get(colorKey), 35, 93)
            : tMaxC(palettes.get(colorKey), 0, 90);
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: colorKey,
            delta: 15,
            polarity: 'relativeLighter',
            constraint: 'farther',
          }),
          contrastAgainst(
            () => highestSurface(ctx, colors),
            () => (ctx.contrastLevel > 0 ? getCurve(1.5) : undefined),
          ),
          avoidBackgroundGap(),
        ],
      }),
      [onColorContainerKey]: Color.fromPalette(colorKey, {
        adjustTone: onColor(colorContainerKey, 6),
      }),
      // [colorFixedKey]: {
      //   palette: colorKey,
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
      //   palette: colorKey,
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
      //   palette: colorKey,
      //   background: () => this.get(colorFixedDimKey),
      //   contrastCurve: () => getCurve(7),
      // },
      // [onColorFixedVariantKey]: {
      //   palette: colorKey,
      //   background: () => colors.get(colorFixedDimKey),
      //   contrastCurve: () => getCurve(4.5),
      // },
    });

    return colors;
  },
  colors: ({ colors, context: ctx, palettes }) => {
    return {
      ////////////////////////////////////////////////////////////////
      // Surfaces [S]                                               //
      ////////////////////////////////////////////////////////////////
      surface: Color.fromPalette('neutral', {
        tone: () => surfaceContainerTone(0.5, { palettes, context: ctx }),
      }),
      surfaceDim: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          if (!ctx.isDark) {
            return 1.7;
          }
          return 1;
        },
        tone: () =>
          ctx.isDark
            ? surfaceContainerTone(0.5, { palettes, context: ctx })
            : surfaceContainerTone(5, { palettes, context: ctx }),
      }),
      surfaceBright: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          if (ctx.isDark) {
            return 1.7;
          }
          return 1;
        },
        tone: () =>
          ctx.isDark
            ? surfaceContainerTone(5, { palettes, context: ctx })
            : surfaceContainerTone(0.5, { palettes, context: ctx }),
      }),
      surfaceContainerLowest: Color.fromPalette('neutral', {
        tone: () => surfaceContainerTone(0, { palettes, context: ctx }),
      }),
      surfaceContainerLow: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.25;
        },
        tone: () => surfaceContainerTone(1, { palettes, context: ctx }),
      }),
      surfaceContainer: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.4;
        },
        tone: () => surfaceContainerTone(2, { palettes, context: ctx }),
      }),
      surfaceContainerHigh: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.5;
        },
        tone: () => surfaceContainerTone(3, { palettes, context: ctx }),
      }),
      surfaceContainerHighest: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.7;
        },
        tone: () => surfaceContainerTone(4, { palettes, context: ctx }),
      }),
      onSurface: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.7;
        },
        tone: () => {
          return highestSurface(ctx, colors).tone;
        },
        adjustTone: contrastAgainst(
          () => highestSurface(ctx, colors),
          () => (ctx.isDark ? getCurve(11) : getCurve(9)),
        ),
      }),
      onSurfaceVariant: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.7;
        },
        adjustTone: onColor(
          () => highestSurface(ctx, colors),
          () => (ctx.isDark ? getCurve(6) : getCurve(4.5)),
        ),
      }),
      outline: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.7;
        },
        adjustTone: onColor(() => highestSurface(ctx, colors), 3),
      }),
      outlineVariant: Color.fromPalette('neutral', {
        chromaMultiplier: () => {
          return 1.7;
        },
        adjustTone: onColor(() => highestSurface(ctx, colors), 1.5),
      }),
      inverseSurface: Color.fromPalette('neutral', {
        tone: () => 100 - colors.get('surface').tone,
      }),
      inverseOnSurface: Color.fromPalette('neutral', {
        tone: () => (ctx.isDark ? 20 : 95),
        adjustTone: contrastAgainst('inverseSurface', 7),
      }),
      ////////////////////////////////////////////////////////////////
      // Primaries [P]                                              //
      ////////////////////////////////////////////////////////////////
      primary: Color.fromPalette('primary', {
        tone: () => {
          return ctx.sourceColor.tone;
        },
        adjustTone: minContrastTone(),
      }),
      // primaryDim: {
      //   palette: 'primary',
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
      onPrimary: Color.fromPalette('primary', {
        adjustTone: onColor('primary', 6),
      }),
      primaryContainer: Color.fromPalette('primary', {
        tone: () => {
          return ctx.isDark
            ? tMinC(palettes.get('primary'), 35, 93)
            : tMaxC(palettes.get('primary'), 0, 90);
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: 'primary',
            delta: 15,
            polarity: 'relativeLighter',
            constraint: 'farther',
          }),
          contrastAgainst(
            () => highestSurface(ctx, colors),
            () => (ctx.contrastLevel > 0 ? getCurve(1.5) : undefined),
          ),
          avoidBackgroundGap(),
        ],
      }),
      onPrimaryContainer: Color.fromPalette('primary', {
        adjustTone: onColor('primaryContainer', 6),
      }),

      // primaryFixed: {
      //   palette: 'primary',
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
      //   palette: 'primary',
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
      //   palette: 'primary',
      //   background: () => colors.get('primaryFixedDim'),
      //   contrastCurve: () => getCurve(7),
      // },

      // onPrimaryFixedVariant: {
      //   palette: 'primary',
      //   background: () => colors.get('primaryFixedDim'),
      //   contrastCurve: () => getCurve(4.5),
      // },

      inversePrimary: Color.fromPalette('primary', {
        tone: () => tMaxC(palettes.get('primary')),

        adjustTone: contrastAgainst('inverseSurface', 6),
      }),
      ////////////////////////////////////////////////////////////////
      // Secondaries [Q]                                            //
      ////////////////////////////////////////////////////////////////
      secondary: Color.fromPalette('secondary', {
        tone: () => {
          return colors.get('primary').tone;
        },
      }),
      // secondaryDim: {
      //   palette: 'secondary',
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
      onSecondary: Color.fromPalette('secondary', {
        adjustTone: onColor('secondary', 6),
      }),
      secondaryContainer: Color.fromPalette('secondary', {
        tone: () => {
          return ctx.isDark
            ? tMinC(palettes.get('secondary'), 35, 93)
            : tMaxC(palettes.get('secondary'), 0, 90);
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: 'secondary',
            delta: 15,
            polarity: 'relativeLighter',
            constraint: 'farther',
          }),
          contrastAgainst(
            () => highestSurface(ctx, colors),
            () => (ctx.contrastLevel > 0 ? getCurve(1.5) : undefined),
          ),
          avoidBackgroundGap(),
        ],
      }),
      onSecondaryContainer: Color.fromPalette('secondary', {
        adjustTone: onColor('secondaryContainer', 6),
      }),

      // secondaryFixed: {
      //   palette: 'secondary',
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
      //   palette: 'secondary',
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
      //   palette: 'secondary',
      //   background: () => getColor('secondaryFixedDim'),
      //   contrastCurve: () => getCurve(7),
      // },

      // onSecondaryFixedVariant: {
      //   palette: 'secondary',
      //   background: () => getColor('secondaryFixedDim'),
      //   contrastCurve: () => getCurve(4.5),
      // },

      ////////////////////////////////////////////////////////////////
      // Tertiaries [T]                                             //
      ////////////////////////////////////////////////////////////////
      tertiary: Color.fromPalette('tertiary', {
        tone: () => {
          const tone = colors.get('primary').tone;
          return Math.max(20, Math.min(80, tone));
        },
      }),
      // tertiaryDim: {
      //   palette: 'tertiary',
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
      onTertiary: Color.fromPalette('tertiary', {
        adjustTone: onColor('tertiary', 6),
      }),
      tertiaryContainer: Color.fromPalette('tertiary', {
        tone: () => {
          return tMaxC(palettes.get('tertiary'), 0, ctx.isDark ? 93 : 100);
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: 'tertiary',
            delta: 15,
            polarity: 'relativeLighter',
            constraint: 'farther',
          }),
          contrastAgainst(
            () => highestSurface(ctx, colors),
            () => (ctx.contrastLevel > 0 ? getCurve(1.5) : undefined),
          ),
          avoidBackgroundGap(),
        ],
      }),
      onTertiaryContainer: Color.fromPalette('tertiary', {
        adjustTone: onColor('tertiaryContainer', 6),
      }),

      // tertiaryFixed: {
      //   palette: 'tertiary',
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
      //   palette: 'tertiary',
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
      //   palette: 'tertiary',
      //   background: () => getColor('tertiaryFixedDim'),
      //   contrastCurve: () => getCurve(7),
      // },

      // onTertiaryFixedVariant: {
      //   palette: 'tertiary',
      //   background: () => getColor('tertiaryFixedDim'),
      //   contrastCurve: () => getCurve(4.5),
      // },

      ////////////////////////////////////////////////////////////////
      // Errors [E]                                                 //
      ////////////////////////////////////////////////////////////////

      error: Color.fromPalette('error', {
        tone: () => {
          return ctx.isDark
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

          contrastAgainst(() => highestSurface(ctx, colors), 4.5),

          avoidBackgroundGap(),
        ],
      }),
      // errorDim: {
      //   palette: 'error',
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
      onError: Color.fromPalette('error', {
        adjustTone: onColor('error', 6),
      }),
      errorContainer: Color.fromPalette('error', {
        tone: () => {
          return ctx.isDark
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
                  () => highestSurface(ctx, colors),
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
  },
});
