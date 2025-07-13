import { Hct, TonalPalette } from '@material/material-color-utilities';

export interface SchemeOptions {
  sourceColorArgb: number;
  contrastLevel: number;
  isDark: boolean;
  palettes: Map<string, TonalPalette>;
}

export class SchemeEntity {
  constructor(private options: SchemeOptions) {}

  get contrastLevel() {
    if (!this.options) {
      throw new Error('Scheme options is not set');
    }
    return this.options.contrastLevel;
  }

  get isDark() {
    if (!this.options) {
      throw new Error('Scheme options is not set');
    }
    return this.options.isDark;
  }

  get sourceColorHct() {
    if (!this.options) {
      throw new Error('Scheme options is not set');
    }
    return Hct.fromInt(this.options.sourceColorArgb);
  }

  getPalette(key: string): TonalPalette {
    if (!this.options) {
      throw new Error('Scheme options is not set');
    }
    const palette = this.options.palettes.get(key);
    if (!palette) {
      throw new Error(`Palette ${key} not found`);
    }
    return palette;
  }
}
