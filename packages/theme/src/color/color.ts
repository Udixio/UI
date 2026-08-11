import {
  argbFromHex,
  Cam16,
  Contrast,
  hexFromArgb,
  lstarFromArgb,
  sanitizeDegreesDouble,
} from '@material/material-color-utilities';
import { solveToArgb } from './hct-math';
import { ColorManager } from './color.manager';
import { DEFAULT_TONE } from './tone-adjusters';
import type { ToneAdjuster } from './tone-adjusters';
import type { Palette } from '../palette/palette';
import type { Context } from '../context';

/** Les trois coordonnées perceptuelles qui définissent une couleur. */
export type ColorValue = {
  /** Teinte, en degrés. 0 <= hue < 360. */
  hue: number;
  /** Colorfulness. Le maximum atteignable dépend de `hue` et `tone`. */
  chroma: number;
  /** Luminosité perceptuelle. 0 <= tone <= 100. */
  tone: number;
};

export type ColorOptions =
  | FromPaletteOptions
  | { hex: string }
  | { alias: string };

function argbToRgb(argb: number): { r: number; g: number; b: number } {
  return {
    r: (argb >> 16) & 0xff,
    g: (argb >> 8) & 0xff,
    b: argb & 0xff,
  };
}

/**
 * Une couleur, quelle que soit sa provenance : valeur figée, hexadécimal,
 * alias, ou dérivée d'une palette.
 *
 * Une `Color` se lit comme une valeur — `.hue`, `.tone`, `.hex` sont résolus au
 * moment de l'accès. Les dérivations (`.withHue()`, `.rotate()`…) figent le
 * résultat : elles retournent toujours une couleur statique.
 */
export abstract class Color {
  ////////////////////////////////////////////////////////////////
  // Construction                                               //
  ////////////////////////////////////////////////////////////////

  /**
   * Construit une couleur à partir de ses coordonnées perceptuelles.
   *
   * Le chroma demandé peut être réduit : son maximum diffère pour chaque couple
   * (hue, tone). Voir {@link Color.maxChroma}.
   */
  static from({ hue, chroma, tone }: ColorValue): Color {
    return new ColorStatic(solveToArgb(hue, chroma, tone));
  }

  static fromHex(hex: string): Color {
    return new ColorStatic(argbFromHex(hex));
  }

  static fromArgb(argb: number): Color {
    return new ColorStatic(argb);
  }

  ////////////////////////////////////////////////////////////////
  // Utilitaires                                                //
  ////////////////////////////////////////////////////////////////

  /** Le chroma maximal atteignable pour une teinte et un ton donnés. */
  static maxChroma(hue: number, tone = DEFAULT_TONE): number {
    return Color.from({ hue, chroma: 200, tone }).chroma;
  }

  static isBlue(hue: number): boolean {
    return hue >= 250 && hue < 270;
  }

  static isYellow(hue: number): boolean {
    return hue >= 105 && hue < 125;
  }

  static isCyan(hue: number): boolean {
    return hue >= 170 && hue < 207;
  }

  ////////////////////////////////////////////////////////////////
  // Lecture                                                    //
  ////////////////////////////////////////////////////////////////

  /** Le seul membre que les stratégies doivent fournir. */
  abstract get argb(): number;

  private _cam?: Cam16;
  private _camArgb?: number;

  /** Cam16 mémoïsé, recalculé uniquement si l'ARGB résolu a changé. */
  private get cam(): Cam16 {
    const argb = this.argb;
    if (this._cam === undefined || this._camArgb !== argb) {
      this._cam = Cam16.fromInt(argb);
      this._camArgb = argb;
    }
    return this._cam;
  }

  get hue(): number {
    return this.cam.hue;
  }

  get chroma(): number {
    return this.cam.chroma;
  }

  get tone(): number {
    return lstarFromArgb(this.argb);
  }

  get hex(): string {
    return hexFromArgb(this.argb);
  }

  get rgb(): { r: number; g: number; b: number } {
    return argbToRgb(this.argb);
  }

  /** Les trois coordonnées d'un coup, pratique pour destructurer. */
  get value(): ColorValue {
    return { hue: this.hue, chroma: this.chroma, tone: this.tone };
  }

  ////////////////////////////////////////////////////////////////
  // Dérivation                                                 //
  ////////////////////////////////////////////////////////////////

  /** Forme générale : remplace les coordonnées fournies, conserve les autres. */
  with(partial: Partial<ColorValue>): Color {
    return Color.from({
      hue: partial.hue ?? this.hue,
      chroma: partial.chroma ?? this.chroma,
      tone: partial.tone ?? this.tone,
    });
  }

  /** Remplace la teinte, conserve chroma et tone. */
  withHue(hue: number): Color {
    return this.with({ hue });
  }

  withChroma(chroma: number): Color {
    return this.with({ chroma });
  }

  withTone(tone: number): Color {
    return this.with({ tone });
  }

  /** Décale la teinte, normalisée sur 360°. */
  rotate(degrees: number): Color {
    return this.with({ hue: sanitizeDegreesDouble(this.hue + degrees) });
  }

  scaleChroma(factor: number): Color {
    return this.with({ chroma: this.chroma * factor });
  }

  /** Ratio de contraste WCAG entre cette couleur et une autre. */
  contrastWith(other: Color): number {
    return Contrast.ratioOfTones(this.tone, other.tone);
  }

  toString(): string {
    return `Color(h=${this.hue.toFixed(0)}, c=${this.chroma.toFixed(0)}, t=${this.tone.toFixed(0)})`;
  }
}

/** Une couleur figée. Ce que produisent `Color.from()` et les dérivations. */
export class ColorStatic extends Color {
  constructor(private readonly _argb: number) {
    super();
  }

  get argb(): number {
    return this._argb;
  }
}

/** Une couleur définie par un hexadécimal, modifiable après coup. */
export class ColorFromHex extends Color {
  constructor(
    public readonly name: string,
    private _hex: string,
  ) {
    super();
  }

  get argb(): number {
    return argbFromHex(this._hex);
  }

  /** Retourne l'hexadécimal tel qu'il a été fourni, sans normalisation. */
  override get hex(): string {
    return this._hex;
  }

  setHex(hex: string) {
    this._hex = hex;
  }
}

/** Une couleur qui reflète en permanence celle d'une autre clé du registre. */
export class ColorAlias extends Color {
  constructor(
    public readonly name: string,
    public as: string,
    public colorManager: ColorManager,
  ) {
    super();
  }

  get argb(): number {
    return this.colorManager.get(this.as).argb;
  }

  color() {
    return this.colorManager.get(this.as) as ColorFromPalette;
  }
}

/**
 * @param palette Palette source, qui fournit la teinte et le chroma. La passer
 *     plutôt qu'un hue/chroma permet de préserver le chroma voulu lorsque le
 *     ton bouge.
 * @param tone Le ton par défaut. À défaut, {@link DEFAULT_TONE}.
 * @param adjustTone Ajuste ce ton par défaut. Rien n'est appliqué avant ni
 *     après : compose ce que tu veux — `contrastAgainst`, `avoidBackgroundGap`,
 *     `applyToneDelta`, `arbitrateBackgrounds`, ou ton
 *     propre calcul.
 * @param chromaMultiplier Facteur appliqué au chroma de la palette. Défaut 1.
 */
export type FromPaletteOptions = {
  palette: () => Palette;
  tone?: () => number;
  adjustTone?: ToneAdjuster;
  chromaMultiplier?: () => number | undefined;
};

/** Les mêmes options, une fois résolues. */
export type FromPalette = {
  palette: Palette;
  tone: number;
  chromaMultiplier: number;
};

export class ColorFromPalette extends Color {
  get options(): FromPalette {
    return {
      palette: this._options.palette(),
      chromaMultiplier: this._options.chromaMultiplier?.() ?? 1,
      tone: this.tone,
    };
  }

  constructor(
    public readonly name: string,
    private _options: FromPaletteOptions,
    private context: Context,
  ) {
    super();
  }

  update(args: Partial<FromPaletteOptions>) {
    this._options = { ...this._options, ...args };
  }

  get argb(): number {
    const palette = this._options.palette();
    const chroma = palette.chroma * (this._options.chromaMultiplier?.() ?? 1);
    return solveToArgb(palette.hue, chroma, this.tone);
  }

  override get tone(): number {
    const tone = this._options.tone?.() ?? DEFAULT_TONE;
    const adjust = this._options.adjustTone;
    if (!adjust) return tone;
    return adjust({
      context: this.context,
      tone,
      palette: this._options.palette(),
    });
  }
}
