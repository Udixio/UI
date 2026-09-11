/**
 * L'étendue des chromas de pointe du gamut sRGB : la teinte la plus contrainte
 * (≈219, un bleu, culmine à 55,3 au ton 79) et la plus libre (≈27, un rouge,
 * culmine à 112,8 au ton 53).
 *
 * Ce sont les valeurs de `Color.gamutChromaRange()`, figées ici parce que le
 * calcul parcourt 360 × 101 résolutions HCT. Un test garde l'égalité.
 */
export const GAMUT_CHROMA_RANGE: [number, number] = [55.3, 112.8];
