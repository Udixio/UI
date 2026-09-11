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
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Floats content next to an anchor element, using native CSS Anchor
 * Positioning where the browser supports it and tracking the anchor's rect
 * otherwise.
 *
 * It has no variant-driven classes -- it only computes inline positioning
 * styles -- so unlike other core contracts it has no matching
 * `.style.ts`/`defaultClassNames` config.
 */
export interface AnchorPositionerProps {
  /** Placement of the floating element relative to its anchor. Defaults to `bottom`. */
  position?: AnchorPosition;
}
