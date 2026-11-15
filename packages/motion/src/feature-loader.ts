import type { getSequence, sequence } from './sequence.js';
import type { getValue, value } from './value-binding.js';

/** The functions that bind values, as the values module provides them once it has evaluated in this copy of the package. */
export type ValueApi = { readonly value: typeof value; readonly getValue: typeof getValue };
/** The functions that bind sequences, as the sequences module provides them once it has evaluated in this copy of the package. */
export type SequenceApi = { readonly sequence: typeof sequence; readonly getSequence: typeof getSequence };

let values: ValueApi | undefined;
let sequences: SequenceApi | undefined;
let loadingValues: Promise<void> | undefined;
let loadingSequences: Promise<void> | undefined;

/**
 * Called by the values module when it evaluates: a page that binds values from then on does it at once, with no wait
 * for a load.
 */
export function provideValues(api: ValueApi): void {
  values = api;
}

/**
 * Called by the sequences module when it evaluates: a page that binds sequences from then on does it at once, with no
 * wait for a load.
 */
export function provideSequences(api: SequenceApi): void {
  sequences = api;
}

/** The functions that bind values, once the values module has evaluated in this copy of the package. */
export function valuesModule(): ValueApi | undefined {
  return values;
}

/** The functions that bind sequences, once the sequences module has evaluated in this copy of the package. */
export function sequencesModule(): SequenceApi | undefined {
  return sequences;
}

/**
 * Load the values module, once. The scanner loads it the first time it meets a `data-motion-value`: until it is loaded,
 * the element keeps its content, and its values bind when it is. A failed load rejects, and a later call tries again.
 */
export function loadValues(): Promise<void> {
  loadingValues ??= import('./value-entry.js').then(
    () => undefined,
    error => {
      loadingValues = undefined;
      throw error;
    },
  );
  return loadingValues;
}

/**
 * Load the sequences module, once. A failed load rejects, and a later call tries again.
 */
export function loadSequences(): Promise<void> {
  loadingSequences ??= import('./sequence-entry.js').then(
    () => undefined,
    error => {
      loadingSequences = undefined;
      throw error;
    },
  );
  return loadingSequences;
}
