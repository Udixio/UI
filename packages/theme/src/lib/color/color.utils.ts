import { clampDouble, TonalPalette } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { ContrastCurve } from '../material-color-utilities/contrastCurve';

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

export function getCurve(defaultContrast: number): ContrastCurve {
  if (defaultContrast === 1.5) {
    return new ContrastCurve(1.5, 1.5, 3, 4.5);
  } else if (defaultContrast === 3) {
    return new ContrastCurve(3, 3, 4.5, 7);
  } else if (defaultContrast === 4.5) {
    return new ContrastCurve(4.5, 4.5, 7, 11);
  } else if (defaultContrast === 6) {
    return new ContrastCurve(6, 6, 7, 11);
  } else if (defaultContrast === 7) {
    return new ContrastCurve(7, 7, 11, 21);
  } else if (defaultContrast === 9) {
    return new ContrastCurve(9, 9, 11, 21);
  } else if (defaultContrast === 11) {
    return new ContrastCurve(11, 11, 21, 21);
  } else if (defaultContrast === 21) {
    return new ContrastCurve(21, 21, 21, 21);
  } else {
    // Shouldn't happen.
    return new ContrastCurve(defaultContrast, defaultContrast, 7, 21);
  }
}

export function tMaxC(
  palette: TonalPalette,
  lowerBound: number = 0,
  upperBound: number = 100,
  chromaMultiplier: number = 1,
): number {
  let answer = findBestToneForChroma(
    palette.hue,
    palette.chroma * chromaMultiplier,
    100,
    true,
  );
  return clampDouble(lowerBound, upperBound, answer);
}

export function tMinC(
  palette: TonalPalette,
  lowerBound: number = 0,
  upperBound: number = 100,
): number {
  let answer = findBestToneForChroma(palette.hue, palette.chroma, 0, false);
  return clampDouble(lowerBound, upperBound, answer);
}

export function findBestToneForChroma(
  hue: number,
  chroma: number,
  tone: number,
  byDecreasingTone: boolean,
): number {
  let answer = tone;
  let bestCandidate = Hct.from(hue, chroma, answer);
  while (bestCandidate.chroma < chroma) {
    if (tone < 0 || tone > 100) {
      break;
    }
    tone += byDecreasingTone ? -1.0 : 1.0;
    const newCandidate = Hct.from(hue, chroma, tone);
    if (bestCandidate.chroma < newCandidate.chroma) {
      bestCandidate = newCandidate;
      answer = tone;
    }
  }

  return answer;
}
