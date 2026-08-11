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

/**
 * Bande de tons qu'une couleur de fond doit éviter : entre `darkCeiling` et
 * `lightFloor`, aucun premier plan — clair ou sombre — n'atteint un contraste
 * suffisant. Un ton qui tombe dedans est repoussé vers le bord le plus proche,
 * la bascule se faisant à `pivot`.
 *
 * Ces valeurs viennent de la spécification Material ; les modifier fait sortir
 * le thème de la conformité.
 */
export const BACKGROUND_TONE_GAP = {
  /** Au-dessus, on repousse vers le clair ; en dessous, vers le sombre. */
  pivot: 57,
  /** Ton minimal du côté clair. */
  lightFloor: 65,
  /** Ton maximal du côté sombre. */
  darkCeiling: 49,
} as const;

/** Ton d'une couleur qui n'a ni ton explicite ni fond dont hériter. */
export const DEFAULT_TONE = 50;

export function getInitialToneFromBackground(background?: Color): number {
  if (background === undefined) {
    return DEFAULT_TONE;
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
 * @param isBackground Indique que cette couleur sert de fond à d'autres. Son
 *     ton est alors écarté de `BACKGROUND_TONE_GAP`, où aucun premier plan
 *     n'obtient un contraste suffisant — sauf si `adjustTone` l'a fixé par un
 *     écart `exact`, qu'il serait absurde de violer juste après l'avoir posé.
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
  background?: () => Color | undefined;
  secondBackground?: () => Color | undefined;
  contrastCurve?: () => ContrastCurve | undefined;
  adjustTone?: () => ToneDelta | ToneResolver | undefined;
};

export type FromPalette = {
  palette: Palette;
  tone: number;
  chromaMultiplier: number;
  isBackground?: boolean;
  background?: Color;
  secondBackground?: Color;
  contrastCurve?: ContrastCurve;
  adjustTone?: ToneDelta | ToneResolver;
};

/**
 * Sens de l'écart entre `roleA` et `roleB`.
 *
 * `relative_darker` et `relative_lighter` suivent la tendance des surfaces :
 * vers le blanc en mode clair, vers le noir en mode sombre.
 */
export type TonePolarity =
  | 'darker'
  | 'lighter'
  | 'nearer'
  | 'farther'
  | 'relative_darker'
  | 'relative_lighter';

/** Comment satisfaire la contrainte d'écart. */
export type DeltaConstraint = 'exact' | 'nearer' | 'farther';

/**
 * Échappatoire : calcule le ton de toutes pièces, au lieu de le décrire.
 *
 * Le ton rendu est **final** — ni le contraste ni l'écartement de la zone
 * médiane ne s'appliquent ensuite. À réserver aux cas qu'une `ToneDelta` ne
 * sait pas exprimer, comme un seuil de contraste calculé autrement.
 */
export type ToneResolver = (args: {
  context: Context;
  color: Color;
}) => number;

/**
 * Contrainte d'écart de ton entre deux couleurs, quand elles doivent rester
 * visuellement distinctes sans être dans une relation fond / premier plan.
 *
 * La polarité décrit `roleA` **par rapport à** `roleB` : `{ delta: 15,
 * polarity: 'darker', constraint: 'exact' }` signifie que le ton de `roleA`
 * doit valoir exactement 15 de moins que celui de `roleB`.
 *
 * `relative_darker` et `relative_lighter` suivent le sens des surfaces : en
 * mode clair elles vont vers le blanc, en mode sombre vers le noir.
 */
export type ToneDelta = {
  roleA: Color;
  roleB: Color;
  /** Écart requis, en valeur absolue. */
  delta: number;
  polarity: TonePolarity;
  /** `exact` fige le ton ; `nearer` et `farther` le bornent. */
  constraint: DeltaConstraint;
};

/**
 * Applique une contrainte d'écart au ton de `self`, en fonction du ton déjà
 * résolu de l'autre couleur de la paire.
 */
function applyToneDelta(
  tone: number,
  { roleA, roleB, delta, polarity, constraint }: ToneDelta,
  self: Color,
  context: Context,
): number {
  const signedDelta =
    polarity === 'darker' ||
    (polarity === 'relative_lighter' && context.isDark) ||
    (polarity === 'relative_darker' && !context.isDark)
      ? -delta
      : delta;

  const amRoleA = self === roleA;
  const refTone = (amRoleA ? roleB : roleA).tone;
  const relativeDelta = signedDelta * (amRoleA ? 1 : -1);

  if (constraint === 'exact') {
    return clampDouble(0, 100, refTone + relativeDelta);
  }
  if (constraint === 'nearer') {
    return relativeDelta > 0
      ? clampDouble(0, 100, clampDouble(refTone, refTone + relativeDelta, tone))
      : clampDouble(0, 100, clampDouble(refTone + relativeDelta, refTone, tone));
  }
  // 'farther'
  return relativeDelta > 0
    ? clampDouble(refTone + relativeDelta, 100, tone)
    : clampDouble(0, refTone + relativeDelta, tone);
}

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

  /**
   * Résout le ton en une seule passe, chaque étape s'appliquant à la sortie de
   * la précédente :
   *
   *   1. ton de base (`tone`)
   *   2. contrainte d'écart avec la couleur appairée (`adjustTone`)
   *   3. contraste avec le ou les fonds (`background` + `contrastCurve`)
   *   4. écartement de la zone médiane (`isBackground`)
   *
   * Aucune étape n'en court-circuite une autre : une couleur qui déclare à la
   * fois un écart et un fond obtient bien les deux.
   */
  override get tone(): number {
    const context = this.context;
    const options = this.options;

    let answer = options.tone;

    // 1-2. Écart avec la couleur appairée, ou résolveur maison.
    const adjust = options.adjustTone;
    if (typeof adjust === 'function') {
      // Un résolveur maison a le dernier mot : il calcule déjà son propre ton.
      return adjust({ context, color: this });
    }
    if (adjust) {
      answer = applyToneDelta(answer, adjust, this, context);
    }

    // 3. Contraste avec le fond.
    let desiredRatio: number | undefined;
    if (options.background && options.contrastCurve) {
      const bgTone = options.background.tone;
      desiredRatio = options.contrastCurve.get(context.contrastLevel);
      // On recalcule le ton depuis le ratio voulu si le ratio actuel est
      // insuffisant, ou si le niveau de contraste demandé décroît (<0).
      answer =
        Contrast.ratioOfTones(bgTone, answer) >= desiredRatio &&
        context.contrastLevel >= 0
          ? answer
          : DynamicColor.foregroundTone(bgTone, desiredRatio);
    } else if (!adjust) {
      // Sans fond ni courbe, et sans écart à respecter, le ton de base fait
      // foi — un fond n'est alors pas écarté de la zone médiane. C'est le cas
      // des `*Container`, dont la `contrastCurve` résout à `undefined` dès que
      // le niveau de contraste est nul ou négatif.
      return answer;
    }

    // 4. Les fonds évitent la zone médiane, où aucun premier plan n'obtient
    // un contraste suffisant. Un ton posé par un écart `exact` en est exempt :
    // le déplacer violerait la contrainte qu'on vient tout juste d'appliquer.
    if (options.isBackground && adjust?.constraint !== 'exact') {
      answer = answer >= 57 ? clampDouble(65, 100, answer) : clampDouble(0, 49, answer);
    }

    if (!options.background || !options.secondBackground || desiredRatio === undefined) {
      return answer;
    }

    // 5. Arbitrage entre deux fonds : on cherche un ton qui contraste
    // suffisamment avec les deux à la fois.
    const [bgTone1, bgTone2] = [
      options.background.tone,
      options.secondBackground.tone,
    ];
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
