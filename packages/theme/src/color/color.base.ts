import {
  argbFromHex,
  Cam16,
  Contrast,
  hexFromArgb,
  lstarFromArgb,
  sanitizeDegreesDouble,
} from '@material/material-color-utilities';
import { solveToArgb } from './hct-math';
import {
  DEFAULT_TONE,
  resolvePalette as resolvePaletteRef,
} from './tone-adjusters';
import type { ToneAdjusterArgs } from './tone-adjusters';
import type { API } from '../API';
import type {
  ColorTransform,
  ColorValue,
  PaletteColorOptions,
  ResolvedPaletteColor,
} from './color.types';

type ValueSource = {
  kind: 'value';
  argb: number;
};

type PaletteSource = {
  kind: 'palette';
  options: PaletteColorOptions;
};

type AliasSource = {
  kind: 'alias';
  alias: string | (() => Color);
};

type ColorSource = ValueSource | PaletteSource | AliasSource;

type ResolutionPhase = 'before' | 'after';

type ResolutionState = {
  color: Color;
  palette?: ResolvedPaletteColor;
  paletteOptions?: PaletteColorOptions;
  paletteBase?: ColorValue;
  resolvedArgb?: number;
};

type ResolutionVersion = {
  context: number;
  palettes: number;
  colors: number;
};

type ResolutionCache = ResolutionVersion & {
  state: ResolutionState;
};

type AppliedTransforms = {
  color: Color;
  deferredAfterTransforms: ColorTransform[];
};

function argbToRgb(argb: number): { r: number; g: number; b: number } {
  return {
    r: (argb >> 16) & 0xff,
    g: (argb >> 8) & 0xff,
    b: argb & 0xff,
  };
}

/**
 * La valeur couleur unique du moteur.
 *
 * Une couleur peut être une valeur figée, une résolution depuis une palette ou
 * un alias. Les transformations restent dans la définition et
 * sont évaluées au moment de la résolution. Cela permet à une même couleur
 * dynamique d'être réutilisée dans plusieurs thèmes et contextes.
 */
export class Color {
  ////////////////////////////////////////////////////////////////
  // Construction                                               //
  ////////////////////////////////////////////////////////////////

  private constructor(
    private readonly source: ColorSource,
    private readonly api?: API,
    private readonly beforeTransforms: readonly ColorTransform[] = [],
    private readonly afterTransforms: readonly ColorTransform[] = [],
    private readonly phase: ResolutionPhase = 'before',
    private readonly toneOverride?: number,
  ) {}

  private resolutionCache?: ResolutionCache;

  /** Construit une couleur figée à partir de coordonnées HCT. */
  static from({ hue, chroma, tone }: ColorValue): Color {
    return new Color({
      kind: 'value',
      argb: solveToArgb(hue, chroma, tone),
    });
  }

  /** Construit une couleur figée à partir d'un hexadécimal. */
  static fromHex(hex: string): Color {
    return new Color({ kind: 'value', argb: argbFromHex(hex) });
  }

  static fromArgb(argb: number): Color {
    return new Color({ kind: 'value', argb });
  }

  /** Valeur HCT interne dont le ton demandé doit rester lisible tel quel. */
  private static fromResolved({ hue, chroma, tone }: ColorValue): Color {
    return new Color(
      { kind: 'value', argb: solveToArgb(hue, chroma, tone) },
      undefined,
      [],
      [],
      'before',
      tone,
    );
  }

  /**
   * Construit une couleur dont la teinte et le chroma viennent d'une palette.
   *
   * La couleur n'est pas encore liée à une API. Le `ColorManager` l'initialise
   * automatiquement lorsqu'il l'enregistre dans un thème.
   */
  static fromPalette(options: PaletteColorOptions): Color;
  static fromPalette(
    palette: PaletteColorOptions['palette'],
    options?: Omit<PaletteColorOptions, 'palette'>,
  ): Color;
  static fromPalette(
    paletteOrOptions: PaletteColorOptions | PaletteColorOptions['palette'],
    options: Omit<PaletteColorOptions, 'palette'> = {},
  ): Color {
    const paletteOptions =
      typeof paletteOrOptions === 'object' &&
      paletteOrOptions !== null &&
      'palette' in paletteOrOptions
        ? paletteOrOptions
        : { ...options, palette: paletteOrOptions };

    return new Color({ kind: 'palette', options: paletteOptions });
  }

  /** Construit un alias résolu à la lecture depuis le registre de couleurs. */
  static alias(alias: string | (() => Color)): Color {
    return new Color({ kind: 'alias', alias });
  }

  /** Construit une couleur qui réapplique une transformation à chaque lecture. */
  static transform(source: Color, transform: ColorTransform): Color {
    return source.transform(transform);
  }

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
  // Résolution                                                 //
  ////////////////////////////////////////////////////////////////

  /**
   * Lie une définition de couleur au contexte d'un thème.
   *
   * Les définitions peuvent être partagées entre plusieurs thèmes. `init`
   * retourne donc une instance liée à cette API au lieu de muter la définition
   * originale. Une couleur déjà initialisée pour la même API est réutilisée.
   */
  init(api: API): Color {
    if (this.api === api) return this;
    if (
      this.source.kind === 'value' &&
      this.beforeTransforms.length === 0 &&
      this.afterTransforms.length === 0
    ) {
      return this;
    }
    return new Color(
      this.source,
      api,
      this.beforeTransforms,
      this.afterTransforms,
      this.phase,
      this.toneOverride,
    );
  }

  private getApi(): API {
    if (!this.api) {
      throw new Error(
        'Color is not initialized. Register it in a theme before reading it.',
      );
    }
    return this.api;
  }

  private resolveTone(
    options: PaletteColorOptions,
    api: API,
    initialTone: number,
  ): number {
    const adjusters = options.adjustTone;
    let tone = initialTone;
    if (!adjusters) return tone;

    const args: ToneAdjusterArgs = {
      context: api.context,
      colors: api.colors,
      palettes: api.palettes,
      tone: initialTone,
    };
    for (const adjust of Array.isArray(adjusters) ? adjusters : [adjusters]) {
      args.tone = tone;
      tone = adjust(args);
    }
    return tone;
  }

  private resolveAlias(source: AliasSource): Color {
    const api = this.getApi();
    const color =
      typeof source.alias === 'string'
        ? api.colors.get(source.alias)
        : source.alias();
    return color.init(api);
  }

  private resolveBase(): ResolutionState {
    switch (this.source.kind) {
      case 'value':
        return { color: Color.fromArgb(this.source.argb) };
      case 'palette': {
        const api = this.getApi();
        const palette = resolvePaletteRef(this.source.options.palette, api);
        const tone = this.source.options.tone?.() ?? DEFAULT_TONE;
        return {
          color: Color.fromResolved({
            hue: palette.hue,
            chroma: palette.chroma,
            tone,
          }),
          palette: { palette, chroma: palette.chroma, tone },
          paletteOptions: this.source.options,
          paletteBase: { hue: palette.hue, chroma: palette.chroma, tone },
        };
      }
      case 'alias':
        return this.resolveAlias(this.source).resolve();
    }
  }

  private applyTransforms(
    color: Color,
    transforms: readonly ColorTransform[],
    deferAfterTransforms = false,
  ): AppliedTransforms {
    let current = color;
    const deferredAfterTransforms: ColorTransform[] = [];
    for (const transform of transforms) {
      const transformed = transform(current);
      if (transformed === current) continue;

      if (deferAfterTransforms && transformed.source === current.source) {
        const beforeOnly = new Color(
          transformed.source,
          this.api,
          transformed.beforeTransforms,
          [],
          'before',
          transformed.toneOverride,
        );
        const initialized = this.api ? beforeOnly.init(this.api) : beforeOnly;
        current = initialized.resolve().color;
        deferredAfterTransforms.push(...transformed.afterTransforms);
        continue;
      }

      const initialized = this.api ? transformed.init(this.api) : transformed;
      current = initialized.resolve().color;
    }
    return { color: current, deferredAfterTransforms };
  }

  private resolve(): ResolutionState {
    const initialVersion = this.getResolutionVersion();
    if (initialVersion && this.isCachedFor(initialVersion)) {
      return this.resolutionCache!.state;
    }

    let state = this.resolveBase();

    // Une personnalisation classique intervient sur la couleur de base. Pour
    // une couleur de palette, cela se produit avant le multiplicateur de
    // chroma et les ajusteurs de ton.
    const before = this.applyTransforms(
      state.color,
      this.beforeTransforms,
      true,
    );
    state = {
      ...state,
      color: before.color,
    };

    if (state.paletteOptions && state.palette) {
      const api = this.getApi();
      const base = state.paletteBase ?? {
        hue: state.palette.palette.hue,
        chroma: state.palette.palette.chroma,
        tone: state.palette.tone,
      };
      const baseColor = Color.fromResolved(base);
      const unchanged = state.color.argb === baseColor.argb;
      const hue = unchanged ? base.hue : state.color.hue;
      const baseChroma = unchanged ? base.chroma : state.color.chroma;
      const baseTone = unchanged ? base.tone : state.color.tone;
      const chromaMultiplier = state.paletteOptions.chromaMultiplier?.() ?? 1;
      const chroma = baseChroma * chromaMultiplier;
      const tone = this.resolveTone(state.paletteOptions, api, baseTone);

      state = {
        color: Color.fromResolved({
          hue,
          chroma,
          tone,
        }),
        palette: {
          palette: state.palette.palette,
          chroma,
          tone,
        },
      };
    }

    const resolvedArgb = state.color.argb;
    const after = this.applyTransforms(state.color, [
      ...before.deferredAfterTransforms,
      ...this.afterTransforms,
    ]);

    const resolved = {
      ...state,
      color: after.color,
      resolvedArgb,
    };

    const finalVersion = this.getResolutionVersion();
    if (finalVersion) {
      this.resolutionCache = { ...finalVersion, state: resolved };
    }

    return resolved;
  }

  private getResolutionVersion(): ResolutionVersion | undefined {
    if (!this.api) return undefined;
    return {
      context: this.api.context.version,
      palettes: this.api.palettes.version,
      colors: this.api.colors.version,
    };
  }

  private isCachedFor(version: ResolutionVersion): boolean {
    const cache = this.resolutionCache;
    return (
      cache !== undefined &&
      cache.context === version.context &&
      cache.palettes === version.palettes &&
      cache.colors === version.colors
    );
  }

  get argb(): number {
    if (
      this.source.kind === 'value' &&
      this.beforeTransforms.length === 0 &&
      this.afterTransforms.length === 0
    ) {
      return this.source.argb;
    }
    return this.resolve().color.argb;
  }

  /**
   * Les paramètres effectivement résolus pour une couleur issue d'une
   * palette. Les personnalisations conservent cette relation afin que les
   * outils puissent toujours identifier la palette d'origine.
   */
  get options(): ResolvedPaletteColor | undefined {
    return this.resolve().palette;
  }

  ////////////////////////////////////////////////////////////////
  // Lecture                                                    //
  ////////////////////////////////////////////////////////////////

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
    if (
      this.source.kind === 'value' &&
      this.beforeTransforms.length === 0 &&
      this.afterTransforms.length === 0
    ) {
      return this.toneOverride ?? lstarFromArgb(this.source.argb);
    }
    const state = this.resolve();
    if (
      state.palette &&
      state.color.argb === state.resolvedArgb &&
      (this.source.kind === 'palette' || this.beforeTransforms.length === 0)
    ) {
      return state.palette.tone;
    }
    if (
      state.color.source.kind === 'value' &&
      state.color.beforeTransforms.length === 0 &&
      state.color.afterTransforms.length === 0
    ) {
      return state.color.toneOverride ?? lstarFromArgb(state.color.source.argb);
    }
    return state.color.tone;
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

  /** Remplace les coordonnées fournies au moment de la résolution. */
  with(partial: Partial<ColorValue>): Color {
    return this.addTransform((color) =>
      Color.fromResolved({
        hue: partial.hue ?? color.hue,
        chroma: partial.chroma ?? color.chroma,
        tone: partial.tone ?? color.tone,
      }),
    );
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
    return this.addTransform((color) =>
      Color.fromResolved({
        hue: sanitizeDegreesDouble(color.hue + degrees),
        chroma: color.chroma,
        tone: color.tone,
      }),
    );
  }

  scaleChroma(factor: number): Color {
    return this.addTransform((color) =>
      Color.fromResolved({
        hue: color.hue,
        chroma: color.chroma * factor,
        tone: color.tone,
      }),
    );
  }

  /**
   * Compose une transformation réévaluée lorsque la source change.
   * Par défaut, elle intervient avant les règles de résolution d'une palette.
   */
  transform(transform: ColorTransform): Color {
    return this.addTransform(transform);
  }

  /** Ajoute explicitement une transformation avant les règles de résolution. */
  beforeResolution(transform: ColorTransform): Color {
    return this.addTransform(transform, 'before');
  }

  /**
   * Bascule les dérivations suivantes après les règles de résolution.
   * Peut aussi recevoir directement une transformation finale.
   */
  afterResolution(): Color;
  afterResolution(transform: ColorTransform): Color;
  afterResolution(transform?: ColorTransform): Color {
    const after = new Color(
      this.source,
      this.api,
      this.beforeTransforms,
      this.afterTransforms,
      'after',
      this.toneOverride,
    );
    return transform ? after.transform(transform) : after;
  }

  private addTransform(
    transform: ColorTransform,
    phase: ResolutionPhase = this.phase,
  ): Color {
    return new Color(
      this.source,
      this.api,
      phase === 'before'
        ? [...this.beforeTransforms, transform]
        : this.beforeTransforms,
      phase === 'after'
        ? [...this.afterTransforms, transform]
        : this.afterTransforms,
      this.phase,
      this.toneOverride,
    );
  }

  /** Ratio de contraste WCAG entre cette couleur et une autre. */
  contrastWith(other: Color): number {
    return Contrast.ratioOfTones(this.tone, other.tone);
  }

  toString(): string {
    return `Color(h=${this.hue.toFixed(0)}, c=${this.chroma.toFixed(0)}, t=${this.tone.toFixed(0)})`;
  }
}
