import { motionManifest, validateMotionDocument, type MotionDocument } from './manifest.js';

/** Experimental motion spec, as accepted by `validateMotionDocument`. */
export type MotionSpec = MotionDocument['spec'];

/** Named, validated motion definition. */
export interface MotionRef<N extends string = string> {
  readonly name: N;
  readonly spec: Readonly<MotionSpec>;
}

type Listener = (ref: MotionRef) => void;

const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const DEFINITIONS = Symbol.for('udixio.motion.definitions.preview.1');
const LISTENERS = Symbol.for('udixio.motion.definition-listeners.preview.1');
const SPEC_KEYS: readonly string[] = [
  ...motionManifest.spec.required,
  ...motionManifest.spec.optional,
];
const reservedNames: readonly string[] = motionManifest.reserved.names;
const reservedPrefixes: readonly string[] = motionManifest.reserved.prefixes;

/** Registries live on globalThis so that every copy of the package shares them. */
const shared = globalThis as unknown as Record<symbol, unknown>;

function definitions(): Map<string, MotionRef> {
  shared[DEFINITIONS] ??= new Map<string, MotionRef>();
  return shared[DEFINITIONS] as Map<string, MotionRef>;
}

function listeners(): Set<Listener> {
  shared[LISTENERS] ??= new Set<Listener>();
  return shared[LISTENERS] as Set<Listener>;
}

function assertName(name: string): void {
  if (!NAME_PATTERN.test(name))
    throw new TypeError(`Motion name "${name}" must be kebab-case`);
  if (
    reservedNames.includes(name) ||
    reservedPrefixes.some(prefix => name.startsWith(prefix))
  )
    throw new TypeError(`Motion name "${name}" is reserved`);
}

function inOrder(
  source: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    keys.filter(key => key in source).map(key => [key, source[key]]),
  );
}

/** Copy a validated spec with keys in manifest order, frozen at every level. A layout has `keyframes: []`. */
function canonicalSpec(spec: MotionSpec): Readonly<MotionSpec> {
  const source: Record<string, unknown> = { keyframes: [], ...(spec as unknown as Record<string, unknown>) };
  const copy = inOrder(source, SPEC_KEYS);
  copy.keyframes = (source.keyframes as Record<string, unknown>[]).map(frame =>
    Object.freeze(inOrder(frame, motionManifest.domains.visualFields)),
  );
  if (typeof source.timing === 'object')
    copy.timing = Object.freeze(
      inOrder(source.timing as Record<string, unknown>, ['duration', 'easing']),
    );
  Object.freeze(copy.keyframes);
  return Object.freeze(copy) as unknown as Readonly<MotionSpec>;
}

/** Validate a spec and return its canonical frozen copy; throws `TypeError`. */
export function validateMotionSpec(spec: unknown): Readonly<MotionSpec> {
  const result = validateMotionDocument({
    version: motionManifest.version,
    spec,
  });
  if (!result.valid)
    throw new TypeError(
      `Invalid motion spec: ${result.errors
        .map(({ path, code }) => `${path}: ${code}`)
        .join('; ')}`,
    );
  return canonicalSpec(result.value.spec);
}

/**
 * Define a named motion. Re-defining a name with an identical spec returns the
 * existing reference; a different spec throws.
 */
export function defineMotion<N extends string>(
  name: N,
  spec: MotionSpec,
): MotionRef<N> {
  assertName(name);
  const validated = validateMotionSpec(spec);
  const registry = definitions();
  const existing = registry.get(name);
  if (existing) {
    if (JSON.stringify(existing.spec) === JSON.stringify(validated))
      return existing as MotionRef<N>;
    throw new Error(`Motion "${name}" is already defined with a different spec`);
  }
  const ref = Object.freeze({ name, spec: validated });
  registry.set(name, ref);
  for (const listener of [...listeners()]) {
    try {
      listener(ref);
    } catch (error) {
      console.error('[@udixio/motion] A definition listener failed:', error);
    }
  }
  return ref;
}

/** Whether a verb is a presence verb, which enters and leaves the page. */
export function isPresenceVerb(verb: MotionSpec['verb']): verb is 'appear' | 'disappear' {
  return verb === 'appear' || verb === 'disappear';
}

/** The kind of a motion: an element holds at most one binding of each kind. */
export type MotionKind = 'presence' | 'emphasis' | 'layout';

/** The kind of a verb: `appear` and `disappear` are presence motions, `emphasize` an emphasis, `layout` a layout. */
export function kindOf(verb: MotionSpec['verb']): MotionKind {
  if (isPresenceVerb(verb)) return 'presence';
  return verb === 'emphasize' ? 'emphasis' : 'layout';
}

export function resolveMotion(name: string): MotionRef | undefined {
  return definitions().get(name);
}

/** The names of the defined motions, in definition order. */
export function definedMotions(): readonly string[] {
  return [...definitions().keys()];
}

/** Call `listener` for each newly defined motion; returns an unsubscribe function. */
export function onMotionDefined(listener: Listener): () => void {
  const set = listeners();
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}
