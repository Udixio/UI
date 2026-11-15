import type { getGesture, gesture } from './gesture-binding.js';
import type { getSequence, sequence } from './sequence.js';
import type { getValue, value } from './value-binding.js';

/** The functions that bind values, as the values module provides them once it has evaluated in this copy of the package. */
export type ValueApi = { readonly value: typeof value; readonly getValue: typeof getValue };
/** The functions that bind sequences, as the sequences module provides them once it has evaluated in this copy of the package. */
export type SequenceApi = { readonly sequence: typeof sequence; readonly getSequence: typeof getSequence };

/** The functions that bind gestures, as the gestures module provides them once it has evaluated in this copy of the package. */
export type GestureApi = { readonly gesture: typeof gesture; readonly getGesture: typeof getGesture };

let values: ValueApi | undefined;
let sequences: SequenceApi | undefined;
let gestures: GestureApi | undefined;
let loadingValues: Promise<void> | undefined;
let loadingSequences: Promise<void> | undefined;
let loadingGestures: Promise<void> | undefined;

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

/**
 * Called by the gestures module when it evaluates: a page that binds gestures from then on does it at once, with no
 * wait for a load.
 */
export function provideGestures(api: GestureApi): void {
  gestures = api;
}

/** The functions that bind values, once the values module has evaluated in this copy of the package. */
export function valuesModule(): ValueApi | undefined {
  return values;
}

/** The functions that bind sequences, once the sequences module has evaluated in this copy of the package. */
export function sequencesModule(): SequenceApi | undefined {
  return sequences;
}

/** The functions that bind gestures, once the gestures module has evaluated in this copy of the package. */
export function gesturesModule(): GestureApi | undefined {
  return gestures;
}

/**
 * Load the gestures module, once. A failed load rejects, and a later call tries again.
 */
export function loadGestures(): Promise<void> {
  loadingGestures ??= import('./gesture-entry.js').then(
    () => undefined,
    error => {
      loadingGestures = undefined;
      throw error;
    },
  );
  return loadingGestures;
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
