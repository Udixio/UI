import type { VisualFrame } from './contract.js';

/**
 * The keyframe at `amplitude` of its distance: `x`, `y` and `rotate` are multiplied by it, and a scale keeps its distance
 * from 1 (a scale of 2 at an amplitude of 0.5 is 1.5). The other fields are not distances and are kept: an opacity, a
 * drawn shape, a position along a path.
 */
export function amplitudeOf(frame: VisualFrame, amplitude: number): VisualFrame {
  if (amplitude === 1) return frame;
  const scaled: VisualFrame = { ...frame };
  if (scaled.x !== undefined) scaled.x *= amplitude;
  if (scaled.y !== undefined) scaled.y *= amplitude;
  if (scaled.rotate !== undefined) scaled.rotate *= amplitude;
  if (scaled.scale !== undefined) scaled.scale = 1 + (scaled.scale - 1) * amplitude;
  if (scaled.scaleX !== undefined) scaled.scaleX = 1 + (scaled.scaleX - 1) * amplitude;
  if (scaled.scaleY !== undefined) scaled.scaleY = 1 + (scaled.scaleY - 1) * amplitude;
  return scaled;
}
