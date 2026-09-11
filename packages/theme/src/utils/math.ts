/**
 * Projette linéairement `value` depuis `inputRange` vers `outputRange`.
 *
 * La valeur est d'abord bornée à `inputRange`, puis interpolée : le minimum
 * d'entrée devient le minimum de sortie, le maximum d'entrée le maximum de
 * sortie. Sans `outputRange`, le résultat est la position normalisée dans
 * `[0, 1]`.
 *
 * @example
 * normalize(0.5, [0, 1], [3, 7]); // 5
 * normalize(150, [0, 100]);       // 1 (borné)
 */
export const normalize = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number] = [0, 1],
): number => {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  const clampedValue = Math.max(inputMin, Math.min(value, inputMax));

  const normalizedValue = (clampedValue - inputMin) / (inputMax - inputMin);

  return outputMin + normalizedValue * (outputMax - outputMin);
};
