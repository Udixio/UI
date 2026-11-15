import type { VisualFrame } from './contract.js';
import type { Box, OwnTransform } from './flip.js';

/** Scale of a parent relative to its natural size, per axis. */
export interface Stretch {
  x: number;
  y: number;
}

/** A progress per axis: x drives the centre x and the width of a box, y its centre y and its height. */
export interface AxisProgress {
  x: number;
  y: number;
}

/**
 * A node of the content of a resizing element: its box before and after the move, what its stylesheet gives it,
 * and `unit`, the screen pixels per local pixel of its parent at rest (its translate is in local pixels).
 */
export interface ContentPlan {
  element: HTMLElement;
  kind: 'box' | 'text';
  before: Box;
  after: Box;
  rest: OwnTransform;
  unit: Stretch;
  children: ContentPlan[];
}

/** A stretch component of zero cannot be projected: it is taken as one. */
const orOne = (k: number): number => (k === 0 ? 1 : k);

/** The box between `from` and `to`, at progress `q` (per axis, or the same for both). A progress beyond [0, 1] (an overshoot) is not clamped. */
export function lerpBox(from: Box, to: Box, q: number | AxisProgress): Box {
  const qx = typeof q === 'number' ? q : q.x;
  const qy = typeof q === 'number' ? q : q.y;
  return {
    cx: from.cx + (to.cx - from.cx) * qx,
    cy: from.cy + (to.cy - from.cy) * qy,
    w: from.w + (to.w - from.w) * qx,
    h: from.h + (to.h - from.h) * qy,
  };
}

/**
 * Own transform that shows `desired` (relative to the parent's visual centre) for a node whose layout box is `after`
 * (relative to the parent's layout centre), inside a parent stretched by `k`. `unit` is the screen pixels per local
 * pixel of the parent at rest: the translate is in local pixels, so it is divided by it.
 */
export function projectBox(after: Box, desired: Box, k: Stretch, unit: Stretch): OwnTransform {
  const kx = orOne(k.x);
  const ky = orOne(k.y);
  return {
    x: (desired.cx / kx - after.cx) / unit.x,
    y: (desired.cy / ky - after.cy) / unit.y,
    sx: after.w === 0 ? 1 : desired.w / (kx * after.w),
    sy: after.h === 0 ? 1 : desired.h / (ky * after.h),
  };
}

/** Same as `projectBox`, for a text node: its natural size is kept, and its start edge (left, top) is taken from `desired`. */
export function projectText(after: Box, desired: Box, k: Stretch, unit: Stretch): OwnTransform {
  const kx = orOne(k.x);
  const ky = orOne(k.y);
  return {
    x: ((desired.cx - desired.w / 2 + after.w / 2) / kx - after.cx) / unit.x,
    y: ((desired.cy - desired.h / 2 + after.h / 2) / ky - after.cy) / unit.y,
    sx: 1 / kx,
    sy: 1 / ky,
  };
}

/** Net stretch of a projected box, for its own children. A zero dimension gives 1. */
export function stretchOf(after: Box, desired: Box): Stretch {
  return {
    x: after.w === 0 ? 1 : desired.w / after.w,
    y: after.h === 0 ? 1 : desired.h / after.h,
  };
}

/**
 * Keyframes of every node of a content plan, at `steps + 1` uniform instants of its parent's move. `parentStretchAt(i)`
 * and `progressAt(i)` give the parent's stretch and the move's progress per axis at instant `i`. The last keyframe of
 * a node is its rest. Samples are listed parent first, then their children.
 */
export function sampleContent(
  plans: readonly ContentPlan[],
  parentStretchAt: (i: number) => Stretch,
  progressAt: (i: number) => AxisProgress,
  steps: number,
): Array<{ element: HTMLElement; keyframes: VisualFrame[] }> {
  const samples: Array<{ element: HTMLElement; keyframes: VisualFrame[] }> = [];
  const visit = (plan: ContentPlan, stretchAt: (i: number) => Stretch): void => {
    const keyframes: VisualFrame[] = [];
    const desired: Box[] = [];
    for (let i = 0; i <= steps; i++) {
      const box = lerpBox(plan.before, plan.after, progressAt(i));
      desired.push(box);
      if (i === steps) {
        keyframes.push({ x: plan.rest.x, y: plan.rest.y, scaleX: plan.rest.sx, scaleY: plan.rest.sy });
        continue;
      }
      const stretch = stretchAt(i);
      const t = plan.kind === 'box' ? projectBox(plan.after, box, stretch, plan.unit) : projectText(plan.after, box, stretch, plan.unit);
      keyframes.push({ x: plan.rest.x + t.x, y: plan.rest.y + t.y, scaleX: plan.rest.sx * t.sx, scaleY: plan.rest.sy * t.sy });
    }
    samples.push({ element: plan.element, keyframes });
    if (plan.kind === 'box') for (const child of plan.children) visit(child, i => stretchOf(plan.after, desired[i]));
  };
  for (const plan of plans) visit(plan, parentStretchAt);
  return samples;
}

/**
 * Where each node of a running content plan is on screen now, relative to its parent's visual centre. A node shows
 * the box it animates towards (`after`), moved by the translate it has now and scaled by its own scale, inside its
 * parent's current stretch `parent` (the followed element's current scale over its rest scale). The children of a
 * node are inside the node's current stretch. `ownOf` reads the own transform of an element now.
 */
export function liveContentBoxes(plans: readonly ContentPlan[], parent: Stretch, ownOf: (element: HTMLElement) => OwnTransform): Map<HTMLElement, Box> {
  const boxes = new Map<HTMLElement, Box>();
  const visit = (plan: ContentPlan, k: Stretch): void => {
    const own = ownOf(plan.element);
    boxes.set(plan.element, {
      cx: k.x * (plan.after.cx + plan.unit.x * (own.x - plan.rest.x)),
      cy: k.y * (plan.after.cy + plan.unit.y * (own.y - plan.rest.y)),
      w: k.x * (own.sx / plan.rest.sx) * plan.after.w,
      h: k.y * (own.sy / plan.rest.sy) * plan.after.h,
    });
    const stretch = { x: (k.x * own.sx) / plan.rest.sx, y: (k.y * own.sy) / plan.rest.sy };
    for (const child of plan.children) visit(child, stretch);
  };
  for (const plan of plans) visit(plan, parent);
  return boxes;
}

/** The progress of an easing string at a time fraction, for `linear` and `cubic-bezier(x1, y1, x2, y2)`; null for any other easing. */
export function easingOf(easing: string): ((p: number) => number) | null {
  if (easing === 'linear') return p => p;
  const match = /^cubic-bezier\((.+)\)$/.exec(easing.trim());
  if (!match) return null;
  const values = match[1].split(',').map(Number);
  if (values.length !== 4 || values.some(value => !Number.isFinite(value))) return null;
  const [x1, y1, x2, y2] = values;
  const at = (a: number, b: number, s: number): number => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  return p => {
    // The x of the curve is increasing: bisect the parameter that reaches the time fraction, then read y there.
    let lo = 0;
    let hi = 1;
    for (let n = 0; n < 60; n++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < p) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}
