import {
  applyToneDelta,
  avoidBackgroundGap,
  backgroundGapTone,
  contrastAgainst,
  contrastTone,
  onColor,
} from './tone-adjusters';
import { Color, ColorOptions } from './color';
import { ColorManager } from './color.manager';
import { DynamicColorKey, tMaxC, tMinC } from './color.utils';
import { API } from '../API';

import { Context } from 'src/context';
import { highestSurface } from './default-color';

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export type AddColorsOptions =
  | ((args: API) => Record<string, ColorOptions>)
  | Record<string, ColorOptions>;

export class ColorApi {
  private readonly colorManager: ColorManager;
  private readonly context: Context;
  public api?: API;

  constructor({
    colorManager,
    context,
  }: {
    colorManager: ColorManager;
    context: Context;
  }) {
    this.context = context;
    this.colorManager = colorManager;

    this.context.onUpdate((changed) => {
      if (changed.includes('variant')) {
        this.colorManager.clear();
        this.addColors(this.context.variant.colors);
      }
    });
  }

  getAll() {
    return this.colorManager.getAll();
  }

  addColor(key: string, color: ColorOptions): Color {
    return this.colorManager.createOrUpdate(key, color);
  }

  addColors(args: AddColorsOptions) {
    if (!this.api)
      throw new Error(
        'The API is not initialized. Please call bootstrap() before calling addColors().',
      );

    if (typeof args === 'function') {
      args = args(this.api);
    }
    if (args) {
      Object.entries(args).forEach(([name, colorOption]) => {
        this.addColor(name, colorOption);
      });
    }
  }

  get(key: DynamicColorKey | string): Color {
    return this.colorManager.get(key);
  }

  remove(key: string): boolean {
    return this.colorManager.remove(key);
  }

  update(key: string, newColor: ColorOptions): Color {
    return this.colorManager.createOrUpdate(key, newColor);
  }

  addFromCustomPalette(key: string): void {
    if (this.context.variant.colorsFromCustomPalette) {
      return this.addColors(this.context.variant.colorsFromCustomPalette(key));
    }

    const colorKey = key as DynamicColorKey;
    const colorDimKey = (colorKey + 'Dim') as DynamicColorKey;
    const ColorKey = capitalizeFirstLetter(key);
    const onColorKey = ('on' + ColorKey) as DynamicColorKey;
    const colorContainerKey = (colorKey + 'Container') as DynamicColorKey;
    const onColorContainerKey = ('on' +
      ColorKey +
      'Container') as DynamicColorKey;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const inverseColorKey = ('inverse' + ColorKey) as DynamicColorKey;
    const colorFixedKey = (colorKey + 'Fixed') as DynamicColorKey;
    const colorFixedDimKey = (colorKey + 'FixedDim') as DynamicColorKey;
    const onColorFixedKey = ('on' + ColorKey + 'Fixed') as DynamicColorKey;
    const onColorFixedVariantKey = ('on' +
      ColorKey +
      'FixedVariant') as DynamicColorKey;
    const colors: AddColorsOptions = ({ palettes, colors, context: ctx }) => ({
      [colorKey]: {
        palette: colorKey,
        tone: () => {
          if (ctx.variant.name === 'neutral') {
            return ctx.isDark
              ? tMinC(palettes.get(colorKey), 0, 98)
              : tMaxC(palettes.get(colorKey));
          } else if (ctx.variant.name === 'vibrant') {
            return tMaxC(palettes.get(colorKey), 0, ctx.isDark ? 90 : 98);
          } else {
            return ctx.isDark ? 80 : tMaxC(palettes.get(colorKey));
          }
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: colorContainerKey,
            delta: 5,
            polarity: 'relativeDarker',
            constraint: 'farther',
          }),
          contrastAgainst(
            (api) => highestSurface(api.context, api.colors),
            4.5,
          ),
          avoidBackgroundGap(),
        ],
      },
      [colorDimKey]: {
        palette: colorKey,
        tone: () => {
          if (ctx.variant.name === 'neutral') {
            return 85;
          } else {
            return tMaxC(palettes.get(colorKey), 0, 90);
          }
        },
        adjustTone: [
          applyToneDelta({
            relativeTo: colorDimKey,
            delta: 5,
            polarity: 'lighter',
            constraint: 'farther',
          }),
          contrastAgainst('surfaceContainerHigh', 4.5),
          avoidBackgroundGap(),
        ],
      },
      [onColorKey]: {
        palette: colorKey,
        adjustTone: onColor(colorKey, 6),
      },
      [colorContainerKey]: {
        palette: colorKey,
        tone: () => {
          if (ctx.variant.name === 'vibrant') {
            return ctx.isDark
              ? tMinC(palettes.get(colorKey), 30, 40)
              : tMaxC(palettes.get(colorKey), 84, 90);
          } else if (ctx.variant.name === 'expressive') {
            return ctx.isDark ? 15 : tMaxC(palettes.get(colorKey), 90, 95);
          } else {
            return ctx.isDark ? 25 : 90;
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
      [onColorContainerKey]: {
        palette: colorKey,
        adjustTone: onColor(colorContainerKey, 6),
      },
      [colorFixedKey]: {
        palette: colorKey,
        tone: () => {
          return ctx.temp({ isDark: false, contrastLevel: 0 }, () => {
            const color = this.get(colorContainerKey);
            return color.tone;
          });
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
      [colorFixedDimKey]: {
        palette: colorKey,
        tone: () => this.get(colorFixedKey).tone,
        adjustTone: applyToneDelta({
          relativeTo: colorFixedDimKey,
          delta: 5,
          polarity: 'lighter',
          constraint: 'exact',
        }),
      },
      [onColorFixedKey]: {
        palette: colorKey,
        adjustTone: onColor(colorFixedDimKey, 7),
      },
      [onColorFixedVariantKey]: {
        palette: colorKey,
        adjustTone: onColor(colorFixedDimKey, 4.5),
      },
    });

    this.addColors(colors);
  }
}
