/**
 * The public entry `@udixio/motion/layout`: the layout engine. The main entry loads it on demand, the first time a
 * layout motion is bound, so a site without layout motions never downloads it.
 */
import type { MotionHandle } from './contract.js';
import type { MotionSpec } from './define-motion.js';
import type { MotionRuntime } from './runtime.js';
import { holdShared, measure, visualBoxOf } from './layout/measure.js';
import { flush, scopeFor } from './layout/flush.js';
import { stopFlight } from './layout/flight.js';
import { dispose, layoutScopeOf, scopeOf, scopes } from './layout/scope.js';
import type { Item, ReferenceRects } from './layout/types.js';

export { layoutScopeOf };
export { flipFrames, sameBox, toLayoutBox, toVisualBox, parseOwnTransform } from './flip.js';
export type { Box, OwnTransform } from './flip.js';
export { springOffset, springVelocity, springSettleTime } from './spring.js';
export type { SpringParams } from './spring.js';
export { isStretched, parseRadii, correctedRadius, lerpBox, projectBox, projectText, stretchOf, sampleContent, liveContentBoxes, easingOf } from './project.js';
export type { Stretch, AxisProgress, ContentPlan, Radii } from './project.js';

export interface LayoutTracking {
  /** The move in flight, if any. */
  readonly handle: MotionHandle | null;
  /** Compare now, as the scope's observer would. */
  flush(): void;
  destroy(): void;
}

/** Start following `target`: it moves to its new place when its scope changes. A `shared` element holds its identity while it is followed. */
export function trackLayout(target: HTMLElement, spec: Readonly<MotionSpec>, options: { runtime: MotionRuntime; development?: boolean; shared?: string }): LayoutTracking {
  const item: Item = {
    spec,
    runtime: options.runtime,
    development: options.development ?? false,
    shared: options.shared,
    layout: undefined,
    visual: undefined,
    rest: { x: 0, y: 0, sx: 1, sy: 1 },
    handle: null,
    flight: null,
    content: [],
    contentPlan: [],
    contentHandles: [],
    projected: [],
    projector: null,
  };
  const scope = scopeFor(layoutScopeOf(target));
  scope.items.set(target, item);
  scopeOf.set(target, scope);
  // A shared element is flushed at once, so that it arrives in the place of its identity now; the others are measured as before.
  if (item.shared === undefined) measure(scope, target, item);
  else flush(scope);
  return {
    get handle() {
      return item.handle;
    },
    flush() {
      const current = scopeOf.get(target);
      if (current) flush(current);
    },
    destroy() {
      const current = scopeOf.get(target);
      // A keyed element that leaves in flight, while it is still on the page, is remembered where it is on the screen now:
      // its arrival starts from there, not from the place it rests at. The flight is stopped after that.
      if (item.shared !== undefined && item.handle !== null && current && target.isConnected) {
        const rects: ReferenceRects = new Map();
        holdShared(current, target, item.shared, options.runtime, visualBoxOf(current, target, rects), rects);
      }
      stopFlight(item);
      if (item.shared !== undefined) options.runtime.shared.forget(item.shared, target);
      if (!current) return;
      scopeOf.delete(target);
      current.items.delete(target);
      if (current.items.size === 0) dispose(current);
    },
  };
}

/** Compare now the scope that follows the neighbours of `element`, as its observer would after a mutation it can see. */
export function flushLayoutAround(element: HTMLElement): void {
  const scope = scopes.get(layoutScopeOf(element));
  if (scope) flush(scope);
}
