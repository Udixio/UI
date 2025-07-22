import {
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';

export const getRotatedHue = (
  sourceColor: Hct,
  hues: number[],
  rotations: number[],
): number => {
  const sourceHue = sourceColor.hue;
  if (hues.length !== rotations.length) {
    throw new Error(
      `mismatch between hue length ${hues.length} & rotations ${rotations.length}`,
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

export const hues = [0.0, 41.0, 61.0, 101.0, 131.0, 181.0, 251.0, 301.0, 360.0];

export const secondaryRotations = [
  18.0, 15.0, 10.0, 12.0, 15.0, 18.0, 15.0, 12.0, 12.0,
];
export const tertiaryRotations = [
  35.0, 30.0, 20.0, 25.0, 30.0, 35.0, 30.0, 25.0, 25.0,
];

export class Variant {
  constructor(
    public palettes: Record<string, (sourceColorHct: Hct) => TonalPalette> = {},
    public customPalettes?: (colorHct: Hct) => TonalPalette,
  ) {}
}
