import { Context } from 'src/context';
import { Palette, PaletteCallback } from './palette';
import { Hct } from '../material-color-utilities/htc';
import { ColorApi } from '../color';

export class PaletteManager {
  _palettes: Record<string, Palette> = {};
  context: Context;
  colorApi: ColorApi;

  get palettes(): Readonly<Record<string, Palette>> {
    return {
      ...this.context.variant.palettes,
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

  addCustomPalette(key: string, color: Hct) {
    const palette = Palette.fromVariant(key, color, this.context);
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
      args = new Palette(key, args, this.context);
    }
    this.set(key, args);
  }
}
