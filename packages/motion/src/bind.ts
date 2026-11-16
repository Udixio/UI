import { deferredHandle, settledHandle } from './compose.js';
import type { MotionElement, MotionHandle, VisualFrame } from './contract.js';
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
import { continuousModule, loadContinuous, loadText, textModule, type ContinuousApi } from './feature-loader.js';
import type { LayoutTracking } from './layout.js';
import { flushLayoutAround, layoutEngine, loadLayoutEngine } from './layout-loader.js';
import { NAME_PATTERN } from './manifest.js';
import { pinOutOfFlow } from './pin.js';
import { applyRestingFrame, paintFrame, playMotion, releaseOwned } from './play.js';
import { getMotionRuntime, retainMotionRuntime, type MotionRuntime } from './runtime.js';
import { staggered } from './stagger.js';
import { isHtmlElement } from './svg-fields.js';
import { watchView } from './viewport.js';

/** A definition reference, a raw spec (validated here), or the name of a defined motion. */
export type MotionSource = MotionRef | Readonly<MotionSpec> | string;

export interface MotionBinding {
  readonly handle: MotionHandle | null;
  readonly present: boolean;
  readonly verb: MotionSpec['verb'];
  readonly kind: MotionKind;
  play(): MotionHandle;
  /** Pause a loop, at the author's request (WCAG 2.2.2); `play()` resumes it. Refused for every other kind. */
  pause(): void;
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
  destroy(): void;
}

type Outcome = 'finished' | 'cancelled';
export type BindOptions = {
  present?: boolean;
  settled?: boolean;
  development?: boolean;
  shared?: string;
  /** A loop bound with `paused` starts paused (also when it is bound later, once its name is defined). */
  paused?: boolean;
};
/** A spec with keyframes: a layout is bound by `createLayoutBinding` instead. */
type KeyframedSpec = Exclude<MotionSpec, { verb: 'layout' }>;

/** A layout follows HTML elements only: the layout engine measures the boxes of HTML. */
const LAYOUT_ON_SVG = 'A layout motion applies to an HTML element, not to an SVG element';

/** The kinds in the order `getMotion` and `getMotions` read them. */
const KINDS: readonly MotionKind[] = ['presence', 'emphasis', 'layout', 'view', 'loop'];

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
export function motion(target: MotionElement, source: MotionSource, options: BindOptions = {}): MotionBinding {
  const spec = specOf(source);
  // Refused before the binding it would replace is destroyed.
  if (spec.verb === 'layout' && !isHtmlElement(target)) throw new TypeError(LAYOUT_ON_SVG);
  getMotion(target, kindOf(spec.verb))?.destroy();
  // A split definition needs the text module: it loads now, and a failure leaves the element to animate whole.
  if (spec.split !== undefined) void loadText().catch(() => undefined);
  const binding =
    spec.verb === 'layout'
      ? createLayoutBinding(target, spec, options)
      : spec.verb === 'reveal'
        ? createRevealBinding(target, spec, options)
        : spec.verb === 'scrub' || spec.verb === 'loop'
          ? createContinuousBinding(target, spec, options)
          : createBinding(target, spec, options);
  register(target, binding);
  return binding;
}

/** A motion that is bound, or waits for its name to be defined. */
export interface DeferredMotion {
  /** The binding, once the motion is defined. */
  readonly binding: MotionBinding | undefined;
  /**
   * Set the presence of the element: `setPresent` of the binding when it is a presence motion, else nothing. Asked before the
   * name is defined, the last value is kept and applied when the motion is defined; resolves at once in that case.
   */
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
  /** Replay the emphasis; asked before the name is defined, the replay happens once the motion is defined. */
  play(): void;
  destroy(): void;
}

/** The outcome of a presence that has nothing to wait for: already settled, and shared. */
const settled = Promise.resolve<'finished' | 'cancelled'>('finished');

/**
 * Bind a motion now when its source is known, or as soon as the named motion is defined. Until then the
 * element is not touched, so a render that runs before the definition never throws.
 */
export function motionWhenDefined(target: MotionElement, source: MotionSource, options: BindOptions = {}): DeferredMotion {
  let binding: MotionBinding | undefined;
  let unsubscribe: (() => void) | undefined;
  // The presence asked for, the options' one until it changes, and whether an emphasis replay is due.
  const initial = options.present !== false;
  let wanted = initial;
  let replay = false;
  if (typeof source === 'string' && !resolveMotion(source)) {
    const name = source;
    if (options.development) console.error(`[@udixio/motion] Unknown motion "${name}". Defined: ${definedMotions().join(', ')}`);
    unsubscribe = onMotionDefined(ref => {
      if (ref.name !== name) return;
      unsubscribe?.();
      binding = motion(target, ref, { ...options, present: wanted || initial, settled: true });
      // A presence asked to end meanwhile ends now, with its exit, as if the definition had been there.
      if (!wanted && initial && binding.kind === 'presence') void binding.setPresent(false);
      if (replay && binding.kind === 'emphasis') binding.play();
    });
  } else {
    binding = motion(target, source, options);
  }
  return {
    get binding() {
      return binding;
    },
    setPresent(present) {
      if (!binding) wanted = present;
      return binding?.kind === 'presence' ? binding.setPresent(present) : settled;
    },
    play() {
      if (!binding) replay = true;
      else if (binding.kind === 'emphasis') binding.play();
    },
    destroy() {
      unsubscribe?.();
      binding?.destroy();
    },
  };
}

/**
 * A layout follows its element: it writes no presence attribute and never enters or leaves. The layout engine is
 * loaded on first use: until it is, the element is not followed, and it starts following from its place once loaded.
 * Its shared identity is the option `shared`, else the one of its definition; an element with none holds no identity.
 */
function createLayoutBinding(target: MotionElement, spec: Readonly<MotionSpec>, options: BindOptions): MotionBinding {
  if (!isHtmlElement(target)) throw new TypeError(LAYOUT_ON_SVG);
  const shared = options.shared ?? spec.shared;
  if (shared !== undefined && !NAME_PATTERN.test(shared)) throw new TypeError(`Shared identity "${shared}" must be kebab-case`);
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const trackOptions = { runtime, development: options.development ?? false, shared };
  let destroyed = false;
  const engine = layoutEngine();
  let tracking: LayoutTracking | undefined = engine?.trackLayout(target, spec, trackOptions);
  if (!engine) {
    // A failed load leaves the element unfollowed: it stays where it is, and the page is not affected.
    void loadLayoutEngine().then(
      () => {
        if (!destroyed) tracking = layoutEngine()?.trackLayout(target, spec, trackOptions);
      },
      () => {},
    );
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
    pause() {
      throw new TypeError('pause applies to a loop motion');
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

/** A split definition on the pieces of its text when the text module is loaded, else on the element whole. */
function playLoaded(target: MotionElement, spec: Readonly<KeyframedSpec>, options: Parameters<typeof playMotion>[2]): MotionHandle {
  return textModule()?.playSplit(target, spec, options) ?? playMotion(target, spec, options);
}

/**
 * The entry of a split definition on the pieces of its text, once the text module is loaded. While the module is still
 * loading, the element holds its first frame and the entry waits for the module; if the module fails to load, the entry
 * plays the element whole.
 */
function playEntry(target: MotionElement, spec: Readonly<KeyframedSpec>, options: Parameters<typeof playMotion>[2]): MotionHandle {
  if (textModule()) return playLoaded(target, spec, options);
  const pending = deferredHandle();
  paintFrame(target, spec.keyframes[0], kindOf(spec.verb));
  // A failed load leaves the module unloaded, so the entry plays the element whole.
  void loadText().catch(() => undefined).then(() => {
    if (!pending.cancelled) pending.resolve(playLoaded(target, spec, options));
  });
  return pending.handle;
}

/**
 * Write a frame where the definition plays it: on the pieces of its text when it is split, else on the element. A resting
 * frame, a state the element stays in, releases its neutral fields to the stylesheet.
 */
function writeFrame(target: MotionElement, spec: Readonly<KeyframedSpec>, runtime: MotionRuntime, frame: VisualFrame, resting = false): void {
  const text = textModule();
  if (text) text.applySplitFrame(target, spec, runtime, frame, resting);
  else if (resting) applyRestingFrame(target, frame, kindOf(spec.verb));
  else paintFrame(target, frame, kindOf(spec.verb));
}

/**
 * A reveal: out of view, the element waits in its first frame; when it enters the view, it plays forward from there.
 * Content in view when it is bound is left in its natural state. `repeat: 'always'` hides it again when it leaves
 * the view; by default it is revealed once, and the view is no longer watched after that.
 */
function createRevealBinding(target: MotionElement, spec: Readonly<Extract<MotionSpec, { verb: 'reveal' }>>, options: BindOptions): MotionBinding {
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const first = spec.keyframes[0];
  const once = spec.repeat !== 'always';
  const fields = new Set<keyof VisualFrame>(spec.keyframes.flatMap(frame => Object.keys(frame) as (keyof VisualFrame)[]));
  let revealed = false;
  let handle: MotionHandle | null = null;
  let initial = true;
  let destroyed = false;
  let watching = true;
  let unwatch: (() => void) | undefined;

  function stopWatching() {
    watching = false;
    unwatch?.();
    unwatch = undefined;
  }

  /** Put the element back in its first frame, out of sight, and stop what plays. */
  function hide() {
    handle?.cancel();
    handle = null;
    writeFrame(target, spec, runtime, first);
    revealed = false;
  }

  function markRevealed() {
    revealed = true;
    if (once) stopWatching();
  }

  /** Play forward from the first frame, in the cascade of the definition when it staggers. */
  function start(): MotionHandle {
    const play = (delay: number) => playMotion(target, spec, { direction: 'forward', carry: false, runtime, development, delay });
    const next = spec.split !== undefined
      ? playEntry(target, spec, { direction: 'forward', carry: false, runtime, development })
      : spec.stagger === undefined ? play(0) : staggered(target, spec, { stagger: spec.stagger, origin: spec.origin, reduced: runtime.policy.reduced, phase: 'enter' }, play);
    const previous = handle;
    handle = next;
    previous?.cancel();
    return next;
  }

  function onView(inView: boolean) {
    if (destroyed) return;
    if (initial) {
      initial = false;
      // Content in view stays in its natural state; content out of view waits in its first frame.
      if (inView) markRevealed();
      else writeFrame(target, spec, runtime, first);
      return;
    }
    if (inView && !revealed) {
      markRevealed();
      start();
    } else if (!inView && revealed && !once) {
      hide();
    }
  }

  const stop = watchView(target, spec.axis ?? 'block', onView);
  if (watching) unwatch = stop;
  else stop();

  // Under reduced motion, a reveal that runs jumps to its end, as a presence motion does.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (handle && runtime.policy.reduced) handle.seek(handle.delay + handle.duration);
  });

  const binding: MotionBinding = {
    verb: 'reveal',
    kind: 'view',
    get handle() {
      return handle;
    },
    get present() {
      return revealed;
    },
    play() {
      if (destroyed) return settledHandle();
      hide();
      markRevealed();
      return start();
    },
    pause() {
      throw new TypeError('pause applies to a loop motion');
    },
    setPresent() {
      throw new TypeError('setPresent does not apply to a reveal motion');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPolicy();
      stopWatching();
      handle?.cancel();
      handle = null;
      releaseOwned(target, fields, 'view');
      textModule()?.revertSplit(target, spec);
      unregister(target, binding);
      releaseRuntime();
    },
  };
  return binding;
}

/**
 * A scrub or a loop: its code is the continuous module, loaded the first time one is bound. Until it is loaded, the element
 * keeps its stylesheet state, and a play or a pause asked meanwhile is applied once the binding exists (the last one asked
 * wins). A failed load leaves the element in its stylesheet state, and a later bind tries again.
 */
function createContinuousBinding(target: MotionElement, spec: Readonly<Extract<MotionSpec, { verb: 'scrub' | 'loop' }>>, options: BindOptions): MotionBinding {
  let inner: MotionBinding | undefined;
  let requested: 'play' | 'pause' | undefined;
  let destroyed = false;

  /** Bind the spec with the continuous module, then apply the request made before it was loaded. */
  const bindWith = (api: ContinuousApi): void => {
    inner = spec.verb === 'scrub' ? api.createScrubBinding(target, spec, options) : api.createLoopBinding(target, spec, options);
    if (requested === 'pause') inner.pause();
    else if (requested === 'play') inner.play();
  };
  const loaded = continuousModule();
  if (loaded) bindWith(loaded);
  else {
    void loadContinuous().then(
      () => {
        const api = continuousModule();
        if (api && !destroyed) bindWith(api);
      },
      () => {},
    );
  }

  const binding: MotionBinding = {
    verb: spec.verb,
    kind: kindOf(spec.verb),
    get handle() {
      return inner?.handle ?? null;
    },
    get present() {
      return true;
    },
    play() {
      if (destroyed) return settledHandle();
      requested = 'play';
      return inner?.play() ?? settledHandle();
    },
    pause() {
      if (spec.verb !== 'loop') throw new TypeError('pause applies to a loop motion');
      requested = 'pause';
      inner?.pause();
    },
    setPresent() {
      throw new TypeError(`setPresent does not apply to a ${spec.verb} motion`);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      inner?.destroy();
      unregister(target, binding);
    },
  };
  return binding;
}

function createBinding(target: MotionElement, spec: Readonly<KeyframedSpec>, options: BindOptions): MotionBinding {
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
    if (isHtmlElement(target)) flushLayoutAround(target);
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
    // An entry of a split definition waits for the text module; an exit does not, so that a removal is never delayed by a load.
    if (spec.split !== undefined) {
      const options = { direction, carry, runtime, development };
      return phase === 'enter' ? playEntry(target, spec, options) : playLoaded(target, spec, options);
    }
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
    writeFrame(target, spec, runtime, entered, true);
    target.setAttribute('data-presence', 'present');
    return done;
  }

  function exit(): Promise<Outcome> {
    markExiting();
    // An out-of-flow exit takes the element out of the flow now, so that its neighbours close the gap as it fades.
    if (spec.exit === 'out-of-flow' && isHtmlElement(target) && !runtime.policy.reduced && unpin === undefined) {
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

  function pause(): void {
    throw new TypeError('pause applies to a loop motion');
  }

  // Under reduced motion, the running animation jumps to its end.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (handle && runtime.policy.reduced) handle.seek(handle.delay + handle.duration);
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
    releaseOwned(target, writtenFields, kindOf(verb));
    textModule()?.revertSplit(target, spec);
    target.removeAttribute('data-presence');
    releaseInert();
    unregister(target, binding);
    // A pinned element that stays in the page is back in the flow: its neighbours make room again.
    if (pinned && target.isConnected && isHtmlElement(target)) flushLayoutAround(target);
    releaseRuntime();
  }

  // Initial state. An emphasis waits for play(). `settled` only skips the entry of a present element:
  // an absent element always takes its exited frame, so it is never visible.
  if (verb !== 'emphasize') {
    if (!present) {
      writeFrame(target, spec, runtime, exited);
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
    pause,
    setPresent,
    destroy,
  };
  return binding;
}
