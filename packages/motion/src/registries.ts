import type { SequenceRef } from './sequence.js';
import type { ValueRef } from './value.js';

type Listener<R> = (ref: R) => void;

// The definitions of values and sequences, and their listeners, live on globalThis so that every copy of the package
// shares them. They sit here, apart from the modules that bind them, so that the scanner can read them without loading
// those modules.
const shared = globalThis as unknown as Record<symbol, unknown>;
const VALUE_DEFINITIONS = Symbol.for('udixio.motion.values.preview.1');
const VALUE_LISTENERS = Symbol.for('udixio.motion.value-listeners.preview.1');
const SEQUENCE_DEFINITIONS = Symbol.for('udixio.motion.sequences.preview.1');
const SEQUENCE_LISTENERS = Symbol.for('udixio.motion.sequence-listeners.preview.1');

function registry<T>(key: symbol, create: () => T): T {
  shared[key] ??= create();
  return shared[key] as T;
}

export function valueDefinitions(): Map<string, ValueRef> {
  return registry(VALUE_DEFINITIONS, () => new Map<string, ValueRef>());
}

export function valueListeners(): Set<Listener<ValueRef>> {
  return registry(VALUE_LISTENERS, () => new Set<Listener<ValueRef>>());
}

export function sequenceDefinitions(): Map<string, SequenceRef> {
  return registry(SEQUENCE_DEFINITIONS, () => new Map<string, SequenceRef>());
}

export function sequenceListeners(): Set<Listener<SequenceRef>> {
  return registry(SEQUENCE_LISTENERS, () => new Set<Listener<SequenceRef>>());
}

export function resolveValue(name: string): ValueRef | undefined {
  return valueDefinitions().get(name);
}

/** Call `listener` for each newly defined value; returns an unsubscribe function. */
export function onValueDefined(listener: Listener<ValueRef>): () => void {
  const set = valueListeners();
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

export function resolveSequence(name: string): SequenceRef | undefined {
  return sequenceDefinitions().get(name);
}

/** Call `listener` for each newly defined sequence; returns an unsubscribe function. */
export function onSequenceDefined(listener: Listener<SequenceRef>): () => void {
  const set = sequenceListeners();
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}
