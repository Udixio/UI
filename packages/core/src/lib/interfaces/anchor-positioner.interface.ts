/**
 * Placement of the floating element relative to its anchor. Mirrors the CSS
 * Anchor Positioning `position-area` keyword pairs this type maps to, so the
 * vocabulary stays identical whether the browser resolves layout natively
 * or the fallback controller computes it from `getBoundingClientRect`.
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
 * `AnchorPositioner` has no variant-driven classes -- it only computes
 * inline positioning styles -- so unlike other core contracts it has no
 * matching `.style.ts`/`defaultClassNames` config.
 */
export interface AnchorPositionerProps {
  /** Placement of the floating element relative to its anchor. Defaults to `bottom`. */
  position?: AnchorPosition;
}
