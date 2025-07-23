import { Scheme, SchemeOptions } from './scheme';
import { argbFromHex, TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';

export type SchemeServiceOptions = Omit<
  SchemeOptions,
  'palettes' | 'sourceColorArgb'
> & {
  sourcesColorHex: Record<string, string> & { primary?: string };
  palettes: Record<
    string,
    | {
        sourceColorkey: string;
        tonalPalette: CustomPaletteFunction;
      }
    | {
        sourceColorkey?: never;
        tonalPalette: PaletteFunction;
      }
  >;
};

type PaletteFunctionArgs = {
  isDark: boolean;
  sourceColorHct: Hct;
};

export type PaletteFunction = (args: PaletteFunctionArgs) => TonalPalette;
export type CustomPaletteFunction = (
  args: PaletteFunctionArgs & {
    colorHct: Hct;
  },
) => TonalPalette;

export class SchemeManager {
  private schemeEntity?: Scheme;
  private options?: SchemeServiceOptions;

  createOrUpdate(options: Partial<SchemeServiceOptions>) {
    this.options = {
      ...this.options,
      ...options,
      sourcesColorHex: {
        ...this.options?.sourcesColorHex,
        ...options.sourcesColorHex,
      },
      palettes: {
        ...this.options?.palettes,
        ...options.palettes,
      },
    } as SchemeServiceOptions;
    const palettes = new Map<string, TonalPalette>();

    if (!this.options.sourcesColorHex.primary) {
      throw new Error('Primary source color is not set');
    }

    const sourceColorArgb = argbFromHex(this.options.sourcesColorHex.primary);
    const sourceColorHct: Hct = Hct.fromInt(sourceColorArgb);

    if (!this.options.palettes) {
      return;
    }
    for (const [
      key,
      { sourceColorkey, tonalPalette: paletteFunction },
    ] of Object.entries(this.options.palettes)) {
      let palette: TonalPalette;
      if (typeof sourceColorkey != 'string') {
        palette = paletteFunction({
          sourceColorHct: sourceColorHct,
          isDark: options.isDark ?? false,
        });
      } else {
        const sourceColorArgb = argbFromHex(
          this.options.sourcesColorHex[sourceColorkey],
        );
        const colorHct: Hct = Hct.fromInt(sourceColorArgb);
        palette = paletteFunction({
          sourceColorHct: sourceColorHct,
          colorHct: colorHct,
          isDark: options.isDark ?? false,
        });
      }
      palettes.set(key, palette);
    }
    this.schemeEntity = new Scheme({
      ...this.options,
      palettes: palettes,
      sourceColorArgb: sourceColorArgb,
    });
  }

  get(): Scheme {
    if (!this.schemeEntity) {
      throw new Error('Scheme is not created');
    }
    return this.schemeEntity;
  }
}
