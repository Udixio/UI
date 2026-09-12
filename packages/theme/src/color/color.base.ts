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
 * The engine's single color value.
 *
 * A color can be a fixed value, a resolution from a palette, or an alias.
 * Transforms stay in the definition and are evaluated at resolution time.
 * This lets the same dynamic color be reused across several themes and
 * contexts.
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
    /**
     * The coordinates requested when constructing a value color.
     * ARGB is an 8-bit-per-channel grid bounded by the sRGB gamut: reading
     * hue, chroma and tone back from it shifts them by a few tenths, and
     * clips the chroma as soon as it exceeds what the tone allows. The color
     * stays faithful to what was asked of it — it is the configuration — and
     * `argb`/`hex` say what is displayed. A clipped chroma can be read with
     * `Color.maxChroma(color)`.
     */
    private readonly requested?: Partial<ColorValue>,
  ) {}

  private resolutionCache?: ResolutionCache;

  /** Builds a fixed color from HCT coordinates. */
  static from(value: ColorValue): Color {
    const { hue, chroma, tone } = value;
    return new Color(
      { kind: 'value', argb: solveToArgb(hue, chroma, tone) },
      undefined,
      [],
      [],
      'before',
      { hue, chroma, tone },
    );
  }

  /** Builds a fixed color from a hex string. */
  static fromHex(hex: string): Color {
    return new Color({ kind: 'value', argb: argbFromHex(hex) });
  }

  static fromArgb(argb: number): Color {
    return new Color({ kind: 'value', argb });
  }

  /**
   * Internal HCT value of a derived color: only the requested tone stays
   * readable as is. Hue and chroma are read back from the ARGB, as Material
   * does at every step — that is what keeps the variants compliant.
   */
  private static fromResolved({ hue, chroma, tone }: ColorValue): Color {
    return new Color(
      { kind: 'value', argb: solveToArgb(hue, chroma, tone) },
      undefined,
      [],
      [],
      'before',
      { tone },
    );
  }

  /**
   * Builds a color whose hue and chroma come from a palette.
   *
   * The color is not bound to an API yet. The `ColorManager` initializes it
   * automatically when registering it in a theme.
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

  /** Builds an alias resolved on read from the color registry. */
  static alias(alias: string | (() => Color)): Color {
    return new Color({ kind: 'alias', alias });
  }

  /** Builds a color that reapplies a transform on every read. */
  static transform(source: Color, transform: ColorTransform): Color {
    return source.transform(transform);
  }

  /**
   * The maximum chroma reachable for a given hue and tone.
   *
   * Accepts either a `(hue, tone)` pair, or directly a `Color` whose hue and
   * tone are read.
   */
  static maxChroma(color: Color): number;
  static maxChroma(hue: number, tone?: number): number;
  static maxChroma(hueOrColor: number | Color, tone = DEFAULT_TONE): number {
    const { hue, tone: resolvedTone } =
      typeof hueOrColor === 'number'
        ? { hue: hueOrColor, tone }
        : { hue: hueOrColor.hue, tone: hueOrColor.tone };
    // Read the ARGB, not the color: `Color.from` would keep the requested 200.
    return Cam16.fromInt(solveToArgb(hue, 200, resolvedTone)).chroma;
  }

  /**
   * The peak chroma of a hue: the largest displayable chroma across all
   * tones. Each hue peaks at a different tone (a red around 53, a cyan around
   * 89).
   */
  static peakChroma(hue: number): number {
    let peak = 0;
    for (let tone = 0; tone <= 100; tone++) {
      peak = Math.max(peak, Color.maxChroma(hue, tone));
    }
    return peak;
  }

  /**
   * The range of maximum chromas over the 360 hues at a given tone: the hue
   * most constrained by the sRGB gamut at that tone and the freest one.
   * Around tone 50 that is a cyan and a red; above 80 the order flips, red
   * becoming the most constrained hue.
   */
  static chromaRangeAt(tone: number): [number, number] {
    let low = Infinity;
    let high = 0;
    for (let hue = 0; hue < 360; hue++) {
      const chroma = Color.maxChroma(hue, tone);
      low = Math.min(low, chroma);
      high = Math.max(high, chroma);
    }
    return [low, high];
  }

  /**
   * The range of peak chromas over the 360 hues: the hue most constrained by
   * the sRGB gamut and the freest one.
   *
   * The computation walks 360 × 101 HCT resolutions; it is meant to establish
   * constants, not to be called on every render.
   */
  static gamutChromaRange(): [number, number] {
    const peaks = Array.from({ length: 360 }, (_, hue) =>
      Color.peakChroma(hue),
    );
    return [Math.min(...peaks), Math.max(...peaks)];
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
  // Resolution                                                 //
  ////////////////////////////////////////////////////////////////

  /**
   * Binds a color definition to a theme's context.
   *
   * Definitions may be shared between several themes, so `init` returns an
   * instance bound to this API instead of mutating the original definition.
   * A color already initialized for the same API is reused.
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
      this.requested,
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
          transformed.requested,
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

    // A regular customization acts on the base color. For a palette color,
    // that happens before the chroma multiplier and the tone adjusters.
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
   * The parameters actually resolved for a color derived from a palette.
   * Customizations keep this relationship so tools can always identify the
   * originating palette.
   */
  get options(): ResolvedPaletteColor | undefined {
    return this.resolve().palette;
  }

  ////////////////////////////////////////////////////////////////
  // Reading                                                    //
  ////////////////////////////////////////////////////////////////

  private _cam?: Cam16;
  private _camArgb?: number;

  /** Memoized Cam16, recomputed only when the resolved ARGB has changed. */
  private get cam(): Cam16 {
    const argb = this.argb;
    if (this._cam === undefined || this._camArgb !== argb) {
      this._cam = Cam16.fromInt(argb);
      this._camArgb = argb;
    }
    return this._cam;
  }

  /** The bare value color whose request is authoritative, if there is one. */
  private get plainValue(): Color | undefined {
    if (
      this.source.kind === 'value' &&
      this.beforeTransforms.length === 0 &&
      this.afterTransforms.length === 0
    ) {
      return this;
    }
    const resolved = this.resolve().color;
    if (
      resolved.source.kind === 'value' &&
      resolved.beforeTransforms.length === 0 &&
      resolved.afterTransforms.length === 0
    ) {
      return resolved;
    }
    return undefined;
  }

  get hue(): number {
    return this.plainValue?.requested?.hue ?? this.cam.hue;
  }

  get chroma(): number {
    return this.plainValue?.requested?.chroma ?? this.cam.chroma;
  }

  get tone(): number {
    if (
      this.source.kind === 'value' &&
      this.beforeTransforms.length === 0 &&
      this.afterTransforms.length === 0
    ) {
      return this.requested?.tone ?? lstarFromArgb(this.source.argb);
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
      return (
        state.color.requested?.tone ?? lstarFromArgb(state.color.source.argb)
      );
    }
    return state.color.tone;
  }

  get hex(): string {
    return hexFromArgb(this.argb);
  }

  get rgb(): { r: number; g: number; b: number } {
    return argbToRgb(this.argb);
  }

  /** All three coordinates at once, handy for destructuring. */
  get value(): ColorValue {
    return { hue: this.hue, chroma: this.chroma, tone: this.tone };
  }

  ////////////////////////////////////////////////////////////////
  // Derivation                                                 //
  ////////////////////////////////////////////////////////////////

  /** Replaces the given coordinates at resolution time. */
  with(partial: Partial<ColorValue>): Color {
    return this.addTransform((color) =>
      Color.fromResolved({
        hue: partial.hue ?? color.hue,
        chroma: partial.chroma ?? color.chroma,
        tone: partial.tone ?? color.tone,
      }),
    );
  }

  /** Replaces the hue, keeps chroma and tone. */
  withHue(hue: number): Color {
    return this.with({ hue });
  }

  withChroma(chroma: number): Color {
    return this.with({ chroma });
  }

  withTone(tone: number): Color {
    return this.with({ tone });
  }

  /** Shifts the hue, normalized to 360°. */
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
   * Composes a transform re-evaluated whenever the source changes.
   * By default it runs before a palette's resolution rules.
   */
  transform(transform: ColorTransform): Color {
    return this.addTransform(transform);
  }

  /** Explicitly adds a transform before the resolution rules. */
  beforeResolution(transform: ColorTransform): Color {
    return this.addTransform(transform, 'before');
  }

  /**
   * Switches the following derivations to after the resolution rules.
   * Can also receive a final transform directly.
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
      this.requested,
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
      this.requested,
    );
  }

  /** WCAG contrast ratio between this color and another. */
  contrastWith(other: Color): number {
    return Contrast.ratioOfTones(this.tone, other.tone);
  }

  toString(): string {
    return `Color(h=${this.hue.toFixed(0)}, c=${this.chroma.toFixed(0)}, t=${this.tone.toFixed(0)})`;
  }
}
