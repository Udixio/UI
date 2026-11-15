import { settledHandle } from './compose.js';
import type { MotionHandle, VisualFrame } from './contract.js';
import {
  definedMotions,
  kindOf,
  onMotionDefined,
  resolveMotion,
  validateMotionSpec,
  type MotionKind,
  type MotionRef,
  type MotionSpec,
} from './define-motion.js';
import type { LayoutTracking } from './layout.js';
import { flushLayoutAround, layoutEngine, loadLayoutEngine } from './layout-loader.js';
import { pinOutOfFlow } from './pin.js';
import { applyFrame, playMotion, releaseFrame } from './play.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { staggered } from './stagger.js';

/** A definition reference, a raw spec (validated here), or the name of a defined motion. */
export type MotionSource = MotionRef | Readonly<MotionSpec> | string;

export interface MotionBinding {
  readonly handle: MotionHandle | null;
  readonly present: boolean;
  readonly verb: MotionSpec['verb'];
  readonly kind: MotionKind;
  play(): MotionHandle;
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
  destroy(): void;
}

type Outcome = 'finished' | 'cancelled';
type BindOptions = { present?: boolean; settled?: boolean; development?: boolean };
/** A spec with keyframes: a layout is bound by `createLayoutBinding` instead. */
type KeyframedSpec = Exclude<MotionSpec, { verb: 'layout' }>;

/** The kinds in the order `getMotion` and `getMotions` read them. */
const KINDS: readonly MotionKind[] = ['presence', 'emphasis', 'layout'];

/** The binding of each kind on an element: at most one per kind. */
const bindings = new WeakMap<Element, Map<MotionKind, MotionBinding>>();

function isRef(source: MotionRef | Readonly<MotionSpec>): source is MotionRef {
  return 'name' in source && 'spec' in source;
}

function specOf(source: MotionSource): Readonly<MotionSpec> {
  if (typeof source === 'string') {
    const ref = resolveMotion(source);
    if (!ref) throw new Error(`Unknown motion "${source}"`);
    return ref.spec;
  }
  return isRef(source) ? source.spec : validateMotionSpec(source);
}

/** The binding of a kind on an element; without a kind, the first of presence, emphasis, layout. */
export function getMotion(target: Element, kind?: MotionKind): MotionBinding | undefined {
  const kinds = bindings.get(target);
  if (!kinds) return undefined;
  if (kind !== undefined) return kinds.get(kind);
  return KINDS.map(each => kinds.get(each)).find(binding => binding !== undefined);
}

/** The bindings of an element, in the order presence, emphasis, layout. */
export function getMotions(target: Element): MotionBinding[] {
  const kinds = bindings.get(target);
  return kinds ? KINDS.flatMap(kind => kinds.get(kind) ?? []) : [];
}

function register(target: Element, binding: MotionBinding): void {
  let kinds = bindings.get(target);
  if (!kinds) bindings.set(target, (kinds = new Map()));
  kinds.set(binding.kind, binding);
}

/** Forget a binding, if it is still the one registered for its kind. */
function unregister(target: Element, binding: MotionBinding): void {
  const kinds = bindings.get(target);
  if (kinds?.get(binding.kind) !== binding) return;
  kinds.delete(binding.kind);
  if (kinds.size === 0) bindings.delete(target);
}

/**
 * Bind a motion to an element. The binding owns its presence (`data-presence`, `inert`),
 * its replays and its cleanup. A motion of a kind the element already holds destroys that
 * binding; the bindings of the other kinds are kept.
 */
export function motion(target: HTMLElement, source: MotionSource, options: BindOptions = {}): MotionBinding {
  const spec = specOf(source);
  getMotion(target, kindOf(spec.verb))?.destroy();
  const binding = spec.verb === 'layout' ? createLayoutBinding(target, spec, options) : createBinding(target, spec, options);
  register(target, binding);
  return binding;
}

/** A motion that is bound, or waits for its name to be defined. */
export interface DeferredMotion {
  /** The binding, once the motion is defined. */
  readonly binding: MotionBinding | undefined;
  destroy(): void;
}

/**
 * Bind a motion now when its source is known, or as soon as the named motion is defined. Until then the
 * element is not touched, so a render that runs before the definition never throws.
 */
export function motionWhenDefined(target: HTMLElement, source: MotionSource, options: BindOptions = {}): DeferredMotion {
  let binding: MotionBinding | undefined;
  let unsubscribe: (() => void) | undefined;
  if (typeof source === 'string' && !resolveMotion(source)) {
    const name = source;
    if (options.development) console.error(`[@udixio/motion] Unknown motion "${name}". Defined: ${definedMotions().join(', ')}`);
    unsubscribe = onMotionDefined(ref => {
      if (ref.name !== name) return;
      unsubscribe?.();
      unsubscribe = undefined;
      binding = motion(target, ref, { ...options, settled: true });
    });
  } else {
    binding = motion(target, source, options);
  }
  return {
    get binding() {
      return binding;
    },
    destroy() {
      unsubscribe?.();
      unsubscribe = undefined;
      binding?.destroy();
    },
  };
}

/**
 * A layout follows its element: it writes no presence attribute and never enters or leaves. The layout engine is
 * loaded on first use: until it is, the element is not followed, and it starts following from its place once loaded.
 */
function createLayoutBinding(target: HTMLElement, spec: Readonly<MotionSpec>, options: BindOptions): MotionBinding {
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const trackOptions = { runtime, development: options.development ?? false };
  let destroyed = false;
  const engine = layoutEngine();
  let tracking: LayoutTracking | undefined = engine?.trackLayout(target, spec, trackOptions);
  if (!engine) {
    void loadLayoutEngine().then(() => {
      if (!destroyed) tracking = layoutEngine()?.trackLayout(target, spec, trackOptions);
    });
  }
  // Under reduced motion, a move in flight stops where the layout puts the element.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (runtime.policy.reduced) tracking?.handle?.cancel();
  });
  const binding: MotionBinding = {
    verb: 'layout',
    kind: 'layout',
    get handle() {
      return tracking?.handle ?? null;
    },
    get present() {
      return true;
    },
    play() {
      tracking?.flush();
      return tracking?.handle ?? settledHandle();
    },
    setPresent() {
      throw new TypeError('setPresent does not apply to a layout motion');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPolicy();
      tracking?.destroy();
      unregister(target, binding);
      releaseRuntime();
    },
  };
  return binding;
}

function createBinding(target: HTMLElement, spec: Readonly<KeyframedSpec>, options: BindOptions): MotionBinding {
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const verb = spec.verb;
  const first = spec.keyframes[0];
  const last = spec.keyframes[spec.keyframes.length - 1];
  // An appear enters through its keyframes and leaves backward; a disappear is the reverse.
  const entered = verb === 'disappear' ? first : last;
  const exited = verb === 'disappear' ? last : first;
  // Every field the spec animates, plus opacity for a presence verb whose reduced render is a fade.
  const writtenFields = new Set<keyof VisualFrame>(spec.keyframes.flatMap(frame => Object.keys(frame) as (keyof VisualFrame)[]));
  if (verb === 'appear' || verb === 'disappear') writtenFields.add('opacity');

  let present = verb === 'emphasize' || options.present !== false;
  let handle: MotionHandle | null = null;
  let outcome: Promise<Outcome> = Promise.resolve('finished');
  let ownsInert = false;
  // Set while an out-of-flow exit takes the element out of the flow: calling it puts the element back.
  let unpin: (() => void) | undefined;
  let destroyed = false;

  /** Make `next` the current motion. Call it after `playMotion`, so the old handle stops once the new one runs. */
  function replace(next: MotionHandle): MotionHandle {
    const previous = handle;
    handle = next;
    previous?.cancel();
    return next;
  }

  /** Record the presence outcome. A finished entry marks the element present only while it is current. */
  function track(next: MotionHandle, arriving: boolean): Promise<Outcome> {
    outcome = next.finished.then(result => {
      if (arriving && result === 'finished' && handle === next) target.setAttribute('data-presence', 'present');
      return result;
    });
    return outcome;
  }

  function releaseInert() {
    if (!ownsInert) return;
    target.removeAttribute('inert');
    ownsInert = false;
  }

  /** Put the element back into the flow, if an out-of-flow exit took it out: its neighbours make room again. */
  function returnToFlow() {
    if (!unpin) return;
    unpin();
    unpin = undefined;
    flushLayoutAround(target);
  }

  function markExiting() {
    present = false;
    target.setAttribute('data-presence', 'exiting');
    if (target.hasAttribute('inert')) return;
    target.setAttribute('inert', '');
    ownsInert = true;
  }

  /** Play the presence motion: at once, or in the cascade of its definition when it staggers. */
  function playPresence(phase: 'enter' | 'exit', direction: 'forward' | 'backward', carry: boolean): MotionHandle {
    if (spec.stagger === undefined) return playMotion(target, spec, { direction, carry, runtime, development });
    return staggered(target, spec, { stagger: spec.stagger, origin: spec.origin, reduced: runtime.policy.reduced, phase }, delay =>
      playMotion(target, spec, { direction, carry, runtime, development, delay }),
    );
  }

  function enter(carry: boolean): Promise<Outcome> {
    present = true;
    releaseInert();
    returnToFlow();
    target.setAttribute('data-presence', 'entering');
    return track(replace(playPresence('enter', 'forward', carry)), true);
  }

  /** A disappear enters at once; the running exit is cancelled before the inline write. */
  function enterAtOnce(): Promise<Outcome> {
    present = true;
    releaseInert();
    returnToFlow();
    const done = track(replace(settledHandle()), false);
    applyFrame(target, entered);
    target.setAttribute('data-presence', 'present');
    return done;
  }

  function exit(): Promise<Outcome> {
    markExiting();
    // An out-of-flow exit takes the element out of the flow now, so that its neighbours close the gap as it fades.
    if (spec.exit === 'out-of-flow' && !runtime.policy.reduced && unpin === undefined) {
      unpin = pinOutOfFlow(target);
      flushLayoutAround(target);
    }
    const direction = verb === 'disappear' ? 'forward' : 'backward';
    return track(replace(playPresence('exit', direction, true)), false);
  }

  function setPresent(next: boolean): Promise<Outcome> {
    if (verb === 'emphasize') throw new TypeError('setPresent does not apply to an emphasis; use play()');
    if (next === present) return outcome;
    if (!next) return exit();
    return verb === 'disappear' ? enterAtOnce() : enter(true);
  }

  function play(): MotionHandle {
    if (verb !== 'emphasize') throw new TypeError('play() applies to an emphasis; use setPresent() for presence');
    return replace(playMotion(target, spec, { direction: 'forward', carry: spec.interrupt === 'carry', runtime, development }));
  }

  // Under reduced motion, the running animation jumps to its end.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (handle && runtime.policy.reduced) handle.seek(handle.duration);
  });

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopPolicy();
    handle?.cancel();
    handle = null;
    const pinned = unpin !== undefined;
    unpin?.();
    unpin = undefined;
    releaseFrame(target, writtenFields);
    target.removeAttribute('data-presence');
    releaseInert();
    unregister(target, binding);
    // A pinned element that stays in the page is back in the flow: its neighbours make room again.
    if (pinned && target.isConnected) flushLayoutAround(target);
    releaseRuntime();
  }

  // Initial state. An emphasis waits for play(). `settled` only skips the entry of a present element:
  // an absent element always takes its exited frame, so it is never visible.
  if (verb !== 'emphasize') {
    if (!present) {
      applyFrame(target, exited);
      markExiting();
    } else if (options.settled) {
      target.setAttribute('data-presence', 'present');
    } else if (verb === 'disappear') {
      enterAtOnce();
    } else {
      enter(false);
    }
  }

  const binding: MotionBinding = {
    get handle() {
      return handle;
    },
    get present() {
      return present;
    },
    verb,
    kind: kindOf(verb),
    play,
    setPresent,
    destroy,
  };
  return binding;
}
