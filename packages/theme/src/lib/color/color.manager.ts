import {
  ContrastCurve,
  DynamicColor,
  ToneDeltaPair,
} from '../material-color-utilities';
import { Scheme, SchemeManager } from '../theme';

import { ColorOptions, ConfigurableColor } from './configurable-color';
import { DynamicColorKey } from './default-color';
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
      const { palette, tone } = args;
      if (palette && tone) {
        colorEntity = new ConfigurableColor(
          { ...args, palette, tone, name: key },
          this.schemeManager,
          this,
        );
        this.colorMap.set(key, colorEntity);
      } else {
        throw new Error(`Palette ${key} does not exist`);
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
    const ColorKey = capitalizeFirstLetter(key);
    const onColorKey = ('on' + ColorKey) as DynamicColorKey;
    const colorKeyContainer = (colorKey + 'Container') as DynamicColorKey;
    const onColorKeyContainer = ('on' +
      ColorKey +
      'Container') as DynamicColorKey;
    const inverseColorKey = ('inverse' + ColorKey) as DynamicColorKey;
    const colorKeyFixed = (colorKey + 'Fixed') as DynamicColorKey;
    const colorKeyFixedDim = (colorKey + 'FixedDim') as DynamicColorKey;
    const onColorKeyFixed = ('on' + ColorKey + 'Fixed') as DynamicColorKey;
    const onColorKeyFixedVariant = ('on' +
      ColorKey +
      'FixedVariant') as DynamicColorKey;

    this.createOrUpdate(colorKey, {
      palette: (s) => s.getPalette(key),
      tone: (s) => {
        return s.isDark ? 80 : 40;
      },
      isBackground: true,
      background: (s) => highestSurface(s, this),
      contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyContainer).getMaterialColor(),
          this.get(colorKey).getMaterialColor(),
          10,
          'nearer',
          false,
        ),
    });
    this.createOrUpdate(onColorKey, {
      palette: (s) => s.getPalette(key),
      tone: (s) => {
        return s.isDark ? 20 : 100;
      },
      background: (s) => this.get(colorKey).getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    });
    this.createOrUpdate(colorKeyContainer, {
      palette: (s) => s.getPalette(key),
      tone: (s) => {
        return s.isDark ? 30 : 90;
      },
      isBackground: true,
      background: (s) => highestSurface(s, this),
      contrastCurve: (s) => new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyContainer).getMaterialColor(),
          this.get(colorKey).getMaterialColor(),
          10,
          'nearer',
          false,
        ),
    });
    this.createOrUpdate(onColorKeyContainer, {
      palette: (s) => s.getPalette(key),
      tone: (s) => {
        return s.isDark ? 90 : 10;
      },
      background: (s) => this.get(colorKeyContainer).getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    });
    this.createOrUpdate(inverseColorKey, {
      palette: (s) => s.getPalette(key),
      tone: (s) => (s.isDark ? 40 : 80),
      background: (s) => this.get('inverseSurface').getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11),
    });
    this.createOrUpdate(colorKeyFixed, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 90.0,
      isBackground: true,
      background: (s) => highestSurface(s, this),
      contrastCurve: (s) => new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyFixed).getMaterialColor(),
          this.get(colorKeyFixedDim).getMaterialColor(),
          10,
          'lighter',
          true,
        ),
    });
    this.createOrUpdate(colorKeyFixedDim, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 80.0,
      isBackground: true,
      background: (s) => highestSurface(s, this),
      contrastCurve: (s) => new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyFixed).getMaterialColor(),
          this.get(colorKeyFixedDim).getMaterialColor(),
          10,
          'lighter',
          true,
        ),
    });
    this.createOrUpdate(onColorKeyFixed, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 10.0,
      background: (s) => this.get(colorKeyFixedDim).getMaterialColor(),
      secondBackground: (s) => this.get(colorKeyFixed).getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(4.5, 7, 11, 21),
    });
    this.createOrUpdate(onColorKeyFixedVariant, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 30.0,
      background: (s) => this.get(colorKeyFixedDim).getMaterialColor(),
      secondBackground: (s) => this.get(colorKeyFixed).getMaterialColor(),
      contrastCurve: (s) => new ContrastCurve(3, 4.5, 7, 11),
    });
  }
}
