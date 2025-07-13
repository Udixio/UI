import { Injectable } from '@nestjs/common';
import { ContrastCurve, ToneDeltaPair } from '../material-color-utilities';
import { DynamicColor } from '../material-color-utilities/dynamic_color';
import { SchemeEntity } from '../theme/entities/scheme.entity';

import { ColorEntity, ColorOptions } from './entities/color.entity';
import { SchemeService } from '../theme/services/scheme.service';

export type DynamicColorKey =
  | 'background'
  | 'onBackground'
  | 'surface'
  | 'surfaceDim'
  | 'surfaceBright'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'onSurface'
  | 'surfaceVariant'
  | 'onSurfaceVariant'
  | 'inverseSurface'
  | 'inverseOnSurface'
  | 'outline'
  | 'outlineVariant'
  | 'shadow'
  | 'scrim'
  | 'surfaceTint'
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'inversePrimary'
  | 'secondary'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'error'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'primaryFixed'
  | 'primaryFixedDim'
  | 'onPrimaryFixed'
  | 'onPrimaryFixedVariant'
  | 'secondaryFixed'
  | 'secondaryFixedDim'
  | 'onSecondaryFixed'
  | 'onSecondaryFixedVariant'
  | 'tertiaryFixed'
  | 'tertiaryFixedDim'
  | 'onTertiaryFixed'
  | 'onTertiaryFixedVariant';

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

@Injectable()
export class ColorManagerService {
  private colorMap = new Map<string, ColorEntity>();
  constructor(private schemeService: SchemeService) {}

  createOrUpdate(
    key: string,
    args: Partial<Omit<ColorOptions, 'name'>>
  ): ColorEntity {
    let colorEntity = this.colorMap.get(key);
    if (!colorEntity) {
      const { palette, tone } = args;
      if (palette && tone) {
        colorEntity = new ColorEntity(
          { ...args, palette, tone, name: key },
          this.schemeService,
          this
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

  public get(key: string): ColorEntity {
    const colorEntity = this.colorMap.get(key);
    if (colorEntity) {
      return colorEntity;
    } else {
      throw new Error(`Color ${key} does not exist`);
    }
  }

  public getAll(): ReadonlyMap<string, ColorEntity> {
    return this.colorMap;
  }

  highestSurface(s: SchemeEntity): DynamicColor {
    return s.isDark
      ? this.get('surfaceBright').getDynamicColor()
      : this.get('surfaceDim').getDynamicColor();
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
      background: (s) => this.highestSurface(s),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyContainer).getDynamicColor(),
          this.get(colorKey).getDynamicColor(),
          15,
          'nearer',
          false
        ),
    });
    this.createOrUpdate(onColorKey, {
      palette: (s) => s.getPalette(key),
      tone: (s) => {
        return s.isDark ? 20 : 100;
      },
      background: (s) => this.get(colorKey).getDynamicColor(),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    });
    this.createOrUpdate(colorKeyContainer, {
      palette: (s) => s.getPalette(key),
      tone: (s) => {
        return s.isDark ? 30 : 90;
      },
      isBackground: true,
      background: (s) => this.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyContainer).getDynamicColor(),
          this.get(colorKey).getDynamicColor(),
          15,
          'nearer',
          false
        ),
    });
    this.createOrUpdate(onColorKeyContainer, {
      palette: (s) => s.getPalette(key),
      tone: (s) => {
        return s.isDark ? 90 : 10;
      },
      background: (s) => this.get(colorKeyContainer).getDynamicColor(),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    });
    this.createOrUpdate(inverseColorKey, {
      palette: (s) => s.getPalette(key),
      tone: (s) => (s.isDark ? 40 : 80),
      background: (s) => this.get('inverseSurface').getDynamicColor(),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
    });
    this.createOrUpdate(colorKeyFixed, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 90.0,
      isBackground: true,
      background: (s) => this.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyFixed).getDynamicColor(),
          this.get(colorKeyFixedDim).getDynamicColor(),
          10,
          'lighter',
          true
        ),
    });
    this.createOrUpdate(colorKeyFixedDim, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 80.0,
      isBackground: true,
      background: (s) => this.highestSurface(s),
      contrastCurve: new ContrastCurve(1, 1, 3, 7),
      toneDeltaPair: (s) =>
        new ToneDeltaPair(
          this.get(colorKeyFixed).getDynamicColor(),
          this.get(colorKeyFixedDim).getDynamicColor(),
          10,
          'lighter',
          true
        ),
    });
    this.createOrUpdate(onColorKeyFixed, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 10.0,
      background: (s) => this.get(colorKeyFixedDim).getDynamicColor(),
      secondBackground: (s) => this.get(colorKeyFixed).getDynamicColor(),
      contrastCurve: new ContrastCurve(4.5, 7, 11, 21),
    });
    this.createOrUpdate(onColorKeyFixedVariant, {
      palette: (s) => s.getPalette(key),
      tone: (s) => 30.0,
      background: (s) => this.get(colorKeyFixedDim).getDynamicColor(),
      secondBackground: (s) => this.get(colorKeyFixed).getDynamicColor(),
      contrastCurve: new ContrastCurve(3, 4.5, 7, 11),
    });
  }
}
