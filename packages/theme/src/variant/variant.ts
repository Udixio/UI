import { sanitizeDegreesDouble } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { Palette } from '../palette/palette';
import { AddColorsOptions } from '../color';
import { Context } from '../context';
import { AddPaletteOptions } from '../palette/palette.api';

export const getPiecewiseHue = (
  sourceColorHct: Hct,
  hueBreakpoints: number[],
  hues: number[],
): number => {
  const size = Math.min(hueBreakpoints.length - 1, hues.length);
  const sourceHue = sourceColorHct.hue;
  for (let i = 0; i < size; i++) {
    if (sourceHue >= hueBreakpoints[i] && sourceHue < hueBreakpoints[i + 1]) {
      return sanitizeDegreesDouble(hues[i]);
    }
  }
  return sourceHue;
};

export const getRotatedHue = (
  sourceColorHct: Hct,
  hueBreakpoints: number[],
  rotations: number[],
): number => {
  let rotation = getPiecewiseHue(sourceColorHct, hueBreakpoints, rotations);
  if (Math.min(hueBreakpoints.length - 1, rotations.length) <= 0) {
    rotation = 0;
  }
  return sanitizeDegreesDouble(sourceColorHct.hue + rotation);
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
  colors?: AddColorsOptions;
}

export class Variant {
  public readonly palettes: Record<string, Palette>;
  public readonly customPalettes: VariantOptions['customPalettes'];
  public readonly colors: AddColorsOptions;
  public readonly name: string;

  constructor(args: VariantOptions) {
    this.palettes = Object.entries(args.palettes).reduce(
      (acc, [key, callback]) => ({
        ...acc,
        [key]: new Palette(callback),
      }),
      {},
    );
    this.customPalettes = args.customPalettes;
    this.colors = args.colors || {};
    this.name = args.name;
  }
}

export const variant = (args: VariantOptions) => new Variant(args);
