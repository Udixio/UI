import { Color, ColorOptions } from './color';
import { ColorManager } from './color.manager';
import { DynamicColorKey, getCurve, tMaxC, tMinC } from './color.utils';
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
        palette: () => palettes.get(colorKey),
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
        isBackground: true,
        background: () => highestSurface(ctx, this),
        contrastCurve: () => getCurve(4.5),
        adjustTone: () => ({
          roleA: colors.get(colorContainerKey),
          roleB: colors.get(colorKey),
          delta: 5,
          polarity: 'relative_lighter',
          constraint: 'farther',
        }),
      },
      [colorDimKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => {
          if (ctx.variant.name === 'neutral') {
            return 85;
          } else {
            return tMaxC(palettes.get(colorKey), 0, 90);
          }
        },
        isBackground: true,
        background: () => this.get('surfaceContainerHigh'),
        contrastCurve: () => getCurve(4.5),
        adjustTone: () => ({
          roleA: this.get(colorDimKey),
          roleB: this.get(colorKey),
          delta: 5,
          polarity: 'darker',
          constraint: 'farther',
        }),
      },
      [onColorKey]: {
        palette: () => palettes.get(colorKey),
        background: () => this.get(colorKey),
        contrastCurve: () => getCurve(6),
      },
      [colorContainerKey]: {
        palette: () => palettes.get(colorKey),
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
        isBackground: true,
        background: () => highestSurface(ctx, this),
        adjustTone: () => undefined,
        contrastCurve: () =>
          ctx.contrastLevel > 0 ? getCurve(1.5) : undefined,
      },
      [onColorContainerKey]: {
        palette: () => palettes.get(colorKey),
        background: () => this.get(colorContainerKey),
        contrastCurve: () => getCurve(6),
      },
      [colorFixedKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => {
          return ctx.temp({ isDark: false, contrastLevel: 0 }, () => {
            const color = this.get(colorContainerKey);
            return color.tone;
          });
        },
        isBackground: true,
        background: () => highestSurface(ctx, this),
        contrastCurve: () =>
          ctx.contrastLevel > 0 ? getCurve(1.5) : undefined,
      },
      [colorFixedDimKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => this.get(colorFixedKey).tone,
        isBackground: true,
        // Les couleurs accent fixed-dim ne doivent pas être écartées de la zone médiane.
        clampTone: false,
        adjustTone: () => ({
          roleA: this.get(colorFixedDimKey),
          roleB: this.get(colorFixedKey),
          delta: 5,
          polarity: 'darker',
          constraint: 'exact',
        }),
      },
      [onColorFixedKey]: {
        palette: () => palettes.get(colorKey),
        background: () => this.get(colorFixedDimKey),
        contrastCurve: () => getCurve(7),
      },
      [onColorFixedVariantKey]: {
        palette: () => palettes.get(colorKey),
        background: () => this.get(colorFixedDimKey),
        contrastCurve: () => getCurve(4.5),
      },
    });

    this.addColors(colors);
  }
}
