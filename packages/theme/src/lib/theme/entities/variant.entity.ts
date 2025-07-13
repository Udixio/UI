import {
  Hct,
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';

export const getRotatedHue = (
  sourceColor: Hct,
  hues: number[],
  rotations: number[]
): number => {
  const sourceHue = sourceColor.hue;
  if (hues.length !== rotations.length) {
    throw new Error(
      `mismatch between hue length ${hues.length} & rotations ${rotations.length}`
    );
  }
  if (rotations.length === 1) {
    return sanitizeDegreesDouble(sourceColor.hue + rotations[0]);
  }
  const size = hues.length;
  for (let i = 0; i <= size - 2; i++) {
    const thisHue = hues[i];
    const nextHue = hues[i + 1];
    if (thisHue < sourceHue && sourceHue < nextHue) {
      return sanitizeDegreesDouble(sourceHue + rotations[i]);
    }
  }
  // If this statement executes, something is wrong, there should have been a
  // rotation found using the arrays.
  return sourceHue;
};

export class VariantEntity {
  constructor(
    public palettes: Record<string, (sourceColorHct: Hct) => TonalPalette> = {},
    public customPalettes?: (colorHct: Hct) => TonalPalette
  ) {}
}
