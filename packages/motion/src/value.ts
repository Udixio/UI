import { motionManifest, NAME_PATTERN, type MotionValidationCode } from './manifest.js';
import type { SpringRef } from './motion-spec.js';
import { valueDefinitions, valueListeners } from './registries.js';
import type { CurveTiming } from './tokens.js';

export { onValueDefined, resolveValue } from './registries.js';

/** Where a value comes from: the pointer, the document scroll, a state the page sets, or a time loop. */
export type ValueSource = 'pointer' | 'scroll' | 'state' | 'time';
export type ValueAxis = 'x' | 'y' | 'block' | 'inline';
/** How a state value is also written as text: whole numbers, decimals, a percentage of a fraction, or a currency. */
export type ValueFormat = 'integer' | 'decimal' | 'percent' | 'currency';

/**
 * A continuous number an element can use in CSS: written as `--udx-motion-value-<name>` on each bound element.
 * `axis` is taken by `pointer` (`x` or `y`) and `scroll` (`block` or `inline`). `spring` smooths the value and keeps its
 * velocity when the target moves again; `none` writes it at once. `timing` is taken by `time` only, for its period:
 * its `duration` is the period, and its `easing` is not applied to the progress.
 * `format` is taken by `state` only: the number is also written as text, in the page's language, and it counts up when
 * the element scrolls into view. `currency` is an ISO 4217 code, required with the `currency` format and refused otherwise.
 */
export interface ValueSpec {
  source: ValueSource;
  axis?: ValueAxis;
  range?: readonly [number, number];
  spring?: SpringRef | 'none';
  timing?: CurveTiming;
  format?: ValueFormat;
  currency?: string;
}

/** Named, validated value definition. */
export interface ValueRef<N extends string = string> {
  readonly name: N;
  readonly spec: Readonly<ValueSpec>;
}

type Issue = { path: string; code: MotionValidationCode };

const SOURCES: readonly string[] = ['pointer', 'scroll', 'state', 'time'];
const FIELDS: readonly string[] = ['source', 'axis', 'range', 'spring', 'timing', 'format', 'currency'];
const FORMATS: readonly string[] = ['integer', 'decimal', 'percent', 'currency'];
const CURRENCY_CODE = /^[A-Z]{3}$/;
const AXES: Record<'pointer' | 'scroll', readonly string[]> = { pointer: ['x', 'y'], scroll: ['block', 'inline'] };
const DEFAULT_SPRING: SpringRef = 'spring.default.spatial';
/** A formatted value is critically damped: a count goes to its value and never overshoots it. */
const COUNTER_SPRING: SpringRef = 'spring.default.effects';

function oneOf(values: readonly string[], value: unknown): boolean {
  return typeof value === 'string' && values.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** The issues of a value spec, sorted by path then code, as the motion validator sorts them. */
function issuesOf(input: unknown): Issue[] {
  const issues: Issue[] = [];
  const add = (path: string, code: MotionValidationCode) => issues.push({ path, code });
  if (!isRecord(input)) {
    add('', 'type');
    return issues;
  }
  for (const key of Object.keys(input)) if (!FIELDS.includes(key)) add(`/${key}`, 'unknown_field');

  let source: ValueSource | undefined;
  if (!('source' in input)) add('/source', 'required');
  else if (typeof input.source !== 'string') add('/source', 'type');
  else if (!SOURCES.includes(input.source)) add('/source', 'invalid_value');
  else source = input.source as ValueSource;

  if ('axis' in input) {
    if (source === 'state' || source === 'time') add('/axis', 'unsupported');
    else if (source === 'pointer' || source === 'scroll') {
      if (typeof input.axis !== 'string') add('/axis', 'type');
      else if (!oneOf(AXES[source], input.axis)) add('/axis', 'invalid_value');
    }
  }

  if ('range' in input) {
    const range = input.range;
    if (!Array.isArray(range)) add('/range', 'type');
    else if (range.length !== 2) add('/range', 'invalid_value');
    else if (!range.every(bound => typeof bound === 'number')) add('/range', 'type');
    else if (!range.every(isFiniteNumber) || range[0] === range[1]) add('/range', 'invalid_value');
  }

  if ('spring' in input) {
    if (source === 'time') add('/spring', 'unsupported');
    else if (typeof input.spring !== 'string') add('/spring', 'type');
    else if (input.spring !== 'none' && !oneOf(motionManifest.domains.springs, input.spring)) add('/spring', 'invalid_value');
  }

  if ('timing' in input) {
    if (source === 'state' || source === 'pointer' || source === 'scroll') add('/timing', 'unsupported');
    else if (source === 'time') {
      const timing = input.timing;
      if (!isRecord(timing)) add('/timing', 'type');
      else {
        for (const key of Object.keys(timing)) if (key !== 'duration' && key !== 'easing') add(`/timing/${key}`, 'unknown_field');
        if (!('duration' in timing)) add('/timing/duration', 'required');
        else if (typeof timing.duration !== 'string') add('/timing/duration', 'type');
        else if (!oneOf(motionManifest.domains.durations, timing.duration)) add('/timing/duration', 'invalid_value');
        if (!('easing' in timing)) add('/timing/easing', 'required');
        else if (typeof timing.easing !== 'string') add('/timing/easing', 'type');
        else if (!oneOf(motionManifest.domains.easings, timing.easing)) add('/timing/easing', 'invalid_value');
      }
    }
  }

  if ('format' in input) {
    if (source === 'pointer' || source === 'scroll' || source === 'time') add('/format', 'unsupported');
    else if (typeof input.format !== 'string') add('/format', 'type');
    else if (!oneOf(FORMATS, input.format)) add('/format', 'invalid_value');
  }

  if ('currency' in input) {
    if (input.format !== 'currency') add('/currency', 'unsupported');
    else if (typeof input.currency !== 'string') add('/currency', 'type');
    else if (!CURRENCY_CODE.test(input.currency)) add('/currency', 'invalid_value');
  } else if (input.format === 'currency') add('/currency', 'required');

  return issues.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : a.code < b.code ? -1 : a.code > b.code ? 1 : 0,
  );
}

/** The spec with its defaults filled in, in a fixed key order, frozen at every level. */
function canonicalValueSpec(spec: ValueSpec): Readonly<ValueSpec> {
  const counted = spec.source === 'state' && spec.format !== undefined;
  const copy: Record<string, unknown> = { source: spec.source };
  if (spec.source === 'pointer' || spec.source === 'scroll') copy.axis = spec.axis ?? (spec.source === 'pointer' ? 'x' : 'block');
  const range = spec.range ?? [0, 1];
  copy.range = Object.freeze([range[0], range[1]]);
  if (spec.source !== 'time') copy.spring = spec.spring ?? (counted ? COUNTER_SPRING : DEFAULT_SPRING);
  if (counted) {
    copy.format = spec.format;
    if (spec.format === 'currency') copy.currency = spec.currency;
  }
  if (spec.source === 'time') {
    const timing = spec.timing ?? motionManifest.defaults.loop.curve;
    copy.timing = Object.freeze({ duration: timing.duration, easing: timing.easing });
  }
  return Object.freeze(copy) as Readonly<ValueSpec>;
}

/**
 * Validate a value spec and return its canonical frozen copy, with the defaults filled in; throws `TypeError`.
 * The check runs in development only: a production build trusts the definition.
 */
export function validateValueSpec(spec: unknown): Readonly<ValueSpec> {
  if (typeof process === 'object' && process.env.NODE_ENV !== 'production') {
    const issues = issuesOf(spec);
    if (issues.length)
      throw new TypeError(`Invalid value spec: ${issues.map(({ path, code }) => `${path}: ${code}`).join('; ')}`);
  }
  return canonicalValueSpec(spec as ValueSpec);
}

/**
 * Define a named value. Re-defining a name with an identical spec returns the existing reference; a different spec
 * throws. The name is kebab-case, checked always; the spec is validated in development only.
 */
export function defineValue<N extends string>(name: N, spec: ValueSpec): ValueRef<N> {
  if (!NAME_PATTERN.test(name)) throw new TypeError(`Value name "${name}" must be kebab-case`);
  const validated = validateValueSpec(spec);
  const registry = valueDefinitions();
  const existing = registry.get(name);
  if (existing) {
    if (JSON.stringify(existing.spec) === JSON.stringify(validated)) return existing as ValueRef<N>;
    throw new Error(`Value "${name}" is already defined with a different spec`);
  }
  const ref = Object.freeze({ name, spec: validated });
  registry.set(name, ref);
  for (const listener of [...valueListeners()]) {
    try {
      listener(ref);
    } catch (error) {
      console.error('[@udixio/motion] A value listener failed:', error);
    }
  }
  return ref;
}
