import { computed, type Signal } from '@angular/core';

/**
 * Primitive Angular : enveloppe une fonction de style pure de @udixio/core
 * dans un `computed`, qui mémoïse nativement sur les signaux lus par `state`.
 */
export function createStyle<S>(
  styleFn: (state: S) => Record<string, string>,
  state: () => S,
): Signal<Record<string, string>> {
  return computed(() => styleFn(state()));
}
