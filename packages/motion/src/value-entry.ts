// The public entry `@udixio/motion/value`: the values, which the main entry does not hold; the scanner loads this module
// when a page meets a data-motion-value.
export { defineValue, validateValueSpec } from './value.js';
export type { ValueSpec, ValueRef, ValueSource, ValueAxis, ValueFormat } from './value.js';
export { value, getValue } from './value-binding.js';
export type { ValueBinding } from './value-binding.js';
export { onValueDefined, resolveValue } from './registries.js';
