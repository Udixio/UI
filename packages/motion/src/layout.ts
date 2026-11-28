/**
 * The public entry `@udixio/motion/layout`: the layout engine. The main entry loads it on demand, the first time a
 * layout motion is bound, so a site without layout motions never downloads it.
 */
import type { MotionHandle } from './contract.js';
import type { LegacySpec } from './define-motion.js';
import type { MotionRuntime } from './runtime.js';
import { holdInFlight, measure } from './layout/measure.js';
import { sharedOf } from './shared-registry.js';
import { flush, scopeFor } from './layout/flush.js';
import { stopFlight } from './layout/flight.js';
import { dispose, layoutScopeOf, scopeOf, scopes } from './layout/scope.js';
import type { Item } from './layout/types.js';

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
export function trackLayout(target: HTMLElement, spec: Readonly<LegacySpec>, options: { runtime: MotionRuntime; development?: boolean; shared?: string }): LayoutTracking {
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
    path: null,
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
      // A keyed element that leaves in flight is remembered where it is on the screen now, not where it rests: its arrival
      // starts from there. A framework may have removed the element already: then the place is computed. The flight stops after that.
      if (current && item.shared !== undefined) holdInFlight(current, target, item.shared, item);
      stopFlight(item);
      if (item.shared !== undefined) sharedOf(options.runtime).forget(item.shared, target);
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

/** The shared identities of a runtime, created by the layout engine the first time a shared element binds. */
export { sharedOf } from './shared-registry.js';
export type { SharedRegistry } from './shared-registry.js';
