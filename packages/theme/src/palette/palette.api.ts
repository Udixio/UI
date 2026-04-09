import { PaletteManager } from './palette.manager';
import { Palette, PaletteCallback } from './palette';
import { Hct } from '../material-color-utilities/htc';
import { argbFromHex } from '@material/material-color-utilities';

export type AddPaletteOptions = Record<string, PaletteCallback>;

export class PaletteApi {
  private readonly paletteManager: PaletteManager;
  constructor({ paletteManager }: { paletteManager: PaletteManager }) {
    this.paletteManager = paletteManager;
  }

  add(args: Record<string, PaletteCallback | string>): void {
    Object.entries(args).forEach(([key, callback]) => {
      if (typeof callback === 'string') {
        this.paletteManager.addCustomPalette(
          key,
          Hct.fromInt(argbFromHex(callback)),
        );
      } else {
        this.paletteManager.addCustomPalette(key, callback);
      }
    });
  }

  override(args: Record<string, PaletteCallback | string>): void {
    Object.entries(args).forEach(([key, callback]) => {
      if (typeof callback === 'string') {
        this.paletteManager.override(key, Hct.fromInt(argbFromHex(callback)));
      } else {
        this.paletteManager.override(key, callback);
      }
    });
  }

  getSerializableState(): Record<string, { hue: number; chroma: number }> {
    const result: Record<string, { hue: number; chroma: number }> = {};
    for (const [key, palette] of Object.entries(this.paletteManager._palettes)) {
      result[key] = { hue: palette.hue, chroma: palette.chroma };
    }
    return result;
  }

  sync(args: Record<string, PaletteCallback | string> | undefined): void {
    const incoming = new Set(Object.keys(args ?? {}));
    Object.keys(this.paletteManager._palettes).forEach((key) => {
      if (!incoming.has(key)) {
        this.paletteManager.remove(key);
      }
    });
    if (args) this.override(args);
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
    return this.paletteManager.get(key);
  }

  getAll(): Readonly<Record<string, Palette>> {
    return this.paletteManager.palettes;
  }
}
