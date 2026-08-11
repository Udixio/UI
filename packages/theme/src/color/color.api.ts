import {
  applyToneDelta,
  avoidBackgroundGap,
  contrastAgainst,
} from './tone-adjusters';
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
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            answer = applyToneDelta(
            answer,
            {
              relativeTo: colors.get(colorContainerKey),
              delta: 5,
              polarity: 'relative_darker',
              constraint: 'farther',
            },
            context.isDark,
          );
            const curve = getCurve(4.5);
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, this), ratio, context.contrastLevel);
            }
            answer = avoidBackgroundGap(answer);
            return answer;
          },
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
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            answer = applyToneDelta(
            answer,
            {
              relativeTo: this.get(colorDimKey),
              delta: 5,
              polarity: 'lighter',
              constraint: 'farther',
            },
            context.isDark,
          );
            const curve = getCurve(4.5);
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, this.get('surfaceContainerHigh'), ratio, context.contrastLevel);
            }
            answer = avoidBackgroundGap(answer);
            return answer;
          },
      },
      [onColorKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => this.get(colorKey).tone,
        adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          this.get(colorKey),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
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
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            const curve = ctx.contrastLevel > 0 ? getCurve(1.5) : undefined;
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, this), ratio, context.contrastLevel);
              answer = avoidBackgroundGap(answer);
            }
            return answer;
          },
      },
      [onColorContainerKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => this.get(colorContainerKey).tone,
        adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          this.get(colorContainerKey),
          getCurve(6).get(context.contrastLevel),
          context.contrastLevel,
        ),
      },
      [colorFixedKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => {
          return ctx.temp({ isDark: false, contrastLevel: 0 }, () => {
            const color = this.get(colorContainerKey);
            return color.tone;
          });
        },
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            const curve = ctx.contrastLevel > 0 ? getCurve(1.5) : undefined;
            if (curve) {
              const ratio = curve.get(context.contrastLevel);
              answer = contrastAgainst(answer, highestSurface(ctx, this), ratio, context.contrastLevel);
              answer = avoidBackgroundGap(answer);
            }
            return answer;
          },
      },
      [colorFixedDimKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => this.get(colorFixedKey).tone,
        adjustTone: ({ context, tone }) => {
            let answer = tone;
            answer = applyToneDelta(
            answer,
            {
              relativeTo: this.get(colorFixedDimKey),
              delta: 5,
              polarity: 'lighter',
              constraint: 'exact',
            },
            context.isDark,
          );
            return answer;
          },
      },
      [onColorFixedKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => this.get(colorFixedDimKey).tone,
        adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          this.get(colorFixedDimKey),
          getCurve(7).get(context.contrastLevel),
          context.contrastLevel,
        ),
      },
      [onColorFixedVariantKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => this.get(colorFixedDimKey).tone,
        adjustTone: ({ context, tone }) =>
        contrastAgainst(
          tone,
          this.get(colorFixedDimKey),
          getCurve(4.5).get(context.contrastLevel),
          context.contrastLevel,
        ),
      },
    });

    this.addColors(colors);
  }
}
