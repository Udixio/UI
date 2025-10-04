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

  add(args: Record<string, PaletteCallback | 'string'>): void {
    Object.entries(args).forEach(([key, callback]) => {
      if (typeof callback === 'string') {
        this.paletteManager.addCustomPalette(
          key,
          Hct.fromInt(argbFromHex(callback)),
        );
      } else {
        this.paletteManager.add(key, callback);
      }
    });
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
}
