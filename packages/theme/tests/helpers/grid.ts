/**
 * Shared test grid for the theme package.
 *
 * Every colour test builds the same cartesian product so that a conformance
 * failure and a snapshot failure can be read against each other case by case.
 * The case key format is `variant|mode|contrastLevel|seed`.
 */
import { loader } from '../../src/loader/loader.js';
import { Variants } from '../../src/variant/variants/index.js';

/**
 * Seeds chosen to exercise the hue circle plus the edge cases the spec special
 * cases: yellow (both sides of the isYellow breakpoint), cyan, an achromatic
 * colour, and the two tone extremes.
 */
export const SEEDS = [
  '#0b57d0', // blue
  '#6750a4', // purple, the Material reference seed
  '#b3261e', // red
  '#4caf50', // green
  '#ffde3f', // yellow
  '#f2c100', // yellow, other side of the breakpoint
  '#ff8a00', // orange
  '#008080', // teal
  '#e91e63', // pink
  '#00bcd4', // cyan
  '#808080', // achromatic, very low chroma
  '#000000', // tone 0
  '#ffffff', // tone 100
] as const;

/**
 * The negative levels are near-inert in spec 2025, because every contrast
 * curve has `low === normal`. They are kept on purpose: that inertness is a
 * spec property worth locking down.
 */
export const CONTRAST_LEVELS = [-1, -0.5, 0, 0.5, 1] as const;

export const MODES = [false, true] as const;

/** Variants that have an upstream counterpart to be measured against. */
export const STANDARD_VARIANTS = [
  'TonalSpot',
  'Vibrant',
  'Expressive',
  'Neutral',
] as const;

export interface CaseSnapshot {
  palettes: Record<string, [number, number]>;
  colors: Record<string, string>;
}

export type GridSnapshot = Record<string, CaseSnapshot>;

export function caseKey(
  variant: string,
  isDark: boolean,
  contrastLevel: number,
  sourceColor: string,
): string {
  return `${variant}|${isDark ? 'dark' : 'light'}|${contrastLevel}|${sourceColor}`;
}

/**
 * Resolves every colour role and palette of the given variants over the grid.
 *
 * @param variantKeys keys of the `Variants` map; defaults to all of them.
 */
export async function buildGrid(
  variantKeys: readonly string[] = Object.keys(Variants),
): Promise<GridSnapshot> {
  const snapshot: GridSnapshot = {};

  for (const variantKey of variantKeys) {
    const variant = Variants[variantKey as keyof typeof Variants];
    if (!variant) throw new Error(`Unknown variant key: ${variantKey}`);

    for (const isDark of MODES) {
      for (const contrastLevel of CONTRAST_LEVELS) {
        for (const sourceColor of SEEDS) {
          const api = await loader(
            { sourceColor, variant, isDark, contrastLevel },
            false, // skip plugins, we only need the resolved colours
          );

          const colors: Record<string, string> = {};
          for (const [name, color] of api.colors.getAll()) {
            colors[name] = color.hex;
          }

          const palettes: Record<string, [number, number]> = {};
          for (const [name, palette] of Object.entries(api.palettes.getAll())) {
            palettes[name] = [palette.hue, palette.chroma];
          }

          snapshot[caseKey(variantKey, isDark, contrastLevel, sourceColor)] = {
            palettes,
            colors,
          };
        }
      }
    }
  }

  return snapshot;
}
