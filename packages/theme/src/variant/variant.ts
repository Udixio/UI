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
   * Les callbacks de palette tels que déclarés.
   *
   * C'est par là qu'on repart d'un variant existant :
   *
   * ```ts
   * variant({
   *   name: 'warmer',
   *   palettes: {
   *     ...Variants.TonalSpot.paletteCallbacks,
   *     neutral: ({ sourceColor }) => sourceColor.rotate(20).withChroma(8),
   *   },
   *   customPalettes: Variants.TonalSpot.customPalettes,
   *   colors: defaultColors,
   * });
   * ```
   */
  public readonly paletteCallbacks: AddPaletteOptions;

  /**
   * Les palettes instanciées, une série par contexte.
   *
   * Un variant est une description partagée — `Variants.TonalSpot` est un
   * singleton de module. Deux thèmes construits dans le même processus s'en
   * servent donc tous les deux, et chacun doit avoir ses propres `Palette`,
   * sans quoi le second écraserait celles du premier.
   */
  private readonly byContext = new WeakMap<Context, Record<string, Palette>>();

  constructor(options: VariantOptions) {
    this.name = options.name;
    this.customPalettes = options.customPalettes;
    this.colorsFromCustomPalette = options.colorsFromCustomPalette;
    this.colors = options.colors ?? {};
    this.paletteCallbacks = options.palettes;
  }

  /** Les palettes de ce variant pour ce contexte, instanciées à la demande. */
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

  /** Prépare les palettes d'un contexte. `palettesFor` le fait aussi, à la demande. */
  init(context: Context) {
    this.palettesFor(context);
  }
}

export const variant = (args: VariantOptions) => new Variant(args);
