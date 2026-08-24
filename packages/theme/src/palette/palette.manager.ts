import { Context } from 'src/context';
import { Palette, PaletteCallback } from './palette';
import { Color } from '../color/color.base';
import { ColorApi } from '../color';

export class PaletteManager {
  _palettes: Record<string, Palette> = {};
  private _version = 0;
  context: Context;
  colorApi: ColorApi;

  get version(): number {
    return this._version;
  }

  get palettes(): Readonly<Record<string, Palette>> {
    return {
      ...this.context.variant.palettesFor(this.context),
      ...this._palettes,
    };
  }

  constructor(args: { context: Context; colorApi: ColorApi }) {
    this.colorApi = args.colorApi;
    this.context = args.context;

    this.context.onUpdate((changed) => {
      // Variant palettes hidden by an override still need to follow the
      // context. Otherwise removing the override reveals the palette state
      // from before the latest source-color update.
      Object.values(this.context.variant.palettesFor(this.context)).forEach(
        (palette) => palette.update(changed),
      );
      Object.values(this._palettes).forEach((palette) =>
        palette.update(changed),
      );
    });
  }

  addCustomPalette(key: string, args: Color | PaletteCallback): void {
    let palette: Palette;
    if (args instanceof Color) {
      const api = this.colorApi.api;
      if (!api) {
        throw new Error(
          'The API is not initialized. Please call bootstrap() before adding a color palette.',
        );
      }
      palette = Palette.fromVariant(key, args.init(api), this.context);
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
    this._version += 1;
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
      this._version += 1;
    }
  }

  remove(key: string): void {
    if (this._palettes[key]) {
      delete this._palettes[key];
      this._version += 1;
    }
  }

  override(key: string, args: Color | PaletteCallback): void {
    const color =
      args instanceof Color
        ? (() => {
            const api = this.colorApi.api;
            if (!api) {
              throw new Error(
                'The API is not initialized. Please call bootstrap() before overriding a color palette.',
              );
            }
            return args.init(api);
          })()
        : undefined;
    const callback: PaletteCallback = color
      ? (context) => context.variant.customPalettes(context, color)
      : (args as PaletteCallback);

    if (this._palettes[key]) {
      this.update(key, callback);
    } else {
      const palette = new Palette(key, callback, this.context);
      this.set(key, palette);
      const isVariantPalette = !!this.context.variant.palettesFor(this.context)[
        key
      ];
      if (!isVariantPalette) {
        this.colorApi.addFromCustomPalette(key);
      }
    }
  }
}
