import {
  argbFromHex,
  Cam16,
  clampDouble,
  Contrast,
  hexFromArgb,
  lstarFromArgb,
  sanitizeDegreesDouble,
} from '@material/material-color-utilities';
import { ContrastCurve, DynamicColor } from '../material-color-utilities';
import { solveToArgb } from './hct-math';
import { ColorManager } from './color.manager';
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

export function getInitialToneFromBackground(background?: Color): number {
  if (background === undefined) {
    return 50;
  }
  return background.tone;
}

/**
 * Une couleur, quelle que soit sa provenance : valeur figée, hexadécimal,
 * alias, ou dérivée d'une palette avec résolution de contraste.
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
   * (hue, tone). Voir `Color.maxChroma()`.
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
  static maxChroma(hue: number, tone = 50): number {
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
 *     contraste est ajusté.
 * @param tone Ton de base. À défaut, le ton du fond, ou 50 sans fond.
 * @param chromaMultiplier Facteur appliqué au chroma de la palette. Défaut 1.
 * @param isBackground Indique que cette couleur sert de fond à d'autres.
 * @param clampTone Écarte le ton résolu de la zone médiane (57–65) pour éviter
 *     les tons ingrats sur les fonds. Défaut : la valeur de `isBackground`.
 * @param background Le fond sur lequel cette couleur est posée.
 * @param secondBackground Un second fond, quand la couleur doit contraster
 *     avec deux fonds à la fois.
 * @param contrastCurve Comment le contraste avec le fond doit évoluer selon le
 *     niveau de contraste global. Obligatoire dès que `background` est fourni.
 * @param adjustTone Contrainte d'écart de ton avec une autre couleur. Prend le
 *     pas sur la résolution par contraste.
 */
export type FromPaletteOptions = {
  palette: () => Palette;
  tone?: () => number;
  chromaMultiplier?: () => number | undefined;
  isBackground?: boolean;
  clampTone?: boolean;
  background?: () => Color | undefined;
  secondBackground?: () => Color | undefined;
  contrastCurve?: () => ContrastCurve | undefined;
  adjustTone?: () => AdjustTone | undefined;
};

export type FromPalette = {
  palette: Palette;
  tone: number;
  chromaMultiplier: number;
  isBackground?: boolean;
  clampTone: boolean;
  background?: Color;
  secondBackground?: Color;
  contrastCurve?: ContrastCurve;
  adjustTone?: AdjustTone;
};

export type AdjustTone = (args: { context: Context; color: Color }) => number;

export class ColorFromPalette extends Color {
  get options(): FromPalette {
    const options = {
      ...this._options,
      palette: this._options.palette(),
      tone: this._options.tone?.(),
      chromaMultiplier: this._options.chromaMultiplier?.(),
      background: this._options.background?.(),
      secondBackground: this._options.secondBackground?.(),
      contrastCurve: this._options.contrastCurve?.(),
      adjustTone: this._options.adjustTone?.(),
    };

    return {
      ...options,
      chromaMultiplier: options.chromaMultiplier ?? 1,
      tone: options.tone ?? getInitialToneFromBackground(options.background),
      clampTone: options.clampTone ?? options.isBackground ?? false,
    };
  }

  constructor(
    public readonly name: string,
    private _options: FromPaletteOptions,
    private context: Context,
  ) {
    super();
    this.validateOption();
  }

  update(args: Partial<FromPaletteOptions>) {
    this._options = { ...this._options, ...args };
    this.validateOption();
  }

  validateOption() {
    const option = this._options;
    if ('palette' in option) {
      if (!option.background && option.secondBackground) {
        throw new Error(
          `Color ${this.name} has secondBackground ` +
            `defined, but background is not defined.`,
        );
      }
      if (!option.background && option.contrastCurve) {
        throw new Error(
          `Color ${this.name} has contrastCurve ` +
            `defined, but background is not defined.`,
        );
      }
      if (option.background && !option.contrastCurve) {
        throw new Error(
          `Color ${this.name} has background ` +
            `defined, but contrastCurve is not defined.`,
        );
      }
    }
  }

  get argb(): number {
    const option = this.options;

    const palette = option.palette;
    const tone = this.tone;
    const hue = palette.hue;
    const chroma = palette.chroma * option.chromaMultiplier;
    return solveToArgb(hue, chroma, tone);
  }

  override get tone(): number {
    const context = this.context;

    const options = this.options;

    const adjustTone = options.adjustTone;

    // Cas 0 : contrainte d'écart de ton.
    if (adjustTone) {
      return adjustTone({ context, color: this });
    } else {
      // Cas 1 : pas de contrainte d'écart ; on résout pour soi-même.
      let answer = options.tone;
      if (!options.background || !options.contrastCurve) {
        return answer; // Aucun ajustement pour les couleurs sans fond.
      }
      const bgTone = options.background.tone;
      const desiredRatio = options.contrastCurve.get(context.contrastLevel);
      // On recalcule le ton depuis le ratio voulu si le ratio actuel est
      // insuffisant, ou si le niveau de contraste demandé décroît (<0).
      answer =
        Contrast.ratioOfTones(bgTone, answer) >= desiredRatio &&
        context.contrastLevel >= 0
          ? answer
          : DynamicColor.foregroundTone(bgTone, desiredRatio);
      // Évite les tons ingrats pour les couleurs de fond.
      if (options.clampTone) {
        if (answer >= 57) {
          answer = clampDouble(65, 100, answer);
        } else {
          answer = clampDouble(0, 49, answer);
        }
      }
      if (!options.secondBackground) {
        return answer;
      }
      // Cas 2 : ajustement pour deux fonds.
      const [bg1, bg2] = [options.background, options.secondBackground];
      const [bgTone1, bgTone2] = [bg1.tone, bg2.tone];
      const [upper, lower] = [
        Math.max(bgTone1, bgTone2),
        Math.min(bgTone1, bgTone2),
      ];
      if (
        Contrast.ratioOfTones(upper, answer) >= desiredRatio &&
        Contrast.ratioOfTones(lower, answer) >= desiredRatio
      ) {
        return answer;
      }
      // Le ton clair le plus sombre qui satisfait le ratio, ou -1.
      const lightOption = Contrast.lighter(upper, desiredRatio);

      // Le ton sombre le plus clair qui satisfait le ratio, ou -1.
      const darkOption = Contrast.darker(lower, desiredRatio);
      // Tons utilisables en premier plan.
      const availables = [];
      if (lightOption !== -1) availables.push(lightOption);
      if (darkOption !== -1) availables.push(darkOption);

      const prefersLight =
        DynamicColor.tonePrefersLightForeground(bgTone1) ||
        DynamicColor.tonePrefersLightForeground(bgTone2);
      if (prefersLight) {
        return lightOption < 0 ? 100 : lightOption;
      }
      if (availables.length === 1) {
        return availables[0];
      }
      return darkOption < 0 ? 0 : darkOption;
    }
  }
}
