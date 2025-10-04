import { Context } from 'src/context';
import { Palette, PaletteCallback } from './palette';
import { Hct } from '../material-color-utilities/htc';

export class PaletteManager {
  _palettes: Record<string, Palette> = {};
  context: Context;

  get palettes(): Readonly<Record<string, Palette>> {
    return {
      ...this.context.variant.palettes,
      ...this._palettes,
    };
  }

  constructor(args: { context: Context }) {
    this.context = args.context;
  }

  addCustomPalette(key: string, color: Hct) {
    const palette = Palette.fromVariant(color);
    this.add(key, palette);
  }

  add(key: string, palette: PaletteCallback | Palette): void {
    if (this._palettes['key']) {
      throw new Error(`Palette with key ${key} already exists`);
    }
    if (!(palette instanceof Palette)) palette = new Palette(palette);
    this.set(key, palette);
  }

  get(
    key:
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'neutral'
      | 'neutralVariant'
      | 'error'
      | string,
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
    if (!this.palettes['key']) {
      throw new Error(`Palette with key ${key} not found`);
    }
    if (!(args instanceof Palette)) {
      args = new Palette(args);
    }
    this.set(key, args);
  }
}
