import {
  argbFromHex,
  Cam16,
  Contrast,
  hexFromArgb,
  lstarFromArgb,
  sanitizeDegreesDouble,
} from '@material/material-color-utilities';
import { solveToArgb } from './hct-math';
import { DEFAULT_TONE } from './tone-adjusters';
import type { ColorValue } from './color.types';

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
