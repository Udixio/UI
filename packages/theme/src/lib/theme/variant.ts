import {
  sanitizeDegreesDouble,
  TonalPalette,
} from '@material/material-color-utilities';
import { Hct } from '../material-color-utilities/htc';
import { AddColors } from '../color';

export const getPiecewiseHue = (
  sourceColorHct: Hct,
  hueBreakpoints: number[],
  hues: number[],
): number => {
  const size = Math.min(hueBreakpoints.length - 1, hues.length);
  const sourceHue = sourceColorHct.hue;
  for (let i = 0; i < size; i++) {
    if (sourceHue >= hueBreakpoints[i] && sourceHue < hueBreakpoints[i + 1]) {
      return sanitizeDegreesDouble(hues[i]);
    }
  }
  return sourceHue;
};

export const getRotatedHue = (
  sourceColorHct: Hct,
  hueBreakpoints: number[],
  rotations: number[],
): number => {
  let rotation = getPiecewiseHue(sourceColorHct, hueBreakpoints, rotations);
  if (Math.min(hueBreakpoints.length - 1, rotations.length) <= 0) {
    rotation = 0;
  }
  return sanitizeDegreesDouble(sourceColorHct.hue + rotation);
};

export class Variant {
  constructor(
    public palettes: Record<
      string,
      (args: { sourceColorHct: Hct; isDark: boolean }) => TonalPalette
    > = {},
    public customPalettes?: (args: {
      isDark: boolean;
      sourceColorHct: Hct;
      colorHct: Hct;
    }) => TonalPalette,
    /** TODO
     * Defines color modifications through variation.
     * Allows customization of specific colors in the theme.
     */
    public colors?: AddColors['colors'],
  ) {}
}
