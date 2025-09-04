import { DynamicColor, toneDeltaPair } from '../material-color-utilities';
import { Scheme, SchemeManager } from '../theme';

import { ColorOptions, ConfigurableColor } from './configurable-color';
import { DynamicColorKey, getCurve, tMaxC, tMinC } from './color.utils';
import { ColorApi } from './color.api';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const highestSurface = (
  s: Scheme,
  colorService: ColorManager | ColorApi,
): DynamicColor => {
  if (colorService instanceof ColorApi) {
    return s.isDark
      ? colorService.getColor('surfaceBright').getMaterialColor()
      : colorService.getColor('surfaceDim').getMaterialColor();
  } else {
    return s.isDark
      ? colorService.get('surfaceBright').getMaterialColor()
      : colorService.get('surfaceDim').getMaterialColor();
  }
};

export class ColorManager {
  private colorMap = new Map<string, ConfigurableColor>();
  private readonly schemeManager: SchemeManager;

  constructor({ schemeManager }: { schemeManager: SchemeManager }) {
    this.schemeManager = schemeManager;
  }

  createOrUpdate(
    key: string,
    args:
      | (Partial<ColorOptions> & { alias?: never })
      | { alias: string; palette?: never; tone?: never },
  ): ConfigurableColor {
    let colorEntity = this.colorMap.get(key);
    if (!colorEntity) {
      const { palette, alias } = args;
      if (palette) {
        colorEntity = new ConfigurableColor(
          { ...args, palette: palette, name: key },
          this.schemeManager,
          this,
        );
        this.colorMap.set(key, colorEntity);
      } else if (alias) {
        colorEntity = new ConfigurableColor(
          { ...args, alias: alias, name: key },
          this.schemeManager,
          this,
        );
        this.colorMap.set(key, colorEntity);
      } else {
        throw new Error(`Palette ${palette} does not exist from ${key}`);
      }
    } else {
      colorEntity.update({ ...args, name: key });
      this.colorMap.set(key, colorEntity);
    }
    return colorEntity;
  }

  public remove(key: string) {
    return this.colorMap.delete(key);
  }

  public get(key: string): ConfigurableColor {
    const colorEntity = this.colorMap.get(key);
    if (colorEntity) {
      return colorEntity;
    } else {
      throw new Error(`Color ${key} does not exist`);
    }
  }

  public getAll(): ReadonlyMap<string, ConfigurableColor> {
    return this.colorMap;
  }

  addFromPalette(key: string): void {
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

    this.createOrUpdate(colorKey, {
      palette: (s) => s.getPalette(colorKey),
      tone: (s) => {
        if (s.variant === 'neutral') {
          return s.isDark
            ? tMinC(s.getPalette(colorKey), 0, 98)
            : tMaxC(s.getPalette(colorKey));
        } else if (s.variant === 'vibrant') {
          return tMaxC(s.getPalette(colorKey), 0, s.isDark ? 90 : 98);
        } else {
          return s.isDark ? 80 : tMaxC(s.getPalette(colorKey));
        }
      },
      isBackground: true,
      background: (s) => highestSurface(s, this),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
        toneDeltaPair(
          this.get(colorContainerKey).getMaterialColor(),
          this.get(colorKey).getMaterialColor(),
          5,
          'relative_lighter',
          true,
          'farther',
        ),
    });
    this.createOrUpdate(colorDimKey, {
      palette: (s) => s.getPalette(colorKey),
      tone: (s) => {
        if (s.variant === 'neutral') {
          return 85;
        } else {
          return tMaxC(s.getPalette(colorKey), 0, 90);
        }
      },
      isBackground: true,
      background: (s) => this.get('surfaceContainerHigh').getMaterialColor(),
      contrastCurve: (s) => getCurve(4.5),
      adjustTone: (s) =>
        toneDeltaPair(
          this.get(colorDimKey).getMaterialColor(),
          this.get(colorKey).getMaterialColor(),
          5,
          'darker',
          true,
          'farther',
        ),
    });
    this.createOrUpdate(onColorKey, {
      palette: (s) => s.getPalette(colorKey),
      background: (s) => this.get(colorKey).getMaterialColor(),
      contrastCurve: (s) => getCurve(6),
    });
    this.createOrUpdate(colorContainerKey, {
      palette: (s) => s.getPalette(colorKey),
      tone: (s) => {
        if (s.variant === 'vibrant') {
          return s.isDark
            ? tMinC(s.getPalette(colorKey), 30, 40)
            : tMaxC(s.getPalette(colorKey), 84, 90);
        } else if (s.variant === 'expressive') {
          return s.isDark ? 15 : tMaxC(s.getPalette(colorKey), 90, 95);
        } else {
          return s.isDark ? 25 : 90;
        }
      },
      isBackground: true,
      background: (s) => highestSurface(s, this),
      adjustTone: (s) => undefined,
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    });
    this.createOrUpdate(onColorContainerKey, {
      palette: (s) => s.getPalette(colorKey),
      background: (s) => this.get(colorContainerKey).getMaterialColor(),
      contrastCurve: (s) => getCurve(6),
    });
    this.createOrUpdate(colorFixedKey, {
      palette: (s) => s.getPalette(colorKey),
      tone: (s) => {
        const tempS = Object.assign({}, s, { isDark: false, contrastLevel: 0 });
        return this.get(colorContainerKey).getMaterialColor().getTone(tempS);
      },
      isBackground: true,
      background: (s) => highestSurface(s, this),
      contrastCurve: (s) => (s.contrastLevel > 0 ? getCurve(1.5) : undefined),
    });
    this.createOrUpdate(colorFixedDimKey, {
      palette: (s) => s.getPalette(colorKey),
      tone: (s) => this.get(colorFixedKey).getMaterialColor().getTone(s),
      isBackground: true,
      adjustTone: (s) =>
        toneDeltaPair(
          this.get(colorFixedDimKey).getMaterialColor(),
          this.get(colorFixedKey).getMaterialColor(),
          5,
          'darker',
          true,
          'exact',
        ),
    });
    this.createOrUpdate(onColorFixedKey, {
      palette: (s) => s.getPalette(colorKey),
      background: (s) => this.get(colorFixedDimKey).getMaterialColor(),
      contrastCurve: (s) => getCurve(7),
    });
    this.createOrUpdate(onColorFixedVariantKey, {
      palette: (s) => s.getPalette(colorKey),
      background: (s) => this.get(colorFixedDimKey).getMaterialColor(),
      contrastCurve: (s) => getCurve(4.5),
    });
  }
}
