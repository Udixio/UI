import type { Palette } from '../palette/palette';
import type { PaletteRef, ToneAdjuster } from './tone-adjusters';
import type { Color } from './color.base';

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
export type ColorValueInput = string | Color;

export type ColorOptions =
  | ColorValueInput
  | FromPaletteOptions
  | { alias: string };

/**
 * @param palette Palette source, qui fournit la teinte et le chroma. Désignée
 *     par sa clé — `'neutral'` — ou directement. La passer plutôt qu'un couple
 *     hue/chroma permet de préserver le chroma voulu quand le ton bouge.
 * @param tone Le ton par défaut. À défaut, {@link DEFAULT_TONE}.
 * @param adjustTone Ajuste ce ton par défaut. Rien n'est appliqué avant ni
 *     après : compose ce que tu veux — `contrastAgainst`, `avoidBackgroundGap`,
 *     `applyToneDelta`, `arbitrateBackgrounds`, ou ton
 *     propre calcul.
 * @param chromaMultiplier Facteur appliqué au chroma de la palette. Défaut 1.
 */
export type FromPaletteOptions = {
  palette: PaletteRef;
  tone?: () => number;
  adjustTone?: ToneAdjuster | ToneAdjuster[];
  chromaMultiplier?: () => number | undefined;
};

/** Les mêmes options, une fois résolues. */
export type FromPalette = {
  palette: Palette;
  tone: number;
  /** Le chroma effectivement appliqué : celui de la palette, multiplié. */
  chroma: number;
};
