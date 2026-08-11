import { Context } from 'src/context';
import { Palette, PaletteCallback } from './palette';
import { Color } from '../color/color';
import { ColorApi } from '../color';

export class PaletteManager {
  _palettes: Record<string, Palette> = {};
  context: Context;
  colorApi: ColorApi;

  get palettes(): Readonly<Record<string, Palette>> {
    return {
      ...this.context.variant.palettesFor(this.context),
      ...this._palettes,
    };
  }

  constructor(args: { context: Context; colorApi: ColorApi }) {
    this.colorApi = args.colorApi;
    this.context = args.context;

    this.context.onUpdate((changed) =>
      Object.entries(this.palettes).forEach(([key, value]) => {
        value.update(changed);
      }),
    );
  }

  addCustomPalette(key: string, args: Color | PaletteCallback): void {
    let palette: Palette;
    if (args instanceof Color) {
      palette = Palette.fromVariant(key, args, this.context);
    } else {
      palette = new Palette(key, args, this.context);
    }
    this.add(key, palette);
    this.colorApi.addFromCustomPalette(key);
  }

  add(key: string, palette: PaletteCallback | Palette): void {
    if (this._palettes['key']) {
      throw new Error(`Palette with key ${key} already exists`);
    }
    if (!(palette instanceof Palette))
      palette = new Palette(key, palette, this.context);
    this.set(key, palette);
  }

  get(
    key: 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'error' | string,
  ): Palette {
    const palette = this.palettes[key];
    if (!palette) {
      throw new Error(`Palette ${key} not found`);
    }
    return palette;
  }

  private set(key: string, palette: Palette) {
    this._palettes[key] = palette;
  }

  update(key: string, args: PaletteCallback | Palette): void {
    const existing = this._palettes[key];
    if (!existing) {
      throw new Error(`Palette with key ${key} not found`);
    }
    if (args instanceof Palette) {
      this.set(key, args);
    } else {
      existing.setCallback(args);
    }
  }

  remove(key: string): void {
    delete this._palettes[key];
  }

  override(key: string, args: Color | PaletteCallback): void {
    const callback: PaletteCallback =
      args instanceof Color
        ? (context) => context.variant.customPalettes(context, args)
        : args;

    if (this._palettes[key]) {
      this.update(key, callback);
    } else {
      const palette = new Palette(key, callback, this.context);
      this.set(key, palette);
      const isVariantPalette =
        !!this.context.variant.palettesFor(this.context)[key];
      if (!isVariantPalette) {
        this.colorApi.addFromCustomPalette(key);
      }
    }
  }
}
