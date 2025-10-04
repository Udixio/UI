import {
  Color,
  ColorAlias,
  ColorFromHex,
  ColorFromPalette,
  ColorOptions,
} from './color';
import { ColorApi } from './color.api';
import { Context } from '../context';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const highestSurface = (
  context: Context,
  colorService: ColorManager | ColorApi,
): Color => {
  if (colorService instanceof ColorApi) {
    return context.isDark
      ? colorService.getColor('surfaceBright')
      : colorService.getColor('surfaceDim');
  } else {
    return context.isDark
      ? colorService.get('surfaceBright')
      : colorService.get('surfaceDim');
  }
};

export class ColorManager {
  private colorMap = new Map<string, Color>();
  private readonly context: Context;

  constructor({ context }: { context: Context }) {
    this.context = context;
  }

  createOrUpdate(key: string, args: ColorOptions): Color {
    let colorEntity = this.colorMap.get(key);
    if ('alias' in args) {
      colorEntity = new ColorAlias(key, args.alias, this);
    } else if ('hex' in args) {
      colorEntity = new ColorFromHex(key, args.hex);
    } else {
      try {
        if (colorEntity instanceof ColorFromPalette) {
          colorEntity.update(args);
        } else {
          colorEntity = new ColorFromPalette(key, args, this.context);
        }
      } catch (e) {
        console.error(e);
        throw new Error(`Invalid color options provided for ${key}`);
      }
    }
    this.colorMap.set(key, colorEntity);
    return colorEntity;
  }

  public remove(key: string) {
    return this.colorMap.delete(key);
  }

  public get(key: string): Color {
    const colorEntity = this.colorMap.get(key);
    if (colorEntity) {
      return colorEntity;
    } else {
      throw new Error(`Color ${key} does not exist`);
    }
  }

  public getAll(): ReadonlyMap<string, Color> {
    return this.colorMap;
  }

  // addFromPalette(key: string): void {
  //   const colorKey = key as DynamicColorKey;
  //   const colorDimKey = (colorKey + 'Dim') as DynamicColorKey;
  //   const ColorKey = capitalizeFirstLetter(key);
  //   const onColorKey = ('on' + ColorKey) as DynamicColorKey;
  //   const colorContainerKey = (colorKey + 'Container') as DynamicColorKey;
  //   const onColorContainerKey = ('on' +
  //     ColorKey +
  //     'Container') as DynamicColorKey;
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-expect-error
  //   const inverseColorKey = ('inverse' + ColorKey) as DynamicColorKey;
  //   const colorFixedKey = (colorKey + 'Fixed') as DynamicColorKey;
  //   const colorFixedDimKey = (colorKey + 'FixedDim') as DynamicColorKey;
  //   const onColorFixedKey = ('on' + ColorKey + 'Fixed') as DynamicColorKey;
  //   const onColorFixedVariantKey = ('on' +
  //     ColorKey +
  //     'FixedVariant') as DynamicColorKey;
  //
  //   const c = this.context;
  //
  //   this.createOrUpdate(colorKey, {
  //     palette: () => s.getPalette(colorKey),
  //     tone: () => {
  //       if (s.variant === 'neutral') {
  //         return s.isDark
  //           ? tMinC(s.getPalette(colorKey), 0, 98)
  //           : tMaxC(s.getPalette(colorKey));
  //       } else if (s.variant === 'vibrant') {
  //         return tMaxC(s.getPalette(colorKey), 0, s.isDark ? 90 : 98);
  //       } else {
  //         return s.isDark ? 80 : tMaxC(s.getPalette(colorKey));
  //       }
  //     },
  //     isBackground: true,
  //     background: () => highestSurface(s, this),
  //     contrastCurve: () => getCurve(4.5),
  //     adjustTone: () =>
  //       toneDeltaPair(
  //         this.get(colorContainerKey),
  //         this.get(colorKey),
  //         5,
  //         'relative_lighter',
  //         true,
  //         'farther',
  //       ),
  //   });
  //   this.createOrUpdate(colorDimKey, {
  //     palette: () => s.getPalette(colorKey),
  //     tone: () => {
  //       if (s.variant === 'neutral') {
  //         return 85;
  //       } else {
  //         return tMaxC(s.getPalette(colorKey), 0, 90);
  //       }
  //     },
  //     isBackground: true,
  //     background: () => this.get('surfaceContainerHigh'),
  //     contrastCurve: () => getCurve(4.5),
  //     adjustTone: () =>
  //       toneDeltaPair(
  //         this.get(colorDimKey),
  //         this.get(colorKey),
  //         5,
  //         'darker',
  //         true,
  //         'farther',
  //       ),
  //   });
  //   this.createOrUpdate(onColorKey, {
  //     palette: () => s.getPalette(colorKey),
  //     background: () => this.get(colorKey),
  //     contrastCurve: () => getCurve(6),
  //   });
  //   this.createOrUpdate(colorContainerKey, {
  //     palette: () => s.getPalette(colorKey),
  //     tone: () => {
  //       if (s.variant === 'vibrant') {
  //         return s.isDark
  //           ? tMinC(s.getPalette(colorKey), 30, 40)
  //           : tMaxC(s.getPalette(colorKey), 84, 90);
  //       } else if (s.variant === 'expressive') {
  //         return s.isDark ? 15 : tMaxC(s.getPalette(colorKey), 90, 95);
  //       } else {
  //         return s.isDark ? 25 : 90;
  //       }
  //     },
  //     isBackground: true,
  //     background: () => highestSurface(s, this),
  //     adjustTone: () => undefined,
  //     contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
  //   });
  //   this.createOrUpdate(onColorContainerKey, {
  //     palette: () => s.getPalette(colorKey),
  //     background: () => this.get(colorContainerKey),
  //     contrastCurve: () => getCurve(6),
  //   });
  //   this.createOrUpdate(colorFixedKey, {
  //     palette: () => s.getPalette(colorKey),
  //     tone: () => {
  //       const tempS = Object.assign({}, s, { isDark: false, contrastLevel: 0 });
  //
  //       const color = this.get(colorContainerKey);
  //       if (color instanceof ColorFromPalette) {
  //         return color.getTone(tempS);
  //       } else {
  //         throw new Error(
  //           'Primary container color must be an instance of ColorFromPalette',
  //         );
  //       }
  //     },
  //     isBackground: true,
  //     background: () => highestSurface(s, this),
  //     contrastCurve: () => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
  //   });
  //   this.createOrUpdate(colorFixedDimKey, {
  //     palette: () => s.getPalette(colorKey),
  //     tone: () => this.get(colorFixedKey).getTone(),
  //     isBackground: true,
  //     adjustTone: () =>
  //       toneDeltaPair(
  //         this.get(colorFixedDimKey),
  //         this.get(colorFixedKey),
  //         5,
  //         'darker',
  //         true,
  //         'exact',
  //       ),
  //   });
  //   this.createOrUpdate(onColorFixedKey, {
  //     palette: () => s.getPalette(colorKey),
  //     background: () => this.get(colorFixedDimKey),
  //     contrastCurve: () => getCurve(7),
  //   });
  //   this.createOrUpdate(onColorFixedVariantKey, {
  //     palette: () => s.getPalette(colorKey),
  //     background: () => this.get(colorFixedDimKey),
  //     contrastCurve: () => getCurve(4.5),
  //   });
  // }
}
