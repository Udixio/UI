import { clampDouble, Contrast } from '@material/material-color-utilities';
import { Color } from './color.base';
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
 * Les ratios de contraste pour lesquels Material définit une courbe standard.
 *
 * Le domaine est volontairement clos : `getCurve()` est une table, pas une
 * formule. Pour toute autre courbe, construis-la directement avec
 * `new ContrastCurve(low, normal, medium, high)`.
 */
export type StandardContrastRatio = 1.5 | 3 | 4.5 | 6 | 7 | 9 | 11 | 21;

/**
 * Courbes standard de Material, indexées par leur ratio au niveau de contraste
 * normal. Chaque entrée donne les ratios visés aux niveaux -1, 0, 0.5 et 1.
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
 * La courbe standard de Material pour un ratio donné.
 *
 * @throws si le ratio ne figure pas dans la table — mieux vaut échouer que
 *     rendre une courbe que personne n'a dessinée.
 */
export function getCurve(ratio: StandardContrastRatio): ContrastCurve {
  const curve = STANDARD_CURVES[ratio];
  if (!curve) {
    throw new Error(
      `getCurve() ne connaît que les ratios standard de Material ` +
        `(${Object.keys(STANDARD_CURVES).join(', ')}), reçu : ${ratio}. ` +
        `Pour toute autre courbe : new ContrastCurve(low, normal, medium, high).`,
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
  let answer = tone;
  let bestCandidate = Color.from({ hue, chroma, tone: answer });
  while (bestCandidate.chroma < chroma) {
    if (tone < 0 || tone > 100) {
      break;
    }
    tone += byDecreasingTone ? -1.0 : 1.0;
    const newCandidate = Color.from({ hue, chroma, tone });
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
