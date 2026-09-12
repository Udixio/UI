import { atom } from 'nanostores';
import config from '../../theme.config';
import {
  API,
  Color,
  type ColorsConfig,
  type ConfigInterface,
  type PaletteCallback,
  surfaceContainerTone,
} from '@udixio/theme';

export const themeConfigStore = atom<ConfigInterface>({
  ...config,
  sourceColor:
    typeof config.sourceColor === 'string'
      ? Color.fromHex(config.sourceColor)
      : config.sourceColor,
});

export const themeServiceStore = atom<API | null>(null);

/**
 * A configuration's source color, always as a `Color`.
 *
 * The builder works in continuous HCT coordinates: a hex is an 8-bit-per-channel
 * grid, and every round trip through that grid shifts the chroma and hue by a
 * few tenths. The hex is only a view (input field, export); the source of
 * truth stays the `Color`.
 */
export const resolveSourceColor = (
  sourceColor: ConfigInterface['sourceColor'],
): Color => {
  if (sourceColor instanceof Color) return sourceColor;
  if (typeof sourceColor === 'string') return Color.fromHex(sourceColor);
  const api = themeServiceStore.get();
  if (api) return api.context.sourceColor;
  throw new Error('A dynamic source colour needs a loaded theme to resolve');
};

const secondaryHuePaletteOverrides = new WeakSet<PaletteCallback>();

export const markSecondaryHuePaletteOverride = (callback: PaletteCallback) => {
  secondaryHuePaletteOverrides.add(callback);
  return callback;
};

export const isSecondaryHuePaletteOverride = (
  value: unknown,
): value is PaletteCallback =>
  typeof value === 'function' &&
  secondaryHuePaletteOverrides.has(value as PaletteCallback);

const backgroundChromaPaletteOverrides = new WeakMap<PaletteCallback, number>();

/**
 * Builds the neutral palette override driven by the "Background tint" slider:
 * the chroma inherited from the variant, multiplied by `1 + level` (0 → ×1,
 * -1 → pure gray, +1 → ×2). The level stays readable on the callback for the
 * export and to tell this override apart from a manual edit.
 */
export const createBackgroundChromaPaletteOverride = (
  level: number,
): PaletteCallback => {
  const callback: PaletteCallback = (_context, base) => {
    if (!base)
      throw new Error('Background chroma requires the neutral palette');
    return { ...base, chroma: base.chroma * (1 + level) };
  };
  backgroundChromaPaletteOverrides.set(callback, level);
  return callback;
};

export const getBackgroundChromaPaletteOverride = (
  value: unknown,
): number | null =>
  typeof value === 'function'
    ? (backgroundChromaPaletteOverrides.get(value as PaletteCallback) ?? null)
    : null;

export const isBackgroundChromaPaletteOverride = (value: unknown): boolean =>
  getBackgroundChromaPaletteOverride(value) !== null;

/** The overrides set by the builder's sliders, as opposed to a manual edit. */
export const isDerivedPaletteOverride = (value: unknown): boolean =>
  isSecondaryHuePaletteOverride(value) ||
  isBackgroundChromaPaletteOverride(value);

/**
 * The layers on which the udixio variant places its surfaces, in
 * `surfaceContainerTone` order. `surfaceDim` and `surfaceBright` swap layers
 * between modes.
 */
const SURFACE_LAYERS = {
  surface: 0.5,
  surfaceContainerLowest: 0,
  surfaceContainerLow: 1,
  surfaceContainer: 2,
  surfaceContainerHigh: 3,
  surfaceContainerHighest: 4,
} as const;
const OUTER_SURFACE_LAYERS = { near: 0.5, far: 5 } as const;

const surfaceLevelColors = new WeakMap<ColorsConfig, number>();

/**
 * Builds the `colors` configuration driven by the "Background level" slider:
 * 1 leaves the variant intact, 0 brings `surface` back to layer 0.1 (offset
 * −0.4), and each step from 2 to 5 adds a layer. Tones are still computed by
 * `surfaceContainerTone`, so they follow the mode and the contrast.
 */
export const DEFAULT_SURFACE_LEVEL = 1;

export const surfaceLevelShift = (level: number): number =>
  level === 0 ? -0.4 : level - DEFAULT_SURFACE_LEVEL;

export const createSurfaceLevelColors = (level: number): ColorsConfig => {
  const shift = surfaceLevelShift(level);
  const layer = (base: number) => Math.max(0, base + shift);

  const colors: ColorsConfig = (api) => ({
    ...Object.fromEntries(
      Object.entries(SURFACE_LAYERS).map(([key, base]) => [
        key,
        (color) => color.withTone(surfaceContainerTone(layer(base), api)),
      ]),
    ),
    surfaceDim: (color) =>
      color.withTone(
        surfaceContainerTone(
          layer(
            api.context.isDark
              ? OUTER_SURFACE_LAYERS.near
              : OUTER_SURFACE_LAYERS.far,
          ),
          api,
        ),
      ),
    surfaceBright: (color) =>
      color.withTone(
        surfaceContainerTone(
          layer(
            api.context.isDark
              ? OUTER_SURFACE_LAYERS.far
              : OUTER_SURFACE_LAYERS.near,
          ),
          api,
        ),
      ),
  });
  surfaceLevelColors.set(colors, level);
  return colors;
};

export const getSurfaceLevelColors = (value: unknown): number | null =>
  typeof value === 'function'
    ? (surfaceLevelColors.get(value as ColorsConfig) ?? null)
    : null;

/**
 * The API is updated in place by ThemeProvider. This revision lets views that
 * read its dynamic colors refresh without replacing the shared instance.
 */
export const themeServiceVersionStore = atom(0);
