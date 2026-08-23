import { PaletteManager } from './palette.manager';
import { Palette, PaletteCallback } from './palette';
import { Color } from '../color/color.base';
import type { ColorInput } from '../color/color.types';

export type AddPaletteOptions = Record<string, PaletteCallback>;
export type PaletteValue = ColorInput | PaletteCallback;
export type PaletteOptions = Record<string, PaletteValue>;

export class PaletteApi {
  private readonly paletteManager: PaletteManager;
  constructor({ paletteManager }: { paletteManager: PaletteManager }) {
    this.paletteManager = paletteManager;
  }

  add(args: PaletteOptions): void {
    Object.entries(args).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.paletteManager.addCustomPalette(key, Color.fromHex(value));
      } else {
        this.paletteManager.addCustomPalette(key, value);
      }
    });
  }

  override(args: PaletteOptions): void {
    Object.entries(args).forEach(([key, value]) => {
      if (typeof value === 'string') {
        this.paletteManager.override(key, Color.fromHex(value));
      } else {
        this.paletteManager.override(key, value);
      }
    });
  }

  getSerializableState(): Record<string, { hue: number; chroma: number }> {
    const result: Record<string, { hue: number; chroma: number }> = {};
    for (const [key, palette] of Object.entries(
      this.paletteManager._palettes,
    )) {
      result[key] = { hue: palette.hue, chroma: palette.chroma };
    }
    return result;
  }

  sync(args: PaletteOptions | undefined): void {
    const incoming = new Set(Object.keys(args ?? {}));
    Object.keys(this.paletteManager._palettes).forEach((key) => {
      if (!incoming.has(key)) {
        this.paletteManager.remove(key);
      }
    });
    if (args) this.override(args);
  }

  get(
    key: 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'error' | string,
  ): Palette {
    return this.paletteManager.get(key);
  }

  getAll(): Readonly<Record<string, Palette>> {
    return this.paletteManager.palettes;
  }
}
