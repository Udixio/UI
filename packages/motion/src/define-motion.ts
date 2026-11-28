import type { SpringRef } from './motion-spec.js';
import { readKeyframes, type StyleKeyframe } from './keyframes.js';
import {
  motionManifest,
  NAME_PATTERN,
  timingIssues,
  validateMotionDocument,
  type MotionDocument,
  type MotionValidationCode,
} from './manifest.js';
import { readReducedWord, type ReducedForm } from './reduced-form.js';
import type { CurveTiming } from './tokens.js';

/** A motion spec with a verb: the old model, as `validateMotionDocument` accepts it. */
export type LegacySpec = MotionDocument['spec'];

/** A motion of the new model: no verb, and only the options that a trigger reads. */
export interface VerblessSpec {
  /** One keyframe, or a list of them: at least one. A keyframe takes any CSS property, shorthands kept. */
  keyframes: StyleKeyframe | readonly StyleKeyframe[];
  /** A spring of the manifest or a curve; without one, each property takes its default timing. */
  timing?: SpringRef | CurveTiming;
  /** Milliseconds before the motion starts: a finite number, not negative. */
  delay?: number;
  /** The reduced form: `fade`, `end`, `start` or `none`, or a keyframe shown at once. */
  reduced?: 'fade' | 'end' | 'start' | 'none' | StyleKeyframe;
  // A motion without a verb takes none of the options of a spec with a verb: each is typed never, as the legacy branches do.
  verb?: never;
  interrupt?: never;
  stagger?: never;
  origin?: never;
  split?: never;
  exit?: never;
  shared?: never;
  repeat?: never;
  axis?: never;
  range?: never;
  pause?: never;
  reason?: never;
}

/** A motion spec: with a verb (`LegacySpec`), or without one (`VerblessSpec`). */
export type MotionSpec = LegacySpec | VerblessSpec;

/** What a motion can be given by: a defined name, a definition, or a spec of either shape. */
export type MotionSource = MotionName | MotionRef | Readonly<MotionSpec>;

/** Named, validated motion definition. */
export interface MotionRef<N extends string = string, S extends MotionSpec = MotionSpec> {
  /** The name the motion was defined with. */
  readonly name: N;
  /** The validated definition. */
  readonly spec: Readonly<S>;
}

/**
 * The motion names the types know, so that they autocomplete: the presets, and the names an app defines, which it adds to
 * this interface with declaration merging (`interface MotionRegistry { 'card-enter': true }`). A name missing here still
 * works, as a string: see `MotionName`.
 */
export interface MotionRegistry {
  fade: true;
  slide: true;
  cascade: true;
  scale: true;
  draw: true;
  press: true;
  reflow: true;
  rise: true;
  parallax: true;
  rotate: true;
  breathe: true;
  blink: true;
  shake: true;
  grow: true;
  dip: true;
}

/** A motion name: one of the registered names, or any string, so that the names that are not registered keep working. */
export type MotionName = keyof MotionRegistry | (string & {});

type Listener = (ref: MotionRef) => void;

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

/** Throw a `TypeError` when `name` is not kebab-case or is reserved; `what` names it in the message. */
export function assertName(name: string, what = 'Motion name'): void {
  if (!NAME_PATTERN.test(name))
    throw new TypeError(`${what} "${name}" must be kebab-case`);
  if (
    reservedNames.includes(name) ||
    reservedPrefixes.some(prefix => name.startsWith(prefix))
  )
    throw new TypeError(`${what} "${name}" is reserved`);
}

/**
 * Name a shared identity: the layout motions that bear the same name follow one element into another (a thumbnail
 * that becomes the card it opens). Validated like a motion name, and returned as given.
 * @param name - A kebab-case key.
 * @returns The key, as given.
 */
export function defineShared<N extends string>(name: N): N {
  assertName(name, 'Shared identity');
  return name;
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
function canonicalSpec(spec: LegacySpec): Readonly<LegacySpec> {
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
  return Object.freeze(copy) as unknown as Readonly<LegacySpec>;
}

/** Canonical specs by structure: structurally equal specs share one object, so bindings of one spec form one group. */
const canonicalSpecs = new Map<string, Readonly<MotionSpec>>();

/** Whether a value is an object that is not an array. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The keys of an object whose value is set: an undefined value is an absent option. */
function setKeys(value: Record<string, unknown>): string[] {
  return Object.keys(value).filter((key) => value[key] !== undefined);
}

/** Whether a spec as written has no verb: a motion of the new model. */
function isVerblessInput(spec: unknown): spec is Record<string, unknown> {
  return isRecord(spec) && spec.verb === undefined;
}

/** The keys of a spec without a verb: its keyframes, and its timing, delay and reduced form. */
const VERBLESS_KEYS: readonly string[] = ['keyframes', 'timing', 'delay', 'reduced'];
/** The reduced forms of a spec without a verb; the old words `instant` and `static` are read by `readMotion` only. */
const VERBLESS_REDUCED: readonly string[] = ['fade', 'end', 'start', 'none'];
/** The frame fields the new model does not read yet: the offset, and the SVG fractions `draw` and `along`. */
const UNREAD_FRAME_FIELDS: readonly string[] = ['offset', 'draw', 'along'];

/** Adds the issues of one frame at `path`: a CSS property with a finite number, a string or `null`, and no conflict. */
function frameIssues(frame: unknown, path: string, add: (path: string, code: MotionValidationCode) => void): void {
  if (!isRecord(frame)) {
    add(path, 'type');
    return;
  }
  const keys = setKeys(frame);
  if (keys.length === 0) add(path, 'empty');
  for (const key of keys) {
    const value = frame[key];
    if (UNREAD_FRAME_FIELDS.includes(key)) add(`${path}/${key}`, 'unsupported');
    else if (typeof value === 'number') {
      if (!Number.isFinite(value)) add(`${path}/${key}`, 'invalid_value');
    } else if (value !== null && typeof value !== 'string') add(`${path}/${key}`, 'type');
  }
  // `null` keeps the underlying value: it writes nothing, so it cannot conflict.
  const written = keys.filter((key) => frame[key] !== null);
  if (written.includes('translate') && (written.includes('x') || written.includes('y'))) add(path, 'conflict');
  if (written.includes('scale') && (written.includes('scaleX') || written.includes('scaleY'))) add(path, 'conflict');
}

/**
 * The issues of a spec without a verb, as `path: code` with paths from `/spec`; empty when it is valid. Its keyframes are one
 * frame or a list of them, and a frame takes any CSS property (`x`, `scale`, `backgroundColor`, `--x`).
 * @param spec - The spec, as written.
 * @returns The issues.
 */
export function validateVerblessSpec(spec: unknown): readonly string[] {
  const issues: string[] = [];
  const add = (path: string, code: MotionValidationCode): void => {
    issues.push(`${path}: ${code}`);
  };
  if (!isRecord(spec)) {
    add('/spec', 'type');
    return issues;
  }
  for (const key of setKeys(spec)) if (!VERBLESS_KEYS.includes(key)) add(`/spec/${key}`, 'unknown_field');
  if (spec.keyframes === undefined) add('/spec/keyframes', 'required');
  else if (Array.isArray(spec.keyframes)) {
    if (spec.keyframes.length === 0) add('/spec/keyframes', 'empty');
    spec.keyframes.forEach((frame: unknown, index: number) => frameIssues(frame, `/spec/keyframes/${index}`, add));
  } else frameIssues(spec.keyframes, '/spec/keyframes', add);
  if (spec.timing !== undefined)
    for (const issue of timingIssues(spec.timing, ['spring', 'curve'])) add(`/spec/timing${issue.path}`, issue.code);
  if (spec.delay !== undefined && !(typeof spec.delay === 'number' && Number.isFinite(spec.delay) && spec.delay >= 0))
    add('/spec/delay', typeof spec.delay === 'number' ? 'invalid_value' : 'type');
  if (typeof spec.reduced === 'string') {
    if (!VERBLESS_REDUCED.includes(spec.reduced)) add('/spec/reduced', 'invalid_value');
  } else if (spec.reduced !== undefined) frameIssues(spec.reduced, '/spec/reduced', add);
  return issues;
}

/** A copy of an object with its keys sorted and frozen; any other value as it is. */
function sortedCopy(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return Object.freeze(Object.fromEntries(entries));
}

/** The canonical copy of a spec without a verb: its keyframes as a list, every object with its keys sorted, frozen. */
function canonicalVerbless(spec: Record<string, unknown>): Readonly<VerblessSpec> {
  const frames = Array.isArray(spec.keyframes) ? spec.keyframes : [spec.keyframes];
  const copy: Record<string, unknown> = { keyframes: Object.freeze(frames.map(sortedCopy)) };
  if (spec.timing !== undefined) copy.timing = sortedCopy(spec.timing);
  if (spec.delay !== undefined) copy.delay = spec.delay;
  if (spec.reduced !== undefined) copy.reduced = sortedCopy(spec.reduced);
  return Object.freeze(copy) as Readonly<VerblessSpec>;
}

/** The canonical frozen copy of a spec of either shape, with no validation and no cache. */
function canonicalOf(spec: unknown): Readonly<MotionSpec> {
  return isVerblessInput(spec) ? canonicalVerbless(spec) : canonicalSpec(spec as LegacySpec);
}

/** The issues of a spec with a verb, from the manifest's validator. */
function legacyIssues(spec: unknown): string[] {
  const result = validateMotionDocument({ version: motionManifest.version, spec });
  return result.valid ? [] : result.errors.map(({ path, code }) => `${path}: ${code}`);
}

/** Throws a `TypeError` that lists the issues of a spec, in development; a production build trusts the definition. */
function checkSpec(spec: unknown): void {
  if (!__MOTION_CHECKS__) return;
  const issues = isVerblessInput(spec) ? [...validateVerblessSpec(spec)] : legacyIssues(spec);
  if (issues.length > 0) throw new TypeError(`Invalid motion spec: ${issues.join('; ')}`);
}

/**
 * Validate a spec and return its canonical frozen copy, shared by every structurally equal spec; throws `TypeError`.
 * A spec with a verb goes through the manifest's validator, one without a verb through `validateVerblessSpec`.
 * The check runs in development only: a production build trusts the definition.
 * The development test is the build flag `__MOTION_CHECKS__`: the default build reads `process` only where it exists, so a
 * plain page (no bundler, no `process`) runs the production path, and the `development` build sets the flag on.
 * @param spec - The spec, as written.
 * @returns The canonical copy.
 */
export function validateMotionSpec(spec: { verb: unknown; [key: string]: unknown }): Readonly<LegacySpec>;
export function validateMotionSpec(spec: unknown): Readonly<MotionSpec>;
export function validateMotionSpec(spec: unknown): Readonly<MotionSpec> {
  checkSpec(spec);
  const canonical = canonicalOf(spec);
  const key = JSON.stringify(canonical);
  const cached = canonicalSpecs.get(key);
  if (cached) return cached;
  canonicalSpecs.set(key, canonical);
  return canonical;
}

/**
 * Define a named motion. Re-defining a name with an identical spec returns the
 * existing reference; a different spec throws. The spec is validated in development only:
 * a production build trusts the definition.
 * @param name - A kebab-case name, unique on the page.
 * @param spec - The verb, the keyframes and the options of the motion.
 * @returns The reference of the definition, to pass to `motion()` or an adapter.
 */
export function defineMotion<N extends string>(name: N, spec: LegacySpec): MotionRef<N, LegacySpec>;
export function defineMotion<N extends string>(name: N, spec: VerblessSpec): MotionRef<N, VerblessSpec>;
export function defineMotion<N extends string>(name: N, spec: MotionSpec): MotionRef<N>;
export function defineMotion<N extends string>(name: N, spec: MotionSpec): MotionRef<N> {
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
export function isPresenceVerb(verb: LegacySpec['verb']): verb is 'appear' | 'disappear' {
  return verb === 'appear' || verb === 'disappear';
}

/** The kind of a motion: an element holds at most one binding of each kind. */
export type MotionKind = 'presence' | 'emphasis' | 'layout' | 'view' | 'loop';

/**
 * The kind of a verb: `appear` and `disappear` are presence motions, `emphasize` an emphasis, `layout` a layout,
 * `reveal` and `scrub` view motions (driven by the viewport and the scroll), `loop` a loop.
 */
export function kindOf(verb: LegacySpec['verb']): MotionKind {
  if (isPresenceVerb(verb)) return 'presence';
  if (verb === 'emphasize') return 'emphasis';
  if (verb === 'reveal' || verb === 'scrub') return 'view';
  if (verb === 'loop') return 'loop';
  return 'layout';
}

/** The definition of a motion name, or undefined while no motion of that name is defined. */
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

/**
 * The content key of a spec: the JSON of its canonical copy, so that equal motions have equal keys, whatever the order of
 * their keys and the form of their keyframes (one frame, or a list of one).
 * @param spec - A spec of either shape.
 * @returns The key.
 */
export function contentKeyOf(spec: Readonly<MotionSpec>): string {
  return JSON.stringify(canonicalOf(spec));
}

/**
 * Whether a spec has no verb: a motion of the new model, which `attach` takes and the old entry points refuse.
 * @param spec - A spec of either shape.
 * @returns Whether the spec has no verb.
 */
export function isVerbless(spec: Readonly<MotionSpec>): spec is Readonly<VerblessSpec> {
  return spec.verb === undefined;
}

/** A motion as the new model reads it: its frames, its timing, its delay and its reduced form, with the key of its spec. */
export interface MotionReading {
  /** The name the motion is defined with; absent for a spec given inline. */
  readonly name?: string;
  /** The content key of the spec (`contentKeyOf`): equal for equal motions. */
  readonly key: string;
  /** The keyframes as a list, shorthands kept; a layout motion has none. */
  readonly frames: readonly StyleKeyframe[];
  /** The timing as written; absent when each property takes its default timing. */
  readonly timing?: SpringRef | CurveTiming;
  /** Milliseconds before the motion starts; 0 when none is set. */
  readonly delay: number;
  /** The reduced form; absent when none is set. The old words of a spec with a verb are read as the new ones. */
  readonly reduced?: ReducedForm;
}

/** The fields of the old model's SVG keyframes, which the reader skips until the new model reads them. */
const SKIPPED_FIELDS: readonly string[] = ['draw', 'along'];
/** The keys of the motions whose skipped fields were already reported. */
const reportedSkips = new Set<string>();

/** The frames without `draw` and `along`; the skip is reported once per motion in development. */
function withoutSkippedFields(frames: readonly StyleKeyframe[], key: string, development: boolean): readonly StyleKeyframe[] {
  if (!frames.some((frame) => SKIPPED_FIELDS.some((field) => field in frame))) return frames;
  if (development && !reportedSkips.has(key)) {
    reportedSkips.add(key);
    console.warn('[@udixio/motion] draw and along are not read yet: this motion skips them.');
  }
  return frames.map(
    (frame) =>
      Object.fromEntries(
        Object.entries(frame).filter(([field]) => !SKIPPED_FIELDS.includes(field)),
      ) as StyleKeyframe,
  );
}

/** The keyframes of a spec as a list; none for a layout motion, which has no keyframes. */
function framesOf(keyframes: StyleKeyframe | readonly StyleKeyframe[] | undefined): readonly StyleKeyframe[] {
  if (keyframes === undefined || (Array.isArray(keyframes) && keyframes.length === 0)) return [];
  return readKeyframes(keyframes);
}

/** The reduced form of a spec: a spec without a verb as written, a spec with one with its old word read as the new one. */
function reducedOf(spec: Readonly<MotionSpec>): ReducedForm | undefined {
  if (isVerbless(spec)) return spec.reduced;
  return typeof spec.reduced === 'string' ? readReducedWord(spec.reduced) : undefined;
}

/** The reading of a validated spec, under the name it is defined with, if any. */
function readSpec(spec: Readonly<MotionSpec>, name: string | undefined, development: boolean): MotionReading {
  const key = contentKeyOf(spec);
  const listed = framesOf(spec.keyframes);
  const reduced = reducedOf(spec);
  const reading: MotionReading = {
    ...(name !== undefined && { name }),
    key,
    frames: isVerbless(spec) ? listed : withoutSkippedFields(listed, key, development),
    ...(spec.timing !== undefined && { timing: spec.timing }),
    delay: isVerbless(spec) ? (spec.delay ?? 0) : 0,
    ...(reduced !== undefined && { reduced }),
  };
  return Object.freeze(reading);
}

/** Whether a source is a definition, as `defineMotion` returns it. */
function isMotionRef(source: MotionRef | Readonly<MotionSpec>): source is MotionRef {
  return 'name' in source && 'spec' in source;
}

/**
 * Read a motion for the new model: a defined name (undefined while no motion of that name is defined), a definition, or a
 * spec of either shape. An inline spec is validated and frozen in development, and kept nowhere. A spec with a verb gives
 * its keyframes, its timing and its reduced form only; its `draw` and `along` fields are skipped.
 * @param source - The motion to read.
 * @param development - Whether to report the skipped fields.
 * @returns The reading, or undefined for a name that is not defined yet.
 */
export function readMotion(source: MotionSource, development: boolean = __MOTION_CHECKS__): MotionReading | undefined {
  if (typeof source === 'string') {
    const ref = resolveMotion(source);
    return ref && readSpec(ref.spec, ref.name, development);
  }
  if (isMotionRef(source)) return readSpec(source.spec, source.name, development);
  checkSpec(source);
  return readSpec(canonicalOf(source), undefined, development);
}
