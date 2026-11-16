import type { createLoopBinding, createScrubBinding } from './continuous.js';
import type { getGesture, gesture } from './gesture-binding.js';
import type { getSequence, sequence } from './sequence.js';
import type { applySplitFrame, playSplit, revertSplit } from './split-play.js';
import type { getValue, value, valuesOf } from './value-binding.js';

/** The functions that bind values, as the values module provides them once it has evaluated in this copy of the package. */
export type ValueApi = { readonly value: typeof value; readonly getValue: typeof getValue; readonly valuesOf: typeof valuesOf };
/** The functions that bind sequences, as the sequences module provides them once it has evaluated in this copy of the package. */
export type SequenceApi = { readonly sequence: typeof sequence; readonly getSequence: typeof getSequence };

/** The functions that bind gestures, as the gestures module provides them once it has evaluated in this copy of the package. */
export type GestureApi = { readonly gesture: typeof gesture; readonly getGesture: typeof getGesture };

/** The functions that play a split definition, as the text module provides them once it has evaluated in this copy of the package. */
export type TextApi = {
  readonly playSplit: typeof playSplit;
  readonly applySplitFrame: typeof applySplitFrame;
  readonly revertSplit: typeof revertSplit;
};

/** The functions that bind a scrub and a loop, as the continuous module provides them once it has evaluated in this copy of the package. */
export type ContinuousApi = { readonly createScrubBinding: typeof createScrubBinding; readonly createLoopBinding: typeof createLoopBinding };

let values: ValueApi | undefined;
let sequences: SequenceApi | undefined;
let gestures: GestureApi | undefined;
let texts: TextApi | undefined;
let continuous: ContinuousApi | undefined;

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

/**
 * Called by the continuous module when it evaluates: a scrub or a loop bound from then on is made at once, with no wait for a load.
 */
export function provideContinuous(api: ContinuousApi): void {
  continuous = api;
}

/**
 * Called by the text module when it evaluates: a binding that splits a text from then on does it at once, with no wait
 * for a load.
 */
export function provideText(api: TextApi): void {
  texts = api;
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

/** The functions that play a split definition, once the text module has evaluated in this copy of the package. */
export function textModule(): TextApi | undefined {
  return texts;
}

/** The functions that bind a scrub and a loop, once the continuous module has evaluated in this copy of the package. */
export function continuousModule(): ContinuousApi | undefined {
  return continuous;
}

/** A loader of a module: the module loads once, and a failed load rejects, so that a later call tries again. */
function loader(load: () => Promise<unknown>): () => Promise<void> {
  let loading: Promise<void> | undefined;
  return () => {
    loading ??= load().then(
      () => undefined,
      error => {
        loading = undefined;
        throw error;
      },
    );
    return loading;
  };
}

/**
 * Load the gestures module, once. A failed load rejects, and a later call tries again.
 */
export const loadGestures = /* @__PURE__ */ loader(() => import('./gesture-entry.js'));

/**
 * Load the text module, once. A failed load rejects, and a later call tries again.
 */
export const loadText = /* @__PURE__ */ loader(() => import('./text-entry.js'));

/**
 * Load the continuous module, once. A failed load rejects, and a later call tries again.
 */
export const loadContinuous = /* @__PURE__ */ loader(() => import('./continuous-entry.js'));

/**
 * Load the values module, once. The scanner loads it the first time it meets a `data-motion-value`: until it is loaded,
 * the element keeps its content, and its values bind when it is. A failed load rejects, and a later call tries again.
 */
export const loadValues = /* @__PURE__ */ loader(() => import('./value-entry.js'));

/**
 * Load the sequences module, once. A failed load rejects, and a later call tries again.
 */
export const loadSequences = /* @__PURE__ */ loader(() => import('./sequence-entry.js'));
