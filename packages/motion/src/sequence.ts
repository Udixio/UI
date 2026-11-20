import { composeHandles, settledHandle } from './compose.js';
import type { MotionHandle, VisualFrame } from './contract.js';
import { assertName, kindOf, validateMotionSpec, type MotionSpec } from './define-motion.js';
import { provideSequences } from './feature-loader.js';
import { motionManifest, NAME_PATTERN, validateMotionDocument, type MotionValidationCode } from './manifest.js';
import type { ReducedRender, SpringRef } from './motion-spec.js';
import { paintFrame, playMotion, releaseOwned } from './play.js';
import { resolveSequence, sequenceDefinitions, sequenceListeners } from './registries.js';
import { getMotionRuntime, retainMotionRuntime, type MotionRuntime } from './runtime.js';
import { staggerCap, staggerDelay, staggerStep, visualRanks, type StaggerOptions } from './stagger.js';
import type { CurveTiming } from './tokens.js';
import { watchView } from './viewport.js';

export { onSequenceDefined, resolveSequence } from './registries.js';

/** One group of elements of a sequence: the children of the root that carry its `data-motion-step`. */
export interface SequenceStep {
  /** Non-empty, as for an appear motion. */
  keyframes: VisualFrame[];
  timing?: SpringRef | CurveTiming;
  reduced?: ReducedRender;
  /** The cascade of the step's elements, in visual order. */
  stagger?: StaggerOptions['stagger'];
  origin?: StaggerOptions['origin'];
  /**
   * The name of an EARLIER step, which this step starts with; or `+=tight`, `+=normal` or `+=loose`: that token's delay
   * after the previous step starts. Without `at`, the step starts when everything before it has ended.
   */
  at?: string;
}

/** A choreography: `appear` (default) plays when bound while inserted, or on play(); `reveal` when the root enters the view. */
export interface SequenceSpec {
  verb?: 'appear' | 'reveal';
  steps: Record<string, SequenceStep>;
}

/** Named, validated sequence definition. */
export interface SequenceRef<N extends string = string> {
  readonly name: N;
  readonly spec: Readonly<SequenceSpec>;
}

/** A sequence bound to a root: one handle for the whole choreography. */
export interface SequenceBinding {
  /** The handle of the latest play, or null before the first one. */
  readonly handle: MotionHandle | null;
  /** Replay from the start: what runs is cancelled first. */
  play(): MotionHandle;
  destroy(): void;
}

type Token = NonNullable<SequenceStep['stagger']>;

const TOKENS: readonly Token[] = ['tight', 'normal', 'loose'];
const VERBS: readonly string[] = ['appear', 'reveal'];
const STEP_FIELDS = ['keyframes', 'timing', 'reduced', 'stagger', 'origin', 'at'] as const;
/** The sequence bound to each root. */
const bindings = new WeakMap<Element, SequenceBinding>();

/** The stagger token of an `at` such as `+=normal`, or undefined. */
function tokenOf(at: string): Token | undefined {
  if (!at.startsWith('+=')) return undefined;
  const token = at.slice(2);
  return TOKENS.find(each => each === token);
}

type Issue = { path: string; code: MotionValidationCode };

/** The issues of a sequence spec, step by step, in development; an empty list when it is valid. */
function issuesOf(spec: unknown): Issue[] {
  if (typeof spec !== 'object' || spec === null || Array.isArray(spec)) return [{ path: '', code: 'type' }];
  const record = spec as Record<string, unknown>;
  const issues: Issue[] = [];
  for (const key of Object.keys(record)) if (key !== 'verb' && key !== 'steps') issues.push({ path: `/${key}`, code: 'unknown_field' });
  if (record.verb !== undefined && !(typeof record.verb === 'string' && VERBS.includes(record.verb)))
    issues.push({ path: '/verb', code: typeof record.verb === 'string' ? 'invalid_value' : 'type' });
  const steps = record.steps;
  if (typeof steps !== 'object' || steps === null || Array.isArray(steps)) return [...issues, { path: '/steps', code: 'type' }];
  const names = Object.keys(steps);
  if (names.length === 0) issues.push({ path: '/steps', code: 'empty' });
  names.forEach((name, index) => {
    const base = `/steps/${name}`;
    if (!NAME_PATTERN.test(name)) issues.push({ path: base, code: 'invalid_value' });
    const step = (steps as Record<string, unknown>)[name];
    if (typeof step !== 'object' || step === null || Array.isArray(step)) {
      issues.push({ path: base, code: 'type' });
      return;
    }
    const fields = Object.fromEntries(Object.entries(step).filter(([key, value]) => value !== undefined && key !== 'at'));
    if ('verb' in fields) issues.push({ path: `${base}/verb`, code: 'unknown_field' });
    // The step is an appear motion: its verb is not written by the author, and its `at` belongs to the sequence.
    const result = validateMotionDocument({ version: motionManifest.version, spec: { ...fields, verb: 'appear' } });
    if (!result.valid) for (const error of result.errors) issues.push({ path: error.path.replace(/^\/spec/, base), code: error.code });
    const at = (step as { at?: unknown }).at;
    if (at !== undefined) {
      if (typeof at !== 'string') issues.push({ path: `${base}/at`, code: 'type' });
      else if (!names.slice(0, index).includes(at) && tokenOf(at) === undefined) issues.push({ path: `${base}/at`, code: 'invalid_value' });
    }
  });
  return issues;
}

/** A step, frozen: its fields in a fixed order, its keyframes and objects frozen at every level. */
function freezeStep(step: SequenceStep): Readonly<SequenceStep> {
  const copy: Record<string, unknown> = {};
  for (const field of STEP_FIELDS) {
    const value: unknown = step[field];
    if (value === undefined) continue;
    if (field === 'keyframes') copy[field] = Object.freeze((value as VisualFrame[]).map(frame => Object.freeze({ ...frame })));
    else copy[field] = typeof value === 'object' ? Object.freeze({ ...value }) : value;
  }
  return Object.freeze(copy) as Readonly<SequenceStep>;
}

/** The canonical spec: validated in development only, as for a motion; a production build trusts the definition. */
function canonicalOf(spec: SequenceSpec): Readonly<SequenceSpec> {
  if (__MOTION_CHECKS__) {
    const issues = issuesOf(spec);
    if (issues.length > 0)
      throw new TypeError(`Invalid sequence spec: ${issues.map(({ path, code }) => `${path}: ${code}`).join('; ')}`);
  }
  const steps: Record<string, Readonly<SequenceStep>> = {};
  for (const [name, step] of Object.entries(spec.steps)) steps[name] = freezeStep(step);
  return Object.freeze({ verb: spec.verb ?? 'appear', steps: Object.freeze(steps) });
}

/**
 * Define a named sequence. Re-defining a name with an identical spec returns the existing reference; a different spec
 * throws. The spec is validated in development only.
 */
export function defineSequence<N extends string>(name: N, spec: SequenceSpec): SequenceRef<N> {
  assertName(name, 'Sequence name');
  const canonical = canonicalOf(spec);
  const registry = sequenceDefinitions();
  const existing = registry.get(name);
  if (existing) {
    if (JSON.stringify(existing.spec) === JSON.stringify(canonical)) return existing as SequenceRef<N>;
    throw new Error(`Sequence "${name}" is already defined with a different spec`);
  }
  const ref = Object.freeze({ name, spec: canonical });
  registry.set(name, ref);
  for (const listener of [...sequenceListeners()]) {
    try {
      listener(ref);
    } catch (error) {
      console.error('[@udixio/motion] A sequence listener failed:', error);
    }
  }
  return ref;
}

/** The sequence bound to a root, if any. */
export function getSequence(root: Element): SequenceBinding | undefined {
  return bindings.get(root);
}

/** The appear motion a step plays: the step without its `at`, validated and canonical. */
function motionOf(step: Readonly<SequenceStep>): Readonly<MotionSpec> {
  const fields = Object.fromEntries(Object.entries(step).filter(([key]) => key !== 'at'));
  return validateMotionSpec({ verb: 'appear', ...fields });
}

/** Whether a sequence nested between the element and the root owns the element. */
function ownedByNested(element: HTMLElement, root: HTMLElement): boolean {
  for (let ancestor = element.parentElement; ancestor && ancestor !== root; ancestor = ancestor.parentElement) {
    const names = (ancestor.getAttribute('data-motion') ?? '').split(/\s+/);
    if (names.some(name => resolveSequence(name) !== undefined)) return true;
  }
  return false;
}

/** The elements of each step, in document order: the descendants of the root that carry the step, minus those a nested sequence owns. */
function membersOf(root: HTMLElement, names: readonly string[]): Map<string, HTMLElement[]> {
  const members = new Map<string, HTMLElement[]>(names.map((name): [string, HTMLElement[]] => [name, []]));
  for (const element of root.querySelectorAll<HTMLElement>('[data-motion-step]')) {
    const list = members.get(element.getAttribute('data-motion-step') ?? '');
    if (list && !ownedByNested(element, root)) list.push(element);
  }
  return members;
}

/**
 * When a step starts: with the step it names; after the previous step starts for a token; else when everything
 * before it has ended, which is the latest end of the steps before.
 */
function startOf(step: Readonly<SequenceStep>, index: number, names: readonly string[], starts: readonly number[], ends: readonly number[], style: CSSStyleDeclaration): number {
  const previous = index - 1;
  const at = step.at;
  if (at === undefined) return Math.max(0, ...ends);
  const token = tokenOf(at);
  if (token !== undefined) return (previous >= 0 ? starts[previous] : 0) + staggerStep(style, token);
  const earlier = names.indexOf(at);
  return earlier >= 0 && earlier < index ? starts[earlier] : Math.max(0, ...ends);
}

/** The delay of each element of a cascade within its step: its visual rank times the step of the token, capped. */
function cascadeOf(elements: HTMLElement[], stagger: Token, origin: NonNullable<SequenceStep['origin']>, style: CSSStyleDeclaration): number[] {
  const ranks = visualRanks(elements.map(element => element.getBoundingClientRect()), origin);
  const interval = staggerStep(style, stagger);
  const cap = staggerCap(style);
  return ranks.map(rank => staggerDelay(rank, interval, cap));
}

/**
 * Start every element of the sequence on the timeline of its steps, and return one handle for all of them. Each
 * element is played with its own delay; a step ends when its last element ends, and a step without `at` starts when
 * everything before it has ended. Under reduced motion every delay is 0.
 */
function playTimeline(root: HTMLElement, ref: SequenceRef, runtime: MotionRuntime, development: boolean): MotionHandle {
  const steps = ref.spec.steps;
  const names = Object.keys(steps);
  const members = membersOf(root, names);
  const style = (root.ownerDocument.defaultView ?? window).getComputedStyle(root);
  const reduced = runtime.policy.reduced;
  const starts: number[] = [];
  const ends: number[] = [];
  const handles: MotionHandle[] = [];
  names.forEach((name, index) => {
    const step = steps[name];
    const start = reduced ? 0 : startOf(step, index, names, starts, ends, style);
    const elements = members.get(name) ?? [];
    const stagger = step.stagger;
    const offsets = reduced || stagger === undefined ? elements.map(() => 0) : cascadeOf(elements, stagger, step.origin ?? 'first', style);
    const motion = motionOf(step);
    let end = start;
    elements.forEach((element, position) => {
      const delay = start + offsets[position];
      const handle = playMotion(element, motion, { direction: 'forward', carry: false, runtime, development, delay });
      handles.push(handle);
      end = Math.max(end, delay + handle.duration);
    });
    starts.push(start);
    ends.push(end);
  });
  return composeHandles(handles);
}

/** Bind a sequence to a root: `appear` plays when bound unless `settled`, `reveal` when the root enters the view. */
export function sequence(root: HTMLElement, source: SequenceRef | string, options: { settled?: boolean; development?: boolean } = {}): SequenceBinding {
  const found = typeof source === 'string' ? resolveSequence(source) : source;
  if (!found) throw new Error(`Unknown sequence "${source}"`);
  const ref: SequenceRef = found;
  getSequence(root)?.destroy();
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const steps = ref.spec.steps;
  const reveal = ref.spec.verb === 'reveal';
  let current: MotionHandle | null = null;
  let destroyed = false;
  let initial = true;
  let revealed = false;
  let watching = true;
  let unwatch: (() => void) | undefined;
  // Under reduced motion, a sequence that runs jumps to its end, as a reveal or a presence motion does.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (current && runtime.policy.reduced) current.seek(current.delay + current.duration);
  });

  function stopWatching() {
    watching = false;
    unwatch?.();
    unwatch = undefined;
  }

  /** Every element waits in the first frame of its step, out of sight. */
  function holdFirstFrames() {
    const members = membersOf(root, Object.keys(steps));
    for (const [name, step] of Object.entries(steps)) for (const element of members.get(name) ?? []) paintFrame(element, step.keyframes[0], kindOf('appear'));
  }

  /** Cancel what runs, then play the whole sequence from its start. */
  function run(): MotionHandle {
    const previous = current;
    current = null;
    previous?.cancel();
    current = playTimeline(root, ref, runtime, development);
    return current;
  }

  function markRevealed() {
    revealed = true;
    stopWatching();
  }

  function onView(inView: boolean) {
    if (destroyed) return;
    if (initial) {
      initial = false;
      // Content in view stays in its natural state; content out of view waits in its first frames.
      if (inView) markRevealed();
      else holdFirstFrames();
      return;
    }
    if (inView && !revealed) {
      markRevealed();
      run();
    }
  }

  if (reveal) {
    const stop = watchView(root, 'block', onView);
    if (watching) unwatch = stop;
    else stop();
  } else if (!options.settled) {
    run();
  }

  const binding: SequenceBinding = {
    get handle() {
      return current;
    },
    play() {
      if (destroyed) return settledHandle();
      if (reveal) {
        holdFirstFrames();
        markRevealed();
      }
      return run();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPolicy();
      stopWatching();
      current?.cancel();
      current = null;
      const members = membersOf(root, Object.keys(steps));
      for (const [name, step] of Object.entries(steps)) {
        const fields = new Set<keyof VisualFrame>(step.keyframes.flatMap(frame => Object.keys(frame) as (keyof VisualFrame)[]));
        // An appear writes opacity too, for its reduced fade.
        if (!reveal) fields.add('opacity');
        for (const element of members.get(name) ?? []) releaseOwned(element, fields, kindOf('appear'));
      }
      if (bindings.get(root) === binding) bindings.delete(root);
      releaseRuntime();
    },
  };
  bindings.set(root, binding);
  return binding;
}

// Once this module has evaluated, the scanner binds sequences at once, without loading it again.
provideSequences({ sequence, getSequence });
