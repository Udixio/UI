import { computed, type Signal } from '@angular/core';

/**
 * Angular primitive: wraps a pure @udixio/core style function in a
 * `computed`, which natively memoizes on the signals read by `state`.
 */
export function createStyle<S>(
  styleFn: (state: S) => Record<string, string>,
  state: () => S,
): Signal<Record<string, string>> {
  return computed(() => styleFn(state()));
}
