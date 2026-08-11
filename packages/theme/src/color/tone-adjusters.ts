import { clampDouble, Contrast } from '@material/material-color-utilities';
import { ContrastCurve, DynamicColor } from '../material-color-utilities';
import type { Context } from '../context';
import type { Palette } from '../palette/palette';
import type { Color } from './color';

/**
 * Ajuste le ton par défaut d'une couleur.
 *
 * Reçoit le ton déclaré par l'option `tone` et rend celui à retenir. Il n'y a
 * pas d'étape appliquée avant ni après : le corps compose ce qu'il veut — les
 * helpers de ce module, du code maison, ou les deux.
 */
export type ToneAdjuster = (args: {
  context: Context;
  /** Le ton déclaré par l'option `tone`, avant tout ajustement. */
  tone: number;
  /** La palette de la couleur, pratique pour `tMaxC` / `tMinC`. */
  palette: Palette;
}) => number;

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

/**
 * Sens de l'écart, décrit **depuis la couleur qui le déclare**.
 *
 * `relative_darker` et `relative_lighter` suivent la tendance des surfaces :
 * vers le blanc en mode clair, vers le noir en mode sombre.
 */
export type TonePolarity =
  | 'darker'
  | 'lighter'
  | 'relative_darker'
  | 'relative_lighter';

/** Comment satisfaire la contrainte d'écart. */
export type DeltaConstraint = 'exact' | 'nearer' | 'farther';

/**
 * Contrainte d'écart de ton vis-à-vis d'une autre couleur, quand les deux
 * doivent rester visuellement distinctes sans être dans une relation
 * fond / premier plan.
 *
 * `{ relativeTo: primaryContainer, delta: 5, polarity: 'relative_darker',
 * constraint: 'farther' }` se lit : « je dois être au moins 5 plus sombre que
 * `primaryContainer` ».
 */
export type ToneDelta = {
  /** L'autre couleur, dont le ton est déjà résolu. */
  relativeTo: Color;
  /** Écart requis, en valeur absolue. */
  delta: number;
  polarity: TonePolarity;
  /** `exact` fige le ton ; `nearer` et `farther` le bornent. */
  constraint: DeltaConstraint;
};

/**
 * Impose un écart de ton vis-à-vis d'une autre couleur.
 *
 * Avec `constraint: 'exact'`, le ton rendu vaut exactement celui de l'autre
 * couleur décalé de `delta` : n'enchaîne pas sur {@link avoidBackgroundGap}
 * après coup, tu violerais la contrainte que tu viens de poser.
 */
export function applyToneDelta(
  tone: number,
  { relativeTo, delta, polarity, constraint }: ToneDelta,
  isDark: boolean,
): number {
  const signed =
    polarity === 'darker' ||
    (polarity === 'relative_lighter' && isDark) ||
    (polarity === 'relative_darker' && !isDark)
      ? -delta
      : delta;

  const reference = relativeTo.tone;

  if (constraint === 'exact') {
    return clampDouble(0, 100, reference + signed);
  }
  if (constraint === 'nearer') {
    return signed > 0
      ? clampDouble(0, 100, clampDouble(reference, reference + signed, tone))
      : clampDouble(0, 100, clampDouble(reference + signed, reference, tone));
  }
  return signed > 0
    ? clampDouble(reference + signed, 100, tone)
    : clampDouble(0, reference + signed, tone);
}

/**
 * Pousse le ton jusqu'à ce qu'il contraste au moins de `ratio` avec `background`.
 *
 * Le ton est laissé tel quel s'il satisfait déjà le ratio — sauf en contraste
 * négatif, où l'on recalcule pour pouvoir le réduire.
 */
export function contrastAgainst(
  tone: number,
  background: Color,
  ratio: number,
  contrastLevel: number,
): number {
  const backgroundTone = background.tone;
  if (
    Contrast.ratioOfTones(backgroundTone, tone) >= ratio &&
    contrastLevel >= 0
  ) {
    return tone;
  }
  return DynamicColor.foregroundTone(backgroundTone, ratio);
}

/**
 * Écarte le ton de la bande où aucun premier plan n'obtient un contraste
 * suffisant. À n'appliquer qu'aux couleurs qui servent de fond.
 */
export function avoidBackgroundGap(tone: number): number {
  const { pivot, lightFloor, darkCeiling } = BACKGROUND_TONE_GAP;
  return tone >= pivot
    ? clampDouble(lightFloor, 100, tone)
    : clampDouble(0, darkCeiling, tone);
}

/**
 * Cherche un ton qui contraste d'au moins `ratio` avec deux fonds à la fois.
 * Rend le ton inchangé s'il satisfait déjà les deux.
 */
export function arbitrateBackgrounds(
  tone: number,
  background: Color,
  secondBackground: Color,
  ratio: number,
): number {
  const [toneA, toneB] = [background.tone, secondBackground.tone];
  const [upper, lower] = [Math.max(toneA, toneB), Math.min(toneA, toneB)];

  if (
    Contrast.ratioOfTones(upper, tone) >= ratio &&
    Contrast.ratioOfTones(lower, tone) >= ratio
  ) {
    return tone;
  }

  // Le ton clair le plus sombre qui satisfait le ratio, ou -1.
  const lightOption = Contrast.lighter(upper, ratio);
  // Le ton sombre le plus clair qui satisfait le ratio, ou -1.
  const darkOption = Contrast.darker(lower, ratio);

  const prefersLight =
    DynamicColor.tonePrefersLightForeground(toneA) ||
    DynamicColor.tonePrefersLightForeground(toneB);
  if (prefersLight) {
    return lightOption < 0 ? 100 : lightOption;
  }

  const availables = [];
  if (lightOption !== -1) availables.push(lightOption);
  if (darkOption !== -1) availables.push(darkOption);
  if (availables.length === 1) {
    return availables[0];
  }
  return darkOption < 0 ? 0 : darkOption;
}

/**
 * Le ton d'un premier plan posé sur `background` : part du ton du fond et le
 * pousse jusqu'à atteindre `ratio`.
 *
 * C'est la forme de tous les tokens `on*`. Équivaut à écrire à la main :
 *
 * ```ts
 * tone: ({ context }) => {
 *   const on = colors.get('primary');
 *   return contrastAgainst(on.tone, on, getCurve(6).get(context.contrastLevel), context.contrastLevel);
 * }
 * ```
 */
export function onColor(
  background: () => Color,
  curve: ContrastCurve | (() => ContrastCurve | undefined),
): ToneAdjuster {
  return ({ context, tone }) => {
    const resolved = typeof curve === 'function' ? curve() : curve;
    if (!resolved) return tone;
    return contrastAgainst(
      tone,
      background(),
      resolved.get(context.contrastLevel),
      context.contrastLevel,
    );
  };
}
