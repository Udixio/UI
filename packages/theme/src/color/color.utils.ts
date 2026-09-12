import {
  Cam16,
  clampDouble,
  Contrast,
} from '@material/material-color-utilities';
import { solveToArgb } from './hct-math';
import { ContrastCurve } from '../material-color-utilities/contrastCurve';
import { Palette } from '../palette/palette';

export type DynamicColorKey =
  | 'background'
  | 'onBackground'
  | 'surface'
  | 'surfaceDim'
  | 'surfaceBright'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'onSurface'
  | 'surfaceVariant'
  | 'onSurfaceVariant'
  | 'inverseSurface'
  | 'inverseOnSurface'
  | 'outline'
  | 'outlineVariant'
  | 'surfaceTint'
  | 'primary'
  | 'primaryDim'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'inversePrimary'
  | 'secondary'
  | 'secondaryDim'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'tertiary'
  | 'tertiaryDim'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'error'
  | 'errorDim'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'primaryFixed'
  | 'primaryFixedDim'
  | 'onPrimaryFixed'
  | 'onPrimaryFixedVariant'
  | 'secondaryFixed'
  | 'secondaryFixedDim'
  | 'onSecondaryFixed'
  | 'onSecondaryFixedVariant'
  | 'tertiaryFixed'
  | 'tertiaryFixedDim'
  | 'onTertiaryFixed'
  | 'onTertiaryFixedVariant';

/**
 * The contrast ratios for which Material defines a standard curve.
 *
 * The domain is deliberately closed: `getCurve()` is a table, not a formula.
 * For any other curve, build it directly with
 * `new ContrastCurve(low, normal, medium, high)`.
 */
export type StandardContrastRatio = 1.5 | 3 | 4.5 | 6 | 7 | 9 | 11 | 21;

/**
 * Material's standard curves, indexed by their ratio at the normal contrast
 * level. Each entry gives the target ratios at levels -1, 0, 0.5 and 1.
 */
const STANDARD_CURVES: Record<
  StandardContrastRatio,
  readonly [number, number, number, number]
> = {
  1.5: [1.5, 1.5, 3, 5.5],
  3: [3, 3, 4.5, 7],
  4.5: [4.5, 4.5, 7, 11],
  6: [6, 6, 7, 11],
  7: [7, 7, 11, 21],
  9: [9, 9, 11, 21],
  11: [11, 11, 21, 21],
  21: [21, 21, 21, 21],
};

/**
 * Material's standard curve for a given ratio.
 *
 * @throws if the ratio is not in the table — better to fail than to return a
 *     curve nobody drew.
 */
export function getCurve(ratio: StandardContrastRatio): ContrastCurve {
  const curve = STANDARD_CURVES[ratio];
  if (!curve) {
    throw new Error(
      `getCurve() only knows Material's standard ratios ` +
        `(${Object.keys(STANDARD_CURVES).join(', ')}), received: ${ratio}. ` +
        `For any other curve: new ContrastCurve(low, normal, medium, high).`,
    );
  }
  return new ContrastCurve(...curve);
}

export function tMaxC(
  palette: Palette,
  lowerBound = 0,
  upperBound = 100,
  chromaMultiplier = 1,
): number {
  const answer = findBestToneForChroma(
    palette.hue,
    palette.chroma * chromaMultiplier,
    100,
    true,
  );
  return clampDouble(lowerBound, upperBound, answer);
}

export function tMinC(
  palette: Palette,
  lowerBound = 0,
  upperBound = 100,
): number {
  const answer = findBestToneForChroma(palette.hue, palette.chroma, 0, false);
  return clampDouble(lowerBound, upperBound, answer);
}

export function findBestToneForChroma(
  hue: number,
  chroma: number,
  tone: number,
  byDecreasingTone: boolean,
): number {
  // Read the chroma back from the ARGB, not from `Color.from`, which would
  // keep the request: the tone-by-tone walk relies on sRGB quantization, as
  // in Material.
  const displayedChroma = (candidateTone: number) =>
    Cam16.fromInt(solveToArgb(hue, chroma, candidateTone)).chroma;

  let answer = tone;
  let bestChroma = displayedChroma(answer);
  while (bestChroma < chroma) {
    if (tone < 0 || tone > 100) {
      break;
    }
    tone += byDecreasingTone ? -1.0 : 1.0;
    const newChroma = displayedChroma(tone);
    if (bestChroma < newChroma) {
      bestChroma = newChroma;
      answer = tone;
    }
  }

  return answer;
}

/**
 * Computes the percentage of tone adjustment needed to reach a contrast ratio.
 *
 * @param toneA The first tone (for example, a surface tone).
 * @param toneB The target tone to adjust.
 * @param desiredRatio The required contrast ratio (e.g. 3, 4.5, 7).
 * @returns A percentage (between 0 and 100) indicating the effort needed:
 * - 0% if `toneB` already meets the ratio.
 * - A positive or negative percentage depending on the distance to adjust.
 */
export function calculateToneAdjustmentPercentage(
  toneA: number,
  toneB: number,
  desiredRatio: number,
): number {
  // Check the current ratio
  const currentRatio = Contrast.ratioOfTones(toneA, toneB);

  // If the ratio is already met, nothing to change
  if (currentRatio >= desiredRatio) {
    return 0;
  }

  // Find the lowest lighter tone that meets the ratio
  const lighterTone = Contrast.lighter(toneA, desiredRatio);

  // Find the highest darker tone that meets the ratio
  const darkerTone = Contrast.darker(toneA, desiredRatio);

  // Check which direction is reachable and compare against toneB
  if (lighterTone !== -1 && toneB < lighterTone) {
    const percentageToAdjust = (toneB - lighterTone) / (toneA - lighterTone);
    return clampDouble(0, 1, percentageToAdjust);
  }

  if (darkerTone !== -1 && toneB > darkerTone) {
    const percentageToAdjust = (toneB - darkerTone) / (toneA - darkerTone);
    return clampDouble(0, 1, percentageToAdjust);
  }

  // No adjustment possible or needed
  return 0;
}
