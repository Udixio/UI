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
import { motionManifest, NAME_PATTERN } from './manifest.js';
import { pinOutOfFlow } from './pin.js';
import { applyFrame, motionDisabled, motionScale, playMotion, releaseFrame } from './play.js';
import { waapiProvider } from './providers/waapi.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { startScrub } from './scroll.js';
import { staggered } from './stagger.js';
import { resolveCurve } from './tokens.js';
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
type BindOptions = { present?: boolean; settled?: boolean; development?: boolean; shared?: string };
/** A spec with keyframes: a layout is bound by `createLayoutBinding` instead. */
type KeyframedSpec = Exclude<MotionSpec, { verb: 'layout' }>;

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
export function motion(target: HTMLElement, source: MotionSource, options: BindOptions = {}): MotionBinding {
  const spec = specOf(source);
  getMotion(target, kindOf(spec.verb))?.destroy();
  const binding =
    spec.verb === 'layout'
      ? createLayoutBinding(target, spec, options)
      : spec.verb === 'reveal'
        ? createRevealBinding(target, spec, options)
        : spec.verb === 'scrub'
          ? createScrubBinding(target, spec, options)
          : spec.verb === 'loop'
            ? createLoopBinding(target, spec, options)
            : createBinding(target, spec, options);
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
 * Its shared identity is the option `shared`, else the one of its definition; an element with none holds no identity.
 */
function createLayoutBinding(target: HTMLElement, spec: Readonly<MotionSpec>, options: BindOptions): MotionBinding {
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

/**
 * A reveal: out of view, the element waits in its first frame; when it enters the view, it plays forward from there.
 * Content in view when it is bound is left in its natural state. `repeat: 'always'` hides it again when it leaves
 * the view; by default it is revealed once, and the view is no longer watched after that.
 */
function createRevealBinding(target: HTMLElement, spec: Readonly<Extract<MotionSpec, { verb: 'reveal' }>>, options: BindOptions): MotionBinding {
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
    applyFrame(target, first);
    revealed = false;
  }

  function markRevealed() {
    revealed = true;
    if (once) stopWatching();
  }

  /** Play forward from the first frame, in the cascade of the definition when it staggers. */
  function start(): MotionHandle {
    const play = (delay: number) => playMotion(target, spec, { direction: 'forward', carry: false, runtime, development, delay });
    const next = spec.stagger === undefined ? play(0) : staggered(target, spec, { stagger: spec.stagger, origin: spec.origin, reduced: runtime.policy.reduced, phase: 'enter' }, play);
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
      else applyFrame(target, first);
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
    if (handle && runtime.policy.reduced) handle.seek(handle.duration);
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
      releaseFrame(target, fields);
      unregister(target, binding);
      releaseRuntime();
    },
  };
  return binding;
}

/**
 * A scrub: the keyframes follow the scroll position of the element through its range, forwards and backwards. The
 * scroll drives the animation, which has no timing and no handle: there is nothing to replay or to pause. Under reduced
 * motion, or where the browser has no view timeline, the element stays in its stylesheet state.
 */
function createScrubBinding(target: HTMLElement, spec: Readonly<Extract<MotionSpec, { verb: 'scrub' }>>, options: BindOptions): MotionBinding {
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const axis = spec.axis ?? 'block';
  const range = spec.range ?? 'cross';
  let animation: Animation | null = null;
  let destroyed = false;

  function start() {
    animation = runtime.policy.reduced ? null : startScrub(target, spec.keyframes, { axis, range, development });
  }

  function stop() {
    animation?.cancel();
    animation = null;
  }

  start();
  // Turning reduced motion on stops the scroll link; turning it off resumes it at the current scroll position.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (runtime.policy.reduced) stop();
    else if (!animation) start();
  });

  const binding: MotionBinding = {
    verb: 'scrub',
    kind: 'view',
    handle: null,
    present: true,
    play() {
      return settledHandle();
    },
    pause() {
      throw new TypeError('pause applies to a loop motion');
    },
    setPresent() {
      throw new TypeError('setPresent does not apply to a scrub motion');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPolicy();
      // Nothing was written inline: cancelling the animation gives the element back its stylesheet state.
      stop();
      unregister(target, binding);
      releaseRuntime();
    },
  };
  return binding;
}

/**
 * A loop: the element plays its keyframes forever from the moment it is bound. It pauses while it is out of view and
 * while the author pauses it (WCAG 2.2.2), and plays again when neither holds. Under reduced motion, or with no motion
 * (`--udx-motion: none`, a motion scale of 0), it does not play: the element stays in its stylesheet state.
 */
function createLoopBinding(target: HTMLElement, spec: Readonly<Extract<MotionSpec, { verb: 'loop' }>>, options: BindOptions): MotionBinding {
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const { duration, easing } = resolveCurve(spec.timing ?? motionManifest.defaults.loop.curve);
  let animation: MotionHandle | null = null;
  let authorPaused = false;
  let inView = true;
  let destroyed = false;

  /** Pause the animation while the author or the view holds it; play it otherwise. */
  function apply() {
    if (authorPaused || !inView) animation?.pause();
    else animation?.play();
  }

  function start() {
    if (runtime.policy.reduced || motionDisabled(target)) return;
    const scale = motionScale(target);
    if (scale === 0) return;
    try {
      animation = waapiProvider.animate({ target, keyframes: spec.keyframes, timing: { duration: duration * scale, easing, iterations: Infinity } });
    } catch (error) {
      // A loop that cannot animate leaves the element as it is: a scan never throws because of a motion.
      if (development) console.error('[@udixio/motion] a loop could not animate:', error);
      return;
    }
    apply();
  }

  function stop() {
    animation?.cancel();
    animation = null;
  }

  const stopView = watchView(target, 'block', visible => {
    if (destroyed) return;
    inView = visible;
    apply();
  });
  start();
  // Turning reduced motion on stops the loop; turning it off starts it again, paused if the author has paused it.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (runtime.policy.reduced) stop();
    else if (!animation) start();
  });

  const binding: MotionBinding = {
    verb: 'loop',
    kind: 'loop',
    get handle() {
      return animation;
    },
    present: true,
    play() {
      if (destroyed) return settledHandle();
      authorPaused = false;
      if (!animation) start();
      apply();
      return animation ?? settledHandle();
    },
    pause() {
      authorPaused = true;
      apply();
    },
    setPresent() {
      throw new TypeError('setPresent does not apply to a loop motion');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPolicy();
      stopView();
      // Nothing was written inline: cancelling the animation gives the element back its stylesheet state.
      stop();
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

  function pause(): void {
    throw new TypeError('pause applies to a loop motion');
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
    pause,
    setPresent,
    destroy,
  };
  return binding;
}
