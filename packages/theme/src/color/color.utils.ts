import { clampDouble, Contrast } from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
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

/**
 * Calcule le pourcentage des tons à ajuster pour atteindre un ratio de contraste.
 *
 * @param toneA Le premier ton (par exemple, tone de surface).
 * @param toneB Le ton cible à ajuster.
 * @param desiredRatio Le ratio de contraste requis (ex : 3, 4.5, 7).
 * @returns Un pourcentage (entre 0 et 100) indiquant l'effort nécessaire :
 * - 0% si `toneB` est au bon ratio.
 * - Un pourcentage positif ou négatif en fonction de la distance à ajuster.
 */
export function calculateToneAdjustmentPercentage(
  toneA: number,
  toneB: number,
  desiredRatio: number,
): number {
  // Vérification du ratio actuel
  const currentRatio = Contrast.ratioOfTones(toneA, toneB);

  // Si le ratio est déjà atteint, inutile de changer
  if (currentRatio >= desiredRatio) {
    return 0;
  }

  // Calcul pour déterminer le ton minimal plus clair qui respecte le ratio
  const lighterTone = Contrast.lighter(toneA, desiredRatio);

  // Calcul pour déterminer le ton maximal plus sombre qui respecte le ratio
  const darkerTone = Contrast.darker(toneA, desiredRatio);

  // Vérifie quelle direction est atteignable et compare à toneB
  if (lighterTone !== -1 && toneB < lighterTone) {
    const percentageToAdjust = (toneB - lighterTone) / (toneA - lighterTone);
    return clampDouble(0, 1, percentageToAdjust);
  }

  if (darkerTone !== -1 && toneB > darkerTone) {
    const percentageToAdjust = (toneB - darkerTone) / (toneA - darkerTone);
    return clampDouble(0, 1, percentageToAdjust);
  }

  // Si aucun ajustement n'est possible ou nécessaire
  return 0;
}
