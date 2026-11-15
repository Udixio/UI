import type { MotionHandle } from './contract.js';
import type { MotionSpec } from './define-motion.js';
import type { MotionRuntime } from './runtime.js';
import { measure } from './layout/measure.js';
import { flush, scopeFor } from './layout/flush.js';
import { stopFlight } from './layout/flight.js';
import { dispose, layoutScopeOf, scopeOf, scopes } from './layout/scope.js';
import type { Item } from './layout/types.js';

export { layoutScopeOf };

export interface LayoutTracking {
  /** The move in flight, if any. */
  readonly handle: MotionHandle | null;
  /** Compare now, as the scope's observer would. */
  flush(): void;
  destroy(): void;
}

/** Start following `target`: it moves to its new place when its scope changes. */
export function trackLayout(target: HTMLElement, spec: Readonly<MotionSpec>, options: { runtime: MotionRuntime; development?: boolean }): LayoutTracking {
  const item: Item = {
    spec,
    runtime: options.runtime,
    development: options.development ?? false,
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
  measure(scope, target, item);
  return {
    get handle() {
      return item.handle;
    },
    flush() {
      const current = scopeOf.get(target);
      if (current) flush(current);
    },
    destroy() {
      stopFlight(item);
      const current = scopeOf.get(target);
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
