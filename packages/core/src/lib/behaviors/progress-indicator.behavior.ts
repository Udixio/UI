import { ProgressIndicatorVariant } from '../interfaces/progress-indicator.interface';

/** Clamps a progress value into the valid 0-100 percentage range. */
export function clampProgressValue(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Resolves whether a variant reports a concrete value instead of an unbounded animation. */
export function isDeterminateVariant(
  variant: ProgressIndicatorVariant,
): boolean {
  return variant === 'linear-determinate' || variant === 'circular-determinate';
}
