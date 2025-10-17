import { getPiecewiseHue, getRotatedHue, variant, Variant } from '../variant';
import {
  calculateToneAdjustmentPercentage,
  DynamicColorKey,
  getCurve,
  tMaxC,
  tMinC,
} from '../../color/color.utils';
import { Hct } from '../../material-color-utilities/htc';
import {
  Color,
  ColorApi,
  ColorFromPalette,
  ColorManager,
  getInitialToneFromBackground,
} from '../../color';
import { Contrast } from '@material/material-color-utilities';
import { toneDeltaPair } from '../../material-color-utilities';
import { Context } from '../../context';
import { API } from '../../API';

const surfaceContainerToneDelta = 2.5;

const inverseTone = (tone: number) => {
  return 100 - tone;
};

const surfaceContainerTone = (
  layer: number,
  api: Pick<API, 'palettes' | 'context'>,
) => {
  const t = surfaceContainerToneDelta * layer * (1 + api.context.contrastLevel);
  if (api.context.isDark) {
    return t * 1.5;
  } else {
    if (Hct.isYellow(api.palettes.get('neutral').hue)) {
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
    return colorService.get('surface');
  } else {
    return colorService.get('surface');
  }
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
      chroma: sourceColor.chroma / 1.4,
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
      const maxChroma = Color.maxChroma(sourceColor.hue);
      return {
        hue: sourceColor.hue,
        chroma: maxChroma * 0.05,
      };
    },
    neutralVariant: ({ sourceColor }) => {
      const neutral = Color.maxChroma(sourceColor.hue) * 0.05;
      return {
        hue: sourceColor.hue,
        chroma: neutral * 1.7,
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
  colors: ({ colors, context: c, palettes }) => {
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
            return 2;
          } else {
            return 99;
          }
        },
        isBackground: true,
      },
      // surfaceDim: {
      //   palette: () => palettes.get('neutral'),
      //   tone: () => {
      //     if (c.isDark) {
      //       return 4;
      //     } else {
      //       if (Hct.isYellow(palettes.get('neutral').hue)) {
      //         return 90;
      //       } else if (c.variant.name === 'vibrant') {
      //         return 85;
      //       } else {
      //         return 87;
      //       }
      //     }
      //   },
      //   isBackground: true,
      //   chromaMultiplier: () => {
      //     if (!c.isDark) {
      //       if (c.variant.name === 'neutral') {
      //         return 2.5;
      //       } else if (c.variant.name === 'tonalSpot') {
      //         return 1.7;
      //       } else if (c.variant.name === 'expressive') {
      //         return Hct.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
      //       } else if (c.variant.name === 'vibrant') {
      //         return 1.36;
      //       }
      //     }
      //     return 1;
      //   },
      // },
      // surfaceBright: {
      //   palette: () => palettes.get('neutral'),
      //   tone: () => {
      //     if (c.isDark) {
      //       return 18;
      //     } else {
      //       if (Hct.isYellow(palettes.get('neutral').hue)) {
      //         return 99;
      //       } else if (c.variant.name === 'vibrant') {
      //         return 97;
      //       } else {
      //         return 98;
      //       }
      //     }
      //   },
      //   isBackground: true,
      //   chromaMultiplier: () => {
      //     if (c.isDark) {
      //       if (c.variant.name === 'neutral') {
      //         return 2.5;
      //       } else if (c.variant.name === 'tonalSpot') {
      //         return 1.7;
      //       } else if (c.variant.name === 'expressive') {
      //         return Hct.isYellow(palettes.get('neutral').hue) ? 2.7 : 1.75;
      //       } else if (c.variant.name === 'vibrant') {
      //         return 1.36;
      //       }
      //     }
      //     return 1;
      //   },
      // },
      surfaceContainerLowest: {
        palette: () => palettes.get('neutral'),
        tone: () => surfaceContainerTone(0, { palettes, context: c }),
        isBackground: true,
      },
      surfaceContainerLow: {
        palette: () => palettes.get('neutral'),
        tone: () => surfaceContainerTone(1, { palettes, context: c }),
        isBackground: true,
        chromaMultiplier: () => {
          return 1.25;
        },
      },
      surfaceContainer: {
        palette: () => palettes.get('neutral'),
        tone: () => surfaceContainerTone(2, { palettes, context: c }),
        isBackground: true,
        chromaMultiplier: () => {
          return 1.4;
        },
      },
      surfaceContainerHigh: {
        palette: () => palettes.get('neutral'),
        tone: () => surfaceContainerTone(3, { palettes, context: c }),
        isBackground: true,
        chromaMultiplier: () => {
          return 1.5;
        },
      },
      surfaceContainerHighest: {
        palette: () => palettes.get('neutral'),
        tone: () => surfaceContainerTone(4, { palettes, context: c }),
        isBackground: true,
        chromaMultiplier: () => {
          return 1.7;
        },
      },
      onSurface: {
        palette: () => palettes.get('neutral'),
        tone: () => {
          return getInitialToneFromBackground(highestSurface(c, colors));
        },
        chromaMultiplier: () => {
          return 1.7;
        },
        background: () => highestSurface(c, colors),
        contrastCurve: () => (c.isDark ? getCurve(11) : getCurve(9)),
      },
      onSurfaceVariant: {
        palette: () => palettes.get('neutralVariant'),
        chromaMultiplier: () => {
          return 1.7;
        },
        background: () => highestSurface(c, colors),
        contrastCurve: () => (c.isDark ? getCurve(6) : getCurve(4.5)),
      },
      outline: {
        palette: () => palettes.get('neutralVariant'),
        chromaMultiplier: () => {
          return 1.7;
        },
        background: () => highestSurface(c, colors),
        contrastCurve: () => getCurve(3),
      },
      outlineVariant: {
        palette: () => palettes.get('neutralVariant'),
        chromaMultiplier: () => {
          return 1.7;
        },
        background: () => highestSurface(c, colors),
        contrastCurve: () => getCurve(1.5),
      },
      inverseSurface: {
        palette: () => palettes.get('neutral'),
        tone: () => 100 - colors.get('surface').getTone(),
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
          return c.sourceColor.tone;
        },
        isBackground: true,
        background: () => highestSurface(c, colors),
        contrastCurve: () => getCurve(4.5),
        adjustTone: () => () => {
          const surfaceTone = colors.get('surface').getTone();
          const primaryTone = (colors.get('primary') as ColorFromPalette)
            .options.tone;
          let selfTone = primaryTone;
          if (Contrast.ratioOfTones(surfaceTone, selfTone) < 3) {
            const ratio = calculateToneAdjustmentPercentage(
              surfaceTone,
              selfTone,
              3,
            );
            const inverseT = inverseTone(primaryTone);
            selfTone = selfTone + (inverseT - selfTone) * ratio;
          }
          return selfTone;
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
        background: () => colors.get('primary'),
        contrastCurve: () => getCurve(6),
      },
      primaryContainer: {
        palette: () => palettes.get('primary'),
        tone: () => {
          return c.isDark
            ? tMinC(palettes.get('primary'), 35, 93)
            : tMaxC(palettes.get('primary'), 0, 90);
        },
        isBackground: true,
        background: () => highestSurface(c, colors),
        adjustTone: () =>
          c.variant.name == 'fidelity'
            ? toneDeltaPair(
                colors.get('primary'),
                colors.get('primaryContainer'),
                15,
                'relative_darker',
                true,
                'farther',
              )
            : undefined,
        contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
      },
      onPrimaryContainer: {
        palette: () => palettes.get('primary'),
        background: () => colors.get('primaryContainer'),
        contrastCurve: () => getCurve(6),
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
      //         return color.getTone();
      //       },
      //     );
      //   },
      //   isBackground: true,
      //   background: () => highestSurface(c, colors),
      //   contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
      // },

      // primaryFixedDim: {
      //   palette: () => palettes.get('primary'),
      //   tone: () => colors.get('primaryFixed').getTone(),
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
        background: () => colors.get('inverseSurface'),
        contrastCurve: () => getCurve(6),
      },
      ////////////////////////////////////////////////////////////////
      // Secondaries [Q]                                            //
      ////////////////////////////////////////////////////////////////
      secondary: {
        palette: () => palettes.get('secondary'),
        tone: () => {
          return c.isDark ? 80 : tMaxC(palettes.get('secondary'));
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
        background: () => getColor('secondary'),
        contrastCurve: () => getCurve(6),
      },
      secondaryContainer: {
        palette: () => palettes.get('secondary'),
        tone: () => {
          return c.isDark ? 25 : 90;
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
      //         return color.getTone();
      //       },
      //     );
      //   },
      //   isBackground: true,
      //   background: () => highestSurface(c, colors),
      //   contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
      // },

      // secondaryFixedDim: {
      //   palette: () => palettes.get('secondary'),
      //   tone: () => getColor('secondaryFixed').getTone(),
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
          return c.isDark
            ? tMaxC(palettes.get('tertiary'), 0, 98)
            : tMaxC(palettes.get('tertiary'));
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
        background: () => getColor('tertiary'),
        contrastCurve: () => getCurve(6),
      },
      tertiaryContainer: {
        palette: () => palettes.get('tertiary'),
        tone: () => {
          return tMaxC(palettes.get('tertiary'), 0, c.isDark ? 93 : 100);
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
      //         return color.getTone();
      //       },
      //     );
      //   },
      //   isBackground: true,
      //   background: () => highestSurface(c, colors),
      //   contrastCurve: () => (c.contrastLevel > 0 ? getCurve(1.5) : undefined),
      // },

      // tertiaryFixedDim: {
      //   palette: () => palettes.get('tertiary'),
      //   tone: () => getColor('tertiaryFixed').getTone(),
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
  },
});
