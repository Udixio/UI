import type { Palette } from '../palette/palette';
import type { PaletteRef, ToneAdjuster } from './tone-adjusters';
import type { Color } from './color.base';
import type { API } from '../API';

/** Les trois coordonnées perceptuelles qui définissent une couleur. */
export type ColorValue = {
  /** Teinte, en degrés. 0 <= hue < 360. */
  hue: number;
  /** Colorfulness. Le maximum atteignable dépend de `hue` et `tone`. */
  chroma: number;
  /** Luminosité perceptuelle. 0 <= tone <= 100. */
  tone: number;
};

/**
 * Valeur de couleur acceptée à la frontière de configuration.
 *
 * Les chaînes restent le raccourci prévu pour les configurations courantes ;
 * le moteur les transforme ensuite en `Color`.
 */
export type ColorInput = string | Color;

/**
 * Transforme une couleur pendant sa résolution.
 *
 * Par défaut, le callback reçoit la couleur de base, avant les règles propres
 * à une couleur de palette. `afterResolution()` permet de cibler la valeur
 * finale.
 */
export type ColorTransform = (color: Color) => Color;

/**
 * Définition acceptée dans la configuration : valeur directe ou
 * transformation de la couleur déjà fournie par le variant.
 */
export type ColorDefinition = ColorInput | ColorTransform;

/** Une collection de définitions de couleurs, éventuellement calculée par l'API. */
export type ColorConfigRecord<Value> =
  Record<string, Value> | ((api: API) => Record<string, Value>);

/** Contrat commun des couleurs de configuration et des variantes. */
export type ColorsConfig = ColorConfigRecord<ColorDefinition>;

/**
 * @param palette Palette source, qui fournit la teinte et le chroma. Désignée
 *     par sa clé — `'neutral'` — ou directement. La passer plutôt qu'un couple
 *     hue/chroma permet de préserver le chroma voulu quand le ton bouge.
 * @param tone Le ton par défaut. À défaut, {@link DEFAULT_TONE}.
 * @param adjustTone Ajuste le ton après les personnalisations classiques de la
 *     couleur. Compose ce que tu veux — `contrastAgainst`,
 *     `avoidBackgroundGap`, `applyToneDelta`, `arbitrateBackgrounds`, ou ton
 *     propre calcul.
 * @param chromaMultiplier Facteur appliqué au chroma après les personnalisations
 *     classiques. Défaut 1.
 */
export type PaletteColorOptions = {
  palette: PaletteRef;
  tone?: () => number;
  adjustTone?: ToneAdjuster | ToneAdjuster[];
  chromaMultiplier?: () => number | undefined;
};

/** Les mêmes options, une fois résolues. */
export type ResolvedPaletteColor = {
  palette: Palette;
  tone: number;
  /** Le chroma effectivement appliqué : celui de la palette, multiplié. */
  chroma: number;
};

/**
 * Ancien nom de l'entrée directe du registre.
 *
 * Les recettes de palette passent désormais par `Color.fromPalette()`.
 */
export type ColorOptions = ColorInput;

/** Ancien nom d'une définition enregistrable. */
export type ColorRegistration = ColorDefinition;
