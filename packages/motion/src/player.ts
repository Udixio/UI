import type { AxisBase } from './axis-base.js';
import { composeHandles, settledHandle } from './compose.js';
import type { MotionElement, MotionHandle } from './contract.js';
import {
  isMotionFrames,
  toWaapiKeyframes,
  type Channel,
  type MotionFrames,
} from './keyframes.js';
import type { SpringRef } from './motion-spec.js';
import { resolveWaapiTiming, type TimingPlan } from './timing-plan.js';
import type { CurveTiming, MotionScheme } from './tokens.js';

/** The animations a play created, and the handle that drives them. */
export interface PlayedAnimations {
  /** Drives every animation of the play; `cancel` removes them, finished or not. */
  readonly handle: MotionHandle;
  /** One per timing group with a channel to play; none when the play ended at once. */
  readonly animations: readonly Animation[];
}

/** How a state goes from where a property is to where it must be (the model, §3.9). */
export type StateTween = (request: {
  element: MotionElement;
  /** WAAPI keyframes: the current values, then the target; or the current values alone, for a live end. */
  keyframes: Keyframe[];
  timing: SpringRef | CurveTiming;
  scale: number;
  /** What the transition being replaced was doing, when it was a state tween: for a tween that carries velocity. */
  interrupted?: { handle: MotionHandle; timing: SpringRef | CurveTiming };
}) => MotionHandle;

let stateTweenInPlace: StateTween | undefined;

/**
 * Replaces the state tween: the function every state's transition goes through.
 * @param tween - The tween that plays a state.
 */
export function setStateTween(tween: StateTween): void {
  stateTweenInPlace = tween;
}

/**
 * The state tween in place, or undefined until the `states` entry installs one.
 * @returns The tween, if one is set.
 */
export function stateTween(): StateTween | undefined {
  return stateTweenInPlace;
}

/** The WAAPI keys of a keyframe: every key but its offset. */
function keysOf(keyframe: Keyframe): string[] {
  return Object.keys(keyframe).filter((key) => key !== 'offset');
}

/** The CSS name of a WAAPI key: kebab-case, and a custom property keeps its name. */
function cssName(key: string): string {
  return key.startsWith('--')
    ? key
    : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** Whether the element can animate, that is `Element.prototype.animate` exists (jsdom and old engines have none). */
function canAnimate(element: MotionElement): boolean {
  return typeof element.animate === 'function';
}

/** The keyframe a hold keeps: its values, without an offset, since a hold is its last keyframe. */
function heldKeyframe(keyframe: Keyframe): Keyframe {
  return Object.fromEntries(
    Object.entries(keyframe).filter(([key]) => key !== 'offset'),
  ) as Keyframe;
}

/** The values of a keyframe written inline, and the function that removes them. */
function inlineHold(
  element: MotionElement,
  keyframe: Keyframe,
): { cancel(): void } {
  const written: [property: string, value: string][] = [];
  for (const [key, value] of Object.entries(keyframe)) {
    if (value !== null && value !== undefined)
      written.push([cssName(key), String(value)]);
  }
  for (const [property, value] of written)
    element.style.setProperty(property, value);
  return {
    cancel: () => {
      for (const [property] of written) element.style.removeProperty(property);
    },
  };
}

/**
 * Holds a keyframe on an element: one zero-duration animation that fills forwards and is persisted, so that the value stays, and
 * no transition of the author replays from rest. Without `Element.prototype.animate` the values are written inline, and `cancel`
 * removes them.
 * @param element - The element to hold.
 * @param keyframe - The WAAPI keyframe to hold, as `toWaapiKeyframes` writes it.
 * @returns What cancels the hold.
 */
export function holdKeyframe(
  element: MotionElement,
  keyframe: Keyframe,
): { cancel(): void } {
  const held = heldKeyframe(keyframe);
  if (!canAnimate(element)) return inlineHold(element, held);
  const animation = element.animate([held], { duration: 0, fill: 'forwards' });
  animation.persist();
  return { cancel: () => animation.cancel() };
}

/** The handle of one WAAPI animation of a play, with the delay and the duration the plan gives it. Its `finished` never rejects. */
function handleOf(
  animation: Animation,
  delay: number,
  duration: number,
): MotionHandle {
  return {
    backend: 'waapi',
    delay,
    duration,
    get currentTime() {
      return Number(animation.currentTime);
    },
    finished: animation.finished.then(
      () => 'finished' as const,
      () => 'cancelled' as const,
    ),
    velocity: { value: 0, source: 'unavailable' },
    play: () => animation.play(),
    pause: () => animation.pause(),
    reverse: () => animation.reverse(),
    seek: (timeMs) => {
      animation.currentTime = Math.min(timeMs, delay + duration);
    },
    cancel: () => animation.cancel(),
  };
}

/**
 * The play that does not animate: its end is written at once, as a hold of its last keyframe, and its handle is finished; its
 * `cancel` removes what it wrote. A live end writes nothing, since the underlying value is the end.
 */
function settleAtOnce(
  element: MotionElement,
  frames: MotionFrames,
  channels: ReadonlySet<Channel>,
  base: AxisBase,
  liveEnd: boolean,
): PlayedAnimations {
  const last = toWaapiKeyframes([frames[frames.length - 1]], channels, base)[0];
  if (liveEnd || keysOf(last).length === 0)
    return { handle: settledHandle(), animations: [] };
  const hold = holdKeyframe(element, last);
  return {
    handle: { ...settledHandle(), cancel: () => hold.cancel() },
    animations: [],
  };
}

/** The duration and easing of every group on the WAAPI provider, or null when one of them cannot be played. */
function resolveAll(
  element: MotionElement,
  timings: readonly (SpringRef | CurveTiming)[],
  scheme: MotionScheme,
): { duration: number; easing: string }[] | null {
  const resolved: { duration: number; easing: string }[] = [];
  for (const timing of timings) {
    const route = resolveWaapiTiming(element, timing, scheme);
    if (route === null) return null;
    resolved.push(route);
  }
  return resolved;
}

/** The values the element shows now for the given keys, read before any animation of the play is created. */
function valuesNow(
  element: MotionElement,
  keys: readonly string[],
): Record<string, string> {
  const style = (element.ownerDocument.defaultView ?? window).getComputedStyle(
    element,
  );
  return Object.fromEntries(
    keys.map((key) => [key, style.getPropertyValue(cssName(key))]),
  );
}

/**
 * The keyframes one group plays: the frames as they are; with `from: 'current'` the first one holds the values shown now (a
 * single keyframe is the end, so the values become a start in front of it); with `liveEnd` one keyframe at offset 0 holds the
 * values shown now, with no end, so that the underlying value is the end at each frame.
 */
function keyframesToPlay(
  keyframes: Keyframe[],
  now: Record<string, string>,
  options: { from: 'first' | 'current'; liveEnd: boolean },
): Keyframe[] {
  const pick = (keys: readonly string[]) =>
    Object.fromEntries(keys.map((key) => [key, now[key]]));
  if (options.liveEnd)
    return [
      {
        offset: 0,
        ...pick([...new Set(keyframes.flatMap(keysOf))]),
      },
    ];
  if (options.from === 'first') return keyframes;
  const [first, ...rest] = keyframes;
  // One keyframe is the end, from the values shown now: the start is made explicit in front of it.
  if (rest.length === 0)
    return [
      { offset: 0, ...pick(keysOf(first)) },
      { ...first, offset: 1 },
    ];
  return [{ ...first, ...pick(keysOf(first)) }, ...rest];
}

/**
 * Plays a timing plan on an element: one WAAPI animation per timing group that has a channel to play, all created in the calling
 * task with `fill: 'both'`, so that the first keyframe is what is painted first, during the delay too. The duration of each group is
 * multiplied by the plan's scale; the plan has already multiplied its delay. Without WAAPI, or when a timing cannot be played, the end
 * is written at once. Nothing is cancelled here: the caller decides what the play replaces.
 * @param element - The element to play on.
 * @param frames - The keyframes of the motion, as `readKeyframes` reads them.
 * @param channels - The channels to play; a timing group animates only the channels it shares with them.
 * @param plan - The timing plan, as `planTiming` gives it.
 * @param options - The axis base of the element, where the first keyframe starts, and whether the end is live.
 * @returns The handle of the play, and the animations it created.
 */
export function playPlan(
  element: MotionElement,
  frames: MotionFrames,
  channels: ReadonlySet<Channel>,
  plan: TimingPlan,
  options: { base: AxisBase; from: 'first' | 'current'; liveEnd?: boolean },
): PlayedAnimations {
  if (__MOTION_CHECKS__ && !isMotionFrames(frames))
    throw new TypeError(
      'playPlan needs at least one keyframe, and each keyframe needs a property',
    );
  const liveEnd = options.liveEnd ?? false;
  const playable = new Set(
    [...channels].filter((channel) =>
      plan.groups.some((group) => group.channels.has(channel)),
    ),
  );
  const groups = plan.groups.flatMap((group) => {
    const groupChannels = new Set(
      [...group.channels].filter((channel) => playable.has(channel)),
    );
    return groupChannels.size > 0
      ? [
          {
            timing: group.timing,
            keyframes: toWaapiKeyframes(frames, groupChannels, options.base),
          },
        ]
      : [];
  });
  const scheme: MotionScheme =
    element.ownerDocument.documentElement.dataset.motionScheme === 'standard'
      ? 'standard'
      : 'expressive';
  const timings = canAnimate(element)
    ? resolveAll(
        element,
        groups.map((group) => group.timing),
        scheme,
      )
    : null;
  if (timings === null)
    return settleAtOnce(element, frames, playable, options.base, liveEnd);

  const keys = [
    ...new Set(groups.flatMap((group) => group.keyframes.flatMap(keysOf))),
  ];
  const now =
    liveEnd || options.from === 'current' ? valuesNow(element, keys) : {};
  const legs = groups.map((group, index) => {
    const { duration, easing } = timings[index];
    const scaled = duration * plan.scale;
    const animation = element.animate(
      keyframesToPlay(group.keyframes, now, { from: options.from, liveEnd }),
      { duration: scaled, easing, delay: plan.delay, fill: 'both' },
    );
    return { animation, handle: handleOf(animation, plan.delay, scaled) };
  });
  return {
    handle: composeHandles(legs.map((leg) => leg.handle)),
    animations: legs.map((leg) => leg.animation),
  };
}
