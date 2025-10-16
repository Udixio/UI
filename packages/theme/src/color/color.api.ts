import { Color, ColorOptions } from './color';
import { ColorManager, highestSurface } from './color.manager';
import { DynamicColorKey, getCurve, tMaxC, tMinC } from './color.utils';
import { API } from '../API';
import { toneDeltaPair } from '../material-color-utilities';
import { Context } from 'src/context';

function capitalizeFirstLetter(string: string) {
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
        adjustTone: () =>
          toneDeltaPair(
            colors.get(colorContainerKey),
            colors.get(colorKey),
            5,
            'relative_lighter',
            true,
            'farther',
          ),
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
        adjustTone: () =>
          toneDeltaPair(
            this.get(colorDimKey),
            this.get(colorKey),
            5,
            'darker',
            true,
            'farther',
          ),
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
            return color.getTone();
          });
        },
        isBackground: true,
        background: () => highestSurface(ctx, this),
        contrastCurve: () =>
          ctx.contrastLevel > 0 ? getCurve(1.5) : undefined,
      },
      [colorFixedDimKey]: {
        palette: () => palettes.get(colorKey),
        tone: () => this.get(colorFixedKey).getTone(),
        isBackground: true,
        adjustTone: () =>
          toneDeltaPair(
            this.get(colorFixedDimKey),
            this.get(colorFixedKey),
            5,
            'darker',
            true,
            'exact',
          ),
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
