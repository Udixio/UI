/**
 * Placement of the floating element relative to its anchor. Mirrors the CSS
 * Anchor Positioning `position-area` keyword pairs this type maps to, so the
 * vocabulary stays identical whether the browser resolves layout natively
 * or the fallback controller computes it from `getBoundingClientRect`.
 *
 * The four single keywords sit on one side and stay centred on the other axis.
 * The four corners name a cell of the 3x3 grid around the anchor, so they sit
 * **diagonally outside its box on both axes** -- `bottom-right` places the
 * element below the anchor's bottom edge *and* past its right edge, not below
 * it right-aligned.
 */
export type AnchorPosition =
  | 'auto'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** The axis used when `position="auto"`; vertical chooses above/below, horizontal chooses left/right. */
export type AnchorPositionAxis = 'vertical' | 'horizontal';

/**
 * Floats content beside an anchor element and keeps it there as the page
 * moves.
 */
export interface AnchorPositionerProps {
  /** Placement of the floating element relative to its anchor. `auto` chooses below/above or right/left from the anchor's viewport half. Defaults to `bottom`. */
  position?: AnchorPosition;
  /** Axis used by automatic placement. Defaults to `vertical`. */
  autoAxis?: AnchorPositionAxis;
}
