import type { VisualFrame } from './contract.js';

/** A box: centre and size, relative to its reference. */
export interface Box {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** The element's own individual transform (`translate`, `scale`). */
export interface OwnTransform {
  x: number;
  y: number;
  sx: number;
  sy: number;
}

const NEUTRAL: OwnTransform = { x: 0, y: 0, sx: 1, sy: 1 };
const TOLERANCE_PX = 0.5;
const TOLERANCE_RATIO = 0.01;

/** Layout box (no own transform) from a visual box: undo translate and scale (scale about the centre). */
export function toLayoutBox(visual: Box, own: OwnTransform): Box {
  return {
    cx: visual.cx - own.x,
    cy: visual.cy - own.y,
    w: own.sx === 0 ? visual.w : visual.w / own.sx,
    h: own.sy === 0 ? visual.h : visual.h / own.sy,
  };
}

/** Visual box of a layout box under an own transform. */
export function toVisualBox(layout: Box, own: OwnTransform): Box {
  return {
    cx: layout.cx + own.x,
    cy: layout.cy + own.y,
    w: layout.w * own.sx,
    h: layout.h * own.sy,
  };
}

/** Frames that carry the visual box `before` to the visual box at rest `after`, or null when they match within tolerance. */
export function flipFrames(
  before: Box,
  after: Box,
  rest: OwnTransform,
): [VisualFrame, VisualFrame] | null {
  if (before.w === 0 || before.h === 0 || after.w === 0 || after.h === 0)
    return null;
  const dx = before.cx - after.cx;
  const dy = before.cy - after.cy;
  const rw = before.w / after.w;
  const rh = before.h / after.h;
  if (
    Math.abs(dx) < TOLERANCE_PX &&
    Math.abs(dy) < TOLERANCE_PX &&
    Math.abs(rw - 1) < TOLERANCE_RATIO &&
    Math.abs(rh - 1) < TOLERANCE_RATIO
  )
    return null;
  return [
    {
      x: rest.x + dx,
      y: rest.y + dy,
      scaleX: rest.sx * rw,
      scaleY: rest.sy * rh,
    },
    { x: rest.x, y: rest.y, scaleX: rest.sx, scaleY: rest.sy },
  ];
}

/** The whitespace-separated values of a computed property; `none` and empty mean no value. */
function tokens(value: string): string[] {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === 'none' ? [] : trimmed.split(/\s+/);
}

/** A translate value in px; a percentage is read as 0. */
function offset(token: string): number {
  return token.endsWith('%') ? 0 : Number.parseFloat(token);
}

/** Parse computed `translate` / `scale` values ('none', '10px', '10px 4px', '0.5', '0.5 2'). */
export function parseOwnTransform(translate: string, scale: string): OwnTransform {
  const offsets = tokens(translate).map(token => offset(token));
  const factors = tokens(scale).map(token => Number.parseFloat(token));
  return {
    x: offsets[0] ?? NEUTRAL.x,
    y: offsets[1] ?? NEUTRAL.y,
    sx: factors[0] ?? NEUTRAL.sx,
    sy: factors[1] ?? factors[0] ?? NEUTRAL.sy,
  };
}
