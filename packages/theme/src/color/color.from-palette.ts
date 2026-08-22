import { solveToArgb } from './hct-math';
import { Color } from './color.base';
import { DEFAULT_TONE, resolvePalette } from './tone-adjusters';
import type { API } from '../API';
import type {
  FromPalette,
  FromPaletteOptions,
} from './color.types';

export class ColorFromPalette extends Color {
  get options(): FromPalette {
    const palette = resolvePalette(this._options.palette, this.getApi());
    return {
      palette,
      chroma: palette.chroma * (this._options.chromaMultiplier?.() ?? 1),
      tone: this.tone,
    };
  }

  constructor(
    public readonly name: string,
    private _options: FromPaletteOptions,
    private getApi: () => API,
  ) {
    super();
  }

  update(args: Partial<FromPaletteOptions>) {
    this._options = { ...this._options, ...args };
  }

  get argb(): number {
    const { palette, chroma, tone } = this.options;
    return solveToArgb(palette.hue, chroma, tone);
  }

  /**
   * Le ton par défaut, passé à chaque ajusteur à la suite : le premier reçoit
   * la valeur déclarée, chacun des suivants ce que le précédent a rendu.
   */
  override get tone(): number {
    const adjusters = this._options.adjustTone;
    const api = this.getApi();
    let tone = this._options.tone?.() ?? DEFAULT_TONE;
    if (!adjusters) return tone;
    // `Object.create` plutôt qu'un spread : l'API est une classe, ses méthodes
    // doivent rester atteignables depuis un ajusteur maison.
    const args = Object.create(api) as API & { tone: number };
    for (const adjust of Array.isArray(adjusters) ? adjusters : [adjusters]) {
      args.tone = tone;
      tone = adjust(args);
    }
    return tone;
  }
}
