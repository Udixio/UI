import { sanitizeDegreesDouble } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { Palette } from '../palette/palette';
import { AddColorsOptions } from '../color';
import { Context } from '../context';
import { AddPaletteOptions } from '../palette/palette.api';

export const getPiecewiseHue = (
  sourceColor: Hct,
  hueBreakpoints: number[],
  hues: number[],
): number => {
  const size = Math.min(hueBreakpoints.length - 1, hues.length);
  const sourceHue = sourceColor.hue;
  for (let i = 0; i < size; i++) {
    if (sourceHue >= hueBreakpoints[i] && sourceHue < hueBreakpoints[i + 1]) {
      return sanitizeDegreesDouble(hues[i]);
    }
  }
  return sourceHue;
};

export const getRotatedHue = (
  sourceColor: Hct,
  hueBreakpoints: number[],
  rotations: number[],
): number => {
  let rotation = getPiecewiseHue(sourceColor, hueBreakpoints, rotations);
  if (Math.min(hueBreakpoints.length - 1, rotations.length) <= 0) {
    rotation = 0;
  }
  return sanitizeDegreesDouble(sourceColor.hue + rotation);
};

export interface VariantOptions {
  name: string;
  palettes: AddPaletteOptions;
  customPalettes: (
    args: Context,
    color: Hct,
  ) => {
    hue: number;
    chroma: number;
  };
  colorsFromCustomPalette?: (key: string) => AddColorsOptions;
  colors?: AddColorsOptions;
}

export class Variant {
  public _palettes?: Record<string, Palette>;
  public readonly customPalettes: VariantOptions['customPalettes'];
  public readonly colorsFromCustomPalette?: (key: string) => AddColorsOptions;
  public readonly colors: AddColorsOptions;
  public readonly name: string;
  private context?: Context;

  constructor(private options: VariantOptions) {
    this.customPalettes = options.customPalettes;
    this.colors = options.colors || {};
    this.name = options.name;
    this.colorsFromCustomPalette = options.colorsFromCustomPalette;
  }

  get palettes() {
    if (!this._palettes) {
      throw new Error('Variant not initialized');
    }
    return this._palettes;
  }

  init(context: Context) {
    if (this.context) return;
    this.context = context;
    this._palettes = Object.entries(this.options.palettes).reduce(
      (acc, [key, callback]) => ({
        ...acc,
        [key]: new Palette(key, callback, context),
      }),
      {},
    );
  }
}

export const variant = (args: VariantOptions) => new Variant(args);
