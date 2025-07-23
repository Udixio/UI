import { TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';

export interface SchemeOptions {
  sourceColorArgb: number;
  contrastLevel: number;
  isDark: boolean;
  palettes: Map<string, TonalPalette>;
  variant: 'expressive' | 'neutral' | 'tonalSpot' | 'vibrant' | string;
}

export class Scheme {
  constructor(private options: SchemeOptions) {}

  get variant() {
    return this.options.variant;
  }

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

  getPalette(
    key:
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'neutral'
      | 'neutralVariant'
      | 'error'
      | string,
  ): TonalPalette {
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
