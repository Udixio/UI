import { clampDouble, Contrast } from '@material/material-color-utilities';
import { ContrastCurve, DynamicColor } from '../material-color-utilities';
import { getCurve, StandardContrastRatio } from './color.utils';
import type { API } from '../API';
import type { Context } from '../context';
import type { Palette } from '../palette/palette';
import type { Color } from './color.base';
import type { ColorApi } from './color.api';
import type { PaletteApi } from '../palette/palette.api';

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

/** Ton d'une couleur qui n'a ni ton explicite ni ajusteur. */
export const DEFAULT_TONE = 50;

/**
 * Ajuste le ton d'une couleur.
 *
 * Contexte minimal reçu par un ajusteur au moment de la résolution.
 *
 * L'API complète n'est pas exposée : les ajusteurs de ton ont uniquement
 * besoin du ton courant, du contexte du thème et des registres de couleurs et
 * de palettes.
 */
export type ToneAdjusterArgs = {
  /** Ton laissé par l'étape précédente de la chaîne. */
  tone: number;
  /** État dynamique du thème : mode sombre, contraste, variant, etc. */
  context: Context;
  /** Registre des couleurs résolues du thème courant. */
  colors: ColorApi;
  /** Registre des palettes résolues du thème courant. */
  palettes: PaletteApi;
};

/** Un ajusteur reçoit le contexte minimal et rend le ton suivant. */
export type ToneAdjuster = (args: ToneAdjusterArgs) => number;

/**
 * Une couleur, désignée par sa clé, directement ou par une résolution différée.
 * Le callback est évalué au moment de l'ajustement et peut fermer sur le
 * contexte dans lequel la couleur a été déclarée.
 */
export type ColorRef = string | Color | (() => Color);

/** Une palette, désignée par sa clé dans le registre ou directement. */
export type PaletteRef = string | Palette | ((api: API) => Palette);

/**
 * Le contraste visé : un ratio standard, une courbe sur mesure, ou une
 * fonction sans argument quand il dépend du contexte.
 */
export type ContrastSpec =
  StandardContrastRatio | ContrastCurve | (() => ContrastCurve | undefined);

/** Sens de l'écart, décrit **depuis la couleur qui le déclare**. */
export type TonePolarity =
  'darker' | 'lighter' | 'relativeDarker' | 'relativeLighter';

/** Comment satisfaire la contrainte d'écart. */
export type DeltaConstraint = 'exact' | 'nearer' | 'farther';

export type ToneDelta = {
  /** L'autre couleur de la paire, dont le ton est déjà résolu. */
  relativeTo: ColorRef;
  /** Écart requis, en valeur absolue. */
  delta: number;
  polarity: TonePolarity;
  /** `exact` fige le ton ; `nearer` et `farther` le bornent. */
  constraint: DeltaConstraint;
};

function resolveColor(ref: ColorRef, args: ToneAdjusterArgs): Color {
  if (typeof ref === 'string') return args.colors.get(ref);
  if (typeof ref === 'function') return ref();
  return ref;
}

export function resolvePalette(ref: PaletteRef, api: API): Palette {
  if (typeof ref === 'string') return api.palettes.get(ref);
  if (typeof ref === 'function') return ref(api);
  return ref;
}

function resolveCurve(spec: ContrastSpec): ContrastCurve | undefined {
  if (typeof spec === 'number') return getCurve(spec);
  if (typeof spec === 'function') return spec();
  return spec;
}

/**
 * Le ton d'un premier plan posé sur `background` : part du ton du fond et le
 * pousse jusqu'à atteindre le contraste visé.
 *
 * C'est la forme des tokens `on*`. Seul ajusteur à **ignorer le ton entrant** —
 * il n'a donc de sens qu'en première position.
 */
export function onColor(
  background: ColorRef,
  contrast: ContrastSpec,
): ToneAdjuster {
  return (args) => {
    const on = resolveColor(background, args);
    return contrastTone(on.tone, on, contrast, args);
  };
}

/**
 * Le cœur de {@link contrastAgainst} et {@link onColor}, sur un ton nu.
 * Exporté parce qu'il se teste et se réutilise seul.
 */
export function contrastTone(
  tone: number,
  background: ColorRef,
  contrast: ContrastSpec,
  args: ToneAdjusterArgs,
): number {
  const curve = resolveCurve(contrast);
  if (!curve) return tone;

  const backgroundTone = resolveColor(background, args).tone;
  const ratio = curve.get(args.context.contrastLevel);
  if (
    Contrast.ratioOfTones(backgroundTone, tone) >= ratio &&
    args.context.contrastLevel >= 0
  ) {
    return tone;
  }
  return DynamicColor.foregroundTone(backgroundTone, ratio);
}

/**
 * Pousse le ton entrant jusqu'à ce qu'il contraste assez avec `background`.
 *
 * Le ton est laissé tel quel s'il satisfait déjà le ratio — sauf en contraste
 * négatif, où l'on recalcule pour pouvoir le réduire. Sans effet si le
 * contraste résout à `undefined`.
 */
export function contrastAgainst(
  background: ColorRef,
  contrast: ContrastSpec,
): ToneAdjuster {
  return (args) => contrastTone(args.tone, background, contrast, args);
}

/**
 * Écarte le ton de la bande où aucun premier plan n'obtient un contraste
 * suffisant. À ne mettre que sur les couleurs qui servent de fond — et jamais
 * après un écart `exact`, qu'il défferait.
 */
export function avoidBackgroundGap(): ToneAdjuster {
  return ({ tone }) => backgroundGapTone(tone);
}

/**
 * Le cœur de {@link avoidBackgroundGap}, sur un ton nu. Exporté pour les
 * couleurs dont le clamp est conditionnel et qui composent à la main.
 */
export function backgroundGapTone(tone: number): number {
  const { pivot, lightFloor, darkCeiling } = BACKGROUND_TONE_GAP;
  return tone >= pivot
    ? clampDouble(lightFloor, 100, tone)
    : clampDouble(0, darkCeiling, tone);
}

/** Impose un écart de ton vis-à-vis d'une autre couleur. */
export function applyToneDelta({
  relativeTo,
  delta,
  polarity,
  constraint,
}: ToneDelta): ToneAdjuster {
  return (args) => {
    const { tone, context } = args;
    const signed =
      polarity === 'darker' ||
      (polarity === 'relativeLighter' && context.isDark) ||
      (polarity === 'relativeDarker' && !context.isDark)
        ? -delta
        : delta;

    const reference = resolveColor(relativeTo, args).tone;

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
  };
}

/**
 * Cherche un ton qui contraste assez avec deux fonds à la fois. Laisse le ton
 * inchangé s'il satisfait déjà les deux.
 */
export function arbitrateBackgrounds(
  first: ColorRef,
  second: ColorRef,
  contrast: ContrastSpec,
): ToneAdjuster {
  return (args) => {
    const { tone, context } = args;
    const curve = resolveCurve(contrast);
    if (!curve) return tone;

    const ratio = curve.get(context.contrastLevel);
    const toneA = resolveColor(first, args).tone;
    const toneB = resolveColor(second, args).tone;
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
  };
}
