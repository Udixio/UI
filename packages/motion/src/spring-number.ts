import type { SpringRef } from './motion-spec.js';
import { motionDisabledIn } from './motion-style.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { stepSpring, type SpringState } from './spring-step.js';
import { springParams, type MotionScheme } from './tokens.js';

/** The options of `createSpring`: the spring that moves the number, and the callbacks that receive its values. */
export interface SpringNumberOptions {
  /** The spring that moves the number; `spring.default.spatial` by default. */
  timing?: SpringRef;
  /** Receives the value once per frame while the number moves, and the value it jumps to. */
  onUpdate(value: number): void;
  /** Receives the target once the number is at rest on it. */
  onRest?(value: number): void;
}

/** A number that follows its targets over a spring: its value and velocity, and how to move it. */
export interface SpringNumber {
  /** The current value. */
  readonly value: number;
  /** The current velocity, in units per second. */
  readonly velocity: number;
  /**
   * Moves the number towards `target` from where it is, keeping its velocity; under reduced motion, or `--udx-motion: none`
   * on the document, the number reaches `target` at once.
   */
  to(target: number): void;
  /** Sets the number to `value`, at rest, at once. */
  jump(value: number): void;
  /** Stops the number where it is, at rest: no callback runs after it. */
  stop(): void;
}

/** The longest frame step integrated, in seconds, and the step of the first frame: as the gestures and the scroll integrate. */
const MAX_FRAME = 1 / 30;
const FIRST_FRAME = 1 / 60;
/** The number is at rest within this distance of its target, in units, and moves slower than this, in units per second. */
const REST_POSITION = 0.01;
const REST_VELOCITY = 0.01;

const schemeOf = (root: HTMLElement | undefined): MotionScheme =>
  root?.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';

/** A number that follows its target over a spring, for values that drive layout or script. */
export function createSpring(initial: number, options: SpringNumberOptions): SpringNumber {
  if (!Number.isFinite(initial)) throw new RangeError('Invalid initial value');
  const root = typeof document === 'undefined' ? undefined : document.documentElement;
  const runtime = getMotionRuntime();
  const params = springParams(options.timing ?? 'spring.default.spatial', schemeOf(root));
  const state: SpringState = { x: initial, v: 0 };
  let target = initial;
  let frameAt: number | undefined;
  let unsubscribe: (() => void) | undefined;
  let stopPolicy: (() => void) | undefined;
  let releaseRuntime: (() => void) | undefined;

  /** Stops the frames, the policy watch and the lease on the runtime. */
  function halt(): void {
    unsubscribe?.();
    unsubscribe = undefined;
    stopPolicy?.();
    stopPolicy = undefined;
    releaseRuntime?.();
    releaseRuntime = undefined;
    frameAt = undefined;
  }

  /** At rest on the target: the value is the target exactly, and the rest is reported. */
  function arrive(): void {
    halt();
    state.x = target;
    state.v = 0;
    options.onUpdate(target);
    options.onRest?.(target);
  }

  /** A frame of the move: the spring integrates the time since the last frame, and arrives once it is at rest. */
  function frame(now: number): void {
    const dt = frameAt === undefined ? FIRST_FRAME : Math.min(Math.max(now - frameAt, 0) / 1000, MAX_FRAME);
    frameAt = now;
    if (dt > 0) stepSpring(state, target, dt, params);
    if (Math.abs(state.x - target) < REST_POSITION && Math.abs(state.v) < REST_VELOCITY) arrive();
    else options.onUpdate(state.x);
  }

  function reduced(): boolean {
    return runtime.policy.reduced || (root !== undefined && motionDisabledIn(getComputedStyle(root)));
  }

  /** Subscribes to the frames while the number moves: the runtime is held for that time only. */
  function start(): void {
    if (unsubscribe) return;
    releaseRuntime = retainMotionRuntime(runtime);
    stopPolicy = runtime.policy.subscribe(() => {
      if (runtime.policy.reduced) arrive();
    });
    frameAt = undefined;
    try {
      unsubscribe = runtime.subscribe('spring-number', { tick: frame }, { pauseWhenReduced: false });
    } catch (error) {
      halt();
      throw error;
    }
  }

  return {
    get value() {
      return state.x;
    },
    get velocity() {
      return state.v;
    },
    to(next: number): void {
      if (!Number.isFinite(next)) throw new RangeError('Invalid target');
      target = next;
      if (reduced()) {
        if (unsubscribe || state.x !== next) arrive();
        return;
      }
      if (!unsubscribe && state.x === next) return;
      start();
    },
    jump(value: number): void {
      if (!Number.isFinite(value)) throw new RangeError('Invalid value');
      target = value;
      arrive();
    },
    stop(): void {
      halt();
      state.v = 0;
      target = state.x;
    },
  };
}
