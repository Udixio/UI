import { settledHandle } from './compose.js';
import type { MotionHandle, VisualFrame } from './contract.js';
import {
  definedMotions,
  onMotionDefined,
  resolveMotion,
  validateMotionSpec,
  type MotionRef,
  type MotionSpec,
} from './define-motion.js';
import { applyFrame, playMotion, releaseFrame } from './play.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';

/** A definition reference, a raw spec (validated here), or the name of a defined motion. */
export type MotionSource = MotionRef | Readonly<MotionSpec> | string;

export interface MotionBinding {
  readonly handle: MotionHandle | null;
  readonly present: boolean;
  readonly verb: MotionSpec['verb'];
  play(): MotionHandle;
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
  destroy(): void;
}

type Outcome = 'finished' | 'cancelled';
type BindOptions = { present?: boolean; settled?: boolean; development?: boolean };

const bindings = new WeakMap<Element, MotionBinding>();

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

/** The binding attached to an element, if any. */
export function getMotion(target: Element): MotionBinding | undefined {
  return bindings.get(target);
}

/**
 * Bind a motion to an element. The binding owns its presence (`data-presence`, `inert`),
 * its replays and its cleanup. A second binding on the same element destroys the first.
 */
export function motion(target: HTMLElement, source: MotionSource, options: BindOptions = {}): MotionBinding {
  const spec = specOf(source);
  getMotion(target)?.destroy();
  const binding = createBinding(target, spec, options);
  bindings.set(target, binding);
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

function createBinding(target: HTMLElement, spec: Readonly<MotionSpec>, options: BindOptions): MotionBinding {
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

  function markExiting() {
    present = false;
    target.setAttribute('data-presence', 'exiting');
    if (target.hasAttribute('inert')) return;
    target.setAttribute('inert', '');
    ownsInert = true;
  }

  function enter(carry: boolean): Promise<Outcome> {
    present = true;
    releaseInert();
    target.setAttribute('data-presence', 'entering');
    return track(replace(playMotion(target, spec, { direction: 'forward', carry, runtime, development })), true);
  }

  /** A disappear enters at once; the running exit is cancelled before the inline write. */
  function enterAtOnce(): Promise<Outcome> {
    present = true;
    releaseInert();
    const done = track(replace(settledHandle()), false);
    applyFrame(target, entered);
    target.setAttribute('data-presence', 'present');
    return done;
  }

  function exit(): Promise<Outcome> {
    markExiting();
    const direction = verb === 'disappear' ? 'forward' : 'backward';
    return track(replace(playMotion(target, spec, { direction, carry: true, runtime, development })), false);
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
    releaseFrame(target, writtenFields);
    target.removeAttribute('data-presence');
    releaseInert();
    if (bindings.get(target) === binding) bindings.delete(target);
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
    play,
    setPresent,
    destroy,
  };
  return binding;
}
