import { sanitizeDegreesDouble } from '@material/material-color-utilities';
import type { Color } from '../color/color.base';
import { Palette } from '../palette/palette';
import type { ColorsConfig } from '../color/color.types';
import { Context } from '../context';
import { AddPaletteOptions } from '../palette/palette.api';

export const getPiecewiseHue = (
  sourceColor: Color,
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
  sourceColor: Color,
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
    color: Color,
  ) => {
    hue: number;
    chroma: number;
  };
  colorsFromCustomPalette?: (key: string) => ColorsConfig;
  colors?: ColorsConfig;
}

export class Variant {
  public readonly name: string;
  public readonly customPalettes: VariantOptions['customPalettes'];
  public readonly colorsFromCustomPalette?: (key: string) => ColorsConfig;
  public readonly colors: ColorsConfig;

  /**
   * The palette callbacks as declared.
   *
   * This is the starting point for building on an existing variant:
   *
   * ```ts
   * variant({
   *   name: 'warmer',
   *   palettes: {
   *     ...Variants.TonalSpot.paletteCallbacks,
   *     neutral: ({ sourceColor }) => sourceColor.rotate(20).withChroma(8),
   *   },
   *   customPalettes: Variants.TonalSpot.customPalettes,
   *   colors: Variants.TonalSpot.colors,
   * });
   * ```
   */
  public readonly paletteCallbacks: AddPaletteOptions;

  /**
   * The instantiated palettes, one set per context.
   *
   * A variant is a shared description — `Variants.TonalSpot` is a module
   * singleton. Two themes built in the same process therefore both use it,
   * and each must have its own `Palette`s, otherwise the second would
   * overwrite the first's.
   */
  private readonly byContext = new WeakMap<Context, Record<string, Palette>>();

  constructor(options: VariantOptions) {
    this.name = options.name;
    this.customPalettes = options.customPalettes;
    this.colorsFromCustomPalette = options.colorsFromCustomPalette;
    this.colors = options.colors ?? {};
    this.paletteCallbacks = options.palettes;
  }

  /** This variant's palettes for this context, instantiated on demand. */
  palettesFor(context: Context): Record<string, Palette> {
    let palettes = this.byContext.get(context);
    if (!palettes) {
      palettes = Object.fromEntries(
        Object.entries(this.paletteCallbacks).map(([key, callback]) => [
          key,
          new Palette(key, callback, context),
        ]),
      );
      this.byContext.set(context, palettes);
    }
    return palettes;
  }

  /** Prepares a context's palettes. `palettesFor` also does it, on demand. */
  init(context: Context) {
    this.palettesFor(context);
  }
}

export const variant = (args: VariantOptions) => new Variant(args);
