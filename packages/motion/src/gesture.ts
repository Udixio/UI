import { NAME_PATTERN, timingIssues, type MotionValidationCode } from './manifest.js';
import type { SpringRef } from './motion-spec.js';
import { gestureDefinitions, gestureListeners } from './registries.js';

/** What a gesture does with the pointer: drags the element, throws it away sideways, or reorders it among its siblings. */
export type GestureType = 'drag' | 'swipe' | 'reorder';

/**
 * A gesture on an element, of the `type` `drag`, `swipe` or `reorder`. `drag` follows the pointer on `axis`, within its parent when `bounds` is `parent`. `swipe`
 * follows it on one axis, and flies it out when it is released far or fast enough. `reorder` moves it among the siblings
 * that carry the same gesture, on one axis. `timing` is the spring of the release: a spring only, since the release keeps
 * the velocity of the pointer. `alternative` names the keyboard
 * alternative of the type: arrows move a drag, a key swipes, and Space, arrows and Escape reorder; it is inferred from the
 * type when the spec leaves it out. `afterFlyOut` is taken by a swipe only: `hide` (the default) keeps the element in the
 * DOM, out of assistive technology's sight, and `remove` takes it out of the DOM once it has flown out.
 */
export type GestureSpec =
  | { type: 'drag'; axis?: 'x' | 'y' | 'both'; bounds?: 'parent' | 'none'; timing?: SpringRef; alternative?: 'arrows' }
  | { type: 'swipe'; axis?: 'x' | 'y'; timing?: SpringRef; alternative?: 'action'; afterFlyOut?: 'hide' | 'remove' }
  | { type: 'reorder'; axis?: 'x' | 'y'; timing?: SpringRef; alternative?: 'grab' };

/** Named, validated gesture definition. */
export interface GestureRef<N extends string = string> {
  /** The name the gesture was defined with. */
  readonly name: N;
  /** The validated definition. */
  readonly spec: Readonly<GestureSpec>;
}

type Issue = { path: string; code: MotionValidationCode };

/** The keyboard alternative, the axes and the default axis of each type. */
const TYPES: Readonly<Record<GestureType, { alternative: string; axes: readonly string[]; axis: 'x' | 'y' | 'both' }>> = {
  drag: { alternative: 'arrows', axes: ['x', 'y', 'both'], axis: 'both' },
  swipe: { alternative: 'action', axes: ['x', 'y'], axis: 'x' },
  reorder: { alternative: 'grab', axes: ['x', 'y'], axis: 'y' },
};
const TYPE_NAMES: readonly string[] = Object.keys(TYPES);
const BOUNDS: readonly string[] = ['parent', 'none'];
const FIELDS: readonly string[] = ['type', 'axis', 'bounds', 'afterFlyOut', 'timing', 'alternative'];
const AFTER_FLY_OUT: readonly string[] = ['hide', 'remove'];
/** The default timing of a release is the spatial spring of the default speed, like a value's. */
export const DEFAULT_GESTURE_TIMING: SpringRef = 'spring.default.spatial';
/** The axis a gesture moves along when its spec names none: both for drag, x for swipe, y for reorder. */
export const DEFAULT_AXIS: Readonly<Record<GestureType, 'x' | 'y' | 'both'>> = {
  drag: TYPES.drag.axis,
  swipe: TYPES.swipe.axis,
  reorder: TYPES.reorder.axis,
};

function oneOf(values: readonly string[], value: unknown): boolean {
  return typeof value === 'string' && values.includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The issues of a gesture spec, sorted by path then code, as the value validator sorts them. */
function issuesOf(input: unknown): Issue[] {
  const issues: Issue[] = [];
  const add = (path: string, code: MotionValidationCode) => issues.push({ path, code });
  if (!isRecord(input)) {
    add('', 'type');
    return issues;
  }
  for (const key of Object.keys(input)) if (!FIELDS.includes(key)) add(`/${key}`, 'unknown_field');

  if (!('type' in input)) add('/type', 'required');
  else if (typeof input.type !== 'string') add('/type', 'type');
  else if (!TYPE_NAMES.includes(input.type)) add('/type', 'invalid_value');
  else {
    const type = input.type as GestureType;
    const { alternative, axes } = TYPES[type];
    if ('alternative' in input && input.alternative !== undefined) {
      if (typeof input.alternative !== 'string') add('/alternative', 'type');
      else if (input.alternative !== alternative) add('/alternative', 'invalid_value');
    }

    if ('afterFlyOut' in input) {
      if (type !== 'swipe') add('/afterFlyOut', 'unsupported');
      else if (typeof input.afterFlyOut !== 'string') add('/afterFlyOut', 'type');
      else if (!oneOf(AFTER_FLY_OUT, input.afterFlyOut)) add('/afterFlyOut', 'invalid_value');
    }

    if ('axis' in input) {
      if (typeof input.axis !== 'string') add('/axis', 'type');
      else if (!oneOf(axes, input.axis)) add('/axis', 'invalid_value');
    }

    if ('bounds' in input) {
      if (type !== 'drag') add('/bounds', 'unsupported');
      else if (typeof input.bounds !== 'string') add('/bounds', 'type');
      else if (!oneOf(BOUNDS, input.bounds)) add('/bounds', 'invalid_value');
    }

    // The release keeps the velocity of the pointer: a spring only.
    if ('timing' in input) for (const issue of timingIssues(input.timing, ['spring'])) add(`/timing${issue.path}`, issue.code);
  }

  return issues.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : a.code < b.code ? -1 : a.code > b.code ? 1 : 0,
  );
}

/** The spec with its defaults filled in, in a fixed key order, frozen. */
function canonicalGestureSpec(spec: GestureSpec): Readonly<GestureSpec> {
  const copy: Record<string, unknown> = { type: spec.type, axis: spec.axis ?? TYPES[spec.type]?.axis };
  if (spec.type === 'drag') copy.bounds = spec.bounds ?? 'parent';
  if (spec.type === 'swipe') copy.afterFlyOut = spec.afterFlyOut ?? 'hide';
  copy.timing = spec.timing ?? DEFAULT_GESTURE_TIMING;
  copy.alternative = TYPES[spec.type]?.alternative;
  return Object.freeze(copy) as Readonly<GestureSpec>;
}

/**
 * Validate a gesture spec and return its canonical frozen copy, with the defaults filled in; throws `TypeError`.
 * The check runs in development only: a production build trusts the definition.
 */
export function validateGestureSpec(spec: unknown): Readonly<GestureSpec> {
  if (__MOTION_CHECKS__) {
    const issues = issuesOf(spec);
    if (issues.length)
      throw new TypeError(`Invalid gesture spec: ${issues.map(({ path, code }) => `${path}: ${code}`).join('; ')}`);
  }
  return canonicalGestureSpec(spec as GestureSpec);
}

/**
 * Define a named gesture. Re-defining a name with an identical spec returns the existing reference; a different spec
 * throws. The name is kebab-case, checked always; the spec is validated in development only.
 * @param name - A kebab-case name, unique on the page.
 * @param spec - The type (drag, swipe or reorder), its axis, bounds and timing.
 * @returns The reference of the definition.
 */
export function defineGesture<N extends string>(name: N, spec: GestureSpec): GestureRef<N> {
  if (!NAME_PATTERN.test(name)) throw new TypeError(`Gesture name "${name}" must be kebab-case`);
  const validated = validateGestureSpec(spec);
  const registry = gestureDefinitions();
  const existing = registry.get(name);
  if (existing) {
    if (JSON.stringify(existing.spec) === JSON.stringify(validated)) return existing as GestureRef<N>;
    throw new Error(`Gesture "${name}" is already defined with a different spec`);
  }
  const ref = Object.freeze({ name, spec: validated });
  registry.set(name, ref);
  for (const listener of [...gestureListeners()]) {
    try {
      listener(ref);
    } catch (error) {
      console.error('[@udixio/motion] A gesture listener failed:', error);
    }
  }
  return ref;
}
