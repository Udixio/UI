// The reduced-motion switches of an element, read from its computed style. A module of its own, so that the SVG
// morph reads them without the play module.

/** `--udx-motion: none` on the element or inherited from an ancestor turns its motions off. */
export function motionDisabledIn(style: CSSStyleDeclaration): boolean {
  return style.getPropertyValue('--udx-motion').trim() === 'none';
}

/** `--udx-motion-scale` clamped to [0, 1]; absent or non-numeric means 1. */
export function motionScaleIn(style: CSSStyleDeclaration): number {
  const value = Number.parseFloat(style.getPropertyValue('--udx-motion-scale'));
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

/** `--udx-motion-scale` as a time factor: 0 and above, no upper bound; a negative value is 0, absent or non-numeric is 1. */
export function timeScaleIn(style: CSSStyleDeclaration): number {
  const value = Number.parseFloat(style.getPropertyValue('--udx-motion-scale'));
  return Number.isFinite(value) ? Math.max(0, value) : 1;
}
