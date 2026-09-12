import type { Palette } from '../palette/palette';
import type { PaletteRef, ToneAdjuster } from './tone-adjusters';
import type { Color } from './color.base';
import type { API } from '../API';

/** The three perceptual coordinates that define a color. */
export type ColorValue = {
  /** Hue, in degrees. 0 <= hue < 360. */
  hue: number;
  /** Colorfulness. The reachable maximum depends on `hue` and `tone`. */
  chroma: number;
  /** Perceptual lightness. 0 <= tone <= 100. */
  tone: number;
};

/**
 * Color value accepted at the configuration boundary.
 *
 * Strings remain the intended shortcut for everyday configurations; the
 * engine then turns them into `Color`.
 */
export type ColorInput = string | Color;

/**
 * Transforms a color during its resolution.
 *
 * By default the callback receives the base color, before the rules specific
 * to a palette color. `afterResolution()` targets the final value instead.
 */
export type ColorTransform = (color: Color) => Color;

/**
 * Definition accepted in the configuration: a direct value or a transform of
 * the color already provided by the variant.
 */
export type ColorDefinition = ColorInput | ColorTransform;

/** A collection of color definitions, optionally computed from the API. */
export type ColorConfigRecord<Value> =
  Record<string, Value> | ((api: API) => Record<string, Value>);

/** Common contract of configuration colors and variants. */
export type ColorsConfig = ColorConfigRecord<ColorDefinition>;

/**
 * @param palette Source palette, which provides the hue and chroma. Referenced
 *     by its key — `'neutral'` — or directly. Passing it rather than a
 *     hue/chroma pair preserves the intended chroma when the tone moves.
 * @param tone The default tone. Falls back to {@link DEFAULT_TONE}.
 * @param adjustTone Adjusts the tone after the color's regular
 *     customizations. Compose whatever you need — `contrastAgainst`,
 *     `avoidBackgroundGap`, `applyToneDelta`, `arbitrateBackgrounds`, or your
 *     own computation.
 * @param chromaMultiplier Factor applied to the chroma after the regular
 *     customizations. Defaults to 1.
 */
export type PaletteColorOptions = {
  palette: PaletteRef;
  tone?: () => number;
  adjustTone?: ToneAdjuster | ToneAdjuster[];
  chromaMultiplier?: () => number | undefined;
};

/** The same options, once resolved. */
export type ResolvedPaletteColor = {
  palette: Palette;
  tone: number;
  /** The chroma actually applied: the palette's, multiplied. */
  chroma: number;
};

/**
 * Former name of the registry's direct entry.
 *
 * Palette recipes now go through `Color.fromPalette()`.
 */
export type ColorOptions = ColorInput;

/** Former name of a registrable definition. */
export type ColorRegistration = ColorDefinition;
