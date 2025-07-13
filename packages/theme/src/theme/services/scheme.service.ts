import { Injectable } from '@nestjs/common';
import { SchemeEntity, SchemeOptions } from '../entities/scheme.entity';
import {
  argbFromHex,
  Hct,
  TonalPalette,
} from '@material/material-color-utilities';
import mergeDeep from 'merge-deep';

export type SchemeServiceOptions = Omit<
  SchemeOptions,
  'palettes' | 'sourceColorArgb'
> & {
  sourceColorHex: string;
  palettes: Record<string, (sourceColorHct: Hct) => TonalPalette>;
};

@Injectable()
export class SchemeService {
  private schemeEntity?: SchemeEntity;
  private options?: SchemeServiceOptions;

  createOrUpdate(options: Partial<SchemeServiceOptions>) {
    this.options = mergeDeep(this.options, options);
    const palettes = new Map<string, TonalPalette>();

    const sourceColorArgb = argbFromHex(this.options.sourceColorHex);
    const sourceColorHct: Hct = Hct.fromInt(sourceColorArgb);

    if (!this.options.palettes) {
      return;
    }
    for (const [key, paletteFunction] of Object.entries(
      this.options.palettes
    )) {
      const palette: TonalPalette = paletteFunction(sourceColorHct);
      palettes.set(key, palette);
    }
    this.schemeEntity = new SchemeEntity({
      ...this.options,
      palettes: palettes,
      sourceColorArgb: sourceColorArgb,
    });
  }

  get(): SchemeEntity {
    if (!this.schemeEntity) {
      throw new Error('Scheme is not created');
    }
    return this.schemeEntity;
  }
}
