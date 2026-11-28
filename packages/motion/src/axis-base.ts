import type { MotionElement } from './contract.js';

/**
 * The two axes of translate and of scale as an element shows them now, percentages kept. A third value (z) and its scale are
 * carried when the element has them.
 */
export interface AxisBase {
  readonly x: string;
  readonly y: string;
  readonly z?: string;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly scaleZ?: number;
}

/** The base of an element with no translate and no scale. */
export const NEUTRAL_AXIS_BASE: AxisBase = {
  x: '0px',
  y: '0px',
  scaleX: 1,
  scaleY: 1,
};

/** The values of a computed property, split on spaces; `none` has none. */
const valuesOf = (computed: string): string[] =>
  computed
    .trim()
    .split(/\s+/)
    .filter((value) => value !== '' && value !== 'none');

/**
 * The axis base of a computed `translate` and `scale`: one value is the x (or the uniform scale), a missing axis is 0 (or 1),
 * and `none` is neutral. Pure: it reads no element.
 */
export function parseAxisBase(translate: string, scale: string): AxisBase {
  const [x = '0px', y = '0px', z] = valuesOf(translate);
  const [scaleX = 1, scaleY = scaleX, scaleZ] = valuesOf(scale).map(Number);
  return {
    x,
    y,
    scaleX,
    scaleY,
    ...(z !== undefined && { z }),
    ...(scaleZ !== undefined && { scaleZ }),
  };
}

/** The axis base of an element, from its computed `translate` and `scale`. */
export function readAxisBase(element: MotionElement): AxisBase {
  const style = (element.ownerDocument.defaultView ?? window).getComputedStyle(
    element,
  );
  return parseAxisBase(
    style.getPropertyValue('translate'),
    style.getPropertyValue('scale'),
  );
}
