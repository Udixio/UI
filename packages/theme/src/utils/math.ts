/**
 * Linearly maps `value` from `inputRange` to `outputRange`.
 *
 * The value is first clamped to `inputRange`, then interpolated: the input
 * minimum becomes the output minimum, the input maximum the output maximum.
 * Without `outputRange`, the result is the normalized position in `[0, 1]`.
 *
 * @example
 * normalize(0.5, [0, 1], [3, 7]); // 5
 * normalize(150, [0, 100]);       // 1 (clamped)
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
