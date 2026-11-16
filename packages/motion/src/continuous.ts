/**
 * The continuous motions: the scrub, which follows the scroll position, and the loop, which plays forever. The main entry
 * loads this module the first time one of them is bound (see `createContinuousBinding`), so a page with neither never
 * downloads it.
 */
import type { MotionElement, MotionHandle, VisualFrame } from './contract.js';
import type { BindOptions, MotionBinding } from './bind.js';
import { settledHandle } from './compose.js';
import type { MotionSpec } from './define-motion.js';
import { motionManifest } from './manifest.js';
import { amplitudeOf } from './amplitude.js';
import { motionDisabled, motionScale } from './play.js';
import { playedSpec } from './named-motion.js';
import { waapiProvider } from './providers/waapi.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { startScrub } from './scroll.js';
import { releaseDraw, shapeFrames } from './svg-fields.js';
import { resolveCurve } from './tokens.js';
import { watchView } from './viewport.js';

/** Whether a spec draws a shape at some point of its keyframes: its binding restores the shape's pathLength when it ends. */
const drawsShape = (spec: { keyframes: readonly VisualFrame[] }): boolean => spec.keyframes.some(frame => frame.draw !== undefined);

/**
 * A scrub: the keyframes follow the scroll position of the element through its range, forwards and backwards. The
 * scroll drives the animation, which has no timing and no handle: there is nothing to replay or to pause. Under reduced
 * motion, or where the browser has no view timeline, the element stays in its stylesheet state.
 */
export function createScrubBinding(target: MotionElement, spec: Readonly<Extract<MotionSpec, { verb: 'scrub' }>>, options: BindOptions): MotionBinding {
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
      if (drawsShape(spec)) releaseDraw(target, 'view');
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
export function createLoopBinding(target: MotionElement, spec: Readonly<Extract<MotionSpec, { verb: 'loop' }>>, options: BindOptions): MotionBinding {
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  let animation: MotionHandle | null = null;
  // The definition the running animation plays: `--udx-motion` is read when the loop starts or resumes.
  let running: Readonly<Extract<MotionSpec, { verb: 'loop' }>> | undefined;
  let authorPaused = options.paused ?? false;
  let inView = true;
  let destroyed = false;
  let drawn = drawsShape(spec);

  /** Pause the animation while the author or the view holds it; play it otherwise. */
  function apply() {
    if (authorPaused || !inView) animation?.pause();
    else animation?.play();
  }

  function start(active: Readonly<Extract<MotionSpec, { verb: 'loop' }>> = playedSpec(target, spec, development)) {
    if (runtime.policy.reduced || motionDisabled(target)) return;
    const scale = motionScale(target);
    if (scale === 0) return;
    const { duration, easing } = resolveCurve(active.timing ?? motionManifest.defaults.loop.curve);
    try {
      animation = waapiProvider.animate({ target, keyframes: shapeFrames(active.keyframes, target, 'loop').map(frame => amplitudeOf(frame, scale)), timing: { duration: duration * scale, easing, iterations: Infinity } });
    } catch (error) {
      // A loop that cannot animate leaves the element as it is: a scan never throws because of a motion.
      if (development) console.error('[@udixio/motion] a loop could not animate:', error);
      return;
    }
    running = active;
    drawn ||= drawsShape(active);
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
      const active = playedSpec(target, spec, development);
      // Resuming a loop whose named definition has changed plays the new one from its start.
      if (!animation || active !== running) {
        stop();
        start(active);
      }
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
      if (drawn) releaseDraw(target, 'loop');
      releaseRuntime();
    },
  };
  return binding;
}
