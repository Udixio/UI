import { settledHandle } from './compose.js';
import type { MotionElement, MotionHandle } from './contract.js';
import { resolveWaapiTiming } from './play.js';
import { motionDisabledIn, motionScaleIn } from './motion-style.js';
import { getMotionRuntime } from './runtime.js';
import { checkSources, listRunning, ownerOf, running, unlistRunning, type RunningStyle } from './slots.js';
import type { MotionScheme, Timing } from './tokens.js';

/**
 * One keyframe of `animateStyle`: CSS values by camelCase property name (`borderRadius`) or custom property (`--x`).
 * A number is unitless (`opacity`), `null` keeps the underlying value, and `offset` places the keyframe along the motion;
 * `auto` on a width or height is measured to pixels, and a motion that ends on it leaves no inline size; a custom property
 * interpolates only once it is registered with `@property`.
 */
export type StyleKeyframe = Record<string, string | number | null> & { offset?: number };

/** The options of `animateStyle`: its timing, its delay and repeats, whether it starts from the element, and its reduced frame. */
export interface AnimateStyleOptions {
  /**
   * The motion of the keyframes: a spring token, or a curve (`{ duration, easing }`, each a token, or milliseconds and a CSS
   * easing); `spring.default.spatial` by default. `--udx-motion-scale` multiplies its duration, and a scale of 0 shows the
   * end frame at once.
   */
  timing?: Timing;
  /** Milliseconds before the motion starts; 0 by default. */
  delay?: number;
  /** How many times the motion plays, `Infinity` for a loop; 1 by default. */
  iterations?: number;
  /** Start from the element's current computed values; true by default for a single keyframe. */
  carry?: boolean;
  /** What reduced motion, `--udx-motion: none` or a motion scale of 0 shows: the last keyframe (the first one for a loop), the first, or a given frame. */
  reduced?: 'end' | 'start' | StyleKeyframe;
}

/** The properties whose `auto` is measured to pixels, since WAAPI cannot interpolate to `auto`. */
const SIZES: ReadonlySet<string> = new Set(['width', 'height', 'inline-size', 'block-size']);

/** The CSS name of a camelCase property; a custom property keeps its name. */
const cssName = (key: string): string => (key.startsWith('--') ? key : key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`));

const styleOf = (element: MotionElement): CSSStyleDeclaration => (element.ownerDocument.defaultView ?? window).getComputedStyle(element);

/** The scheme of the document, which picks the spring of a token. */
const schemeOf = (element: MotionElement): MotionScheme =>
  element.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';

/** The properties a set of keyframes animates, in CSS names. */
const propertiesOf = (frames: StyleKeyframe[]): string[] =>
  [...new Set(frames.flatMap(frame => Object.keys(frame).filter(key => key !== 'offset').map(cssName)))];

/**
 * Animates CSS properties of an element over a motion token, and leaves the element at its last frame.
 * @param element - The element whose style is animated.
 * @param keyframes - One keyframe (the end, from the current values) or several, in CSS property names.
 * @param options - The timing, the delay, the iterations, and whether to start from the current values.
 * @returns The handle of the animation.
 */
export function animateStyle(element: MotionElement, keyframes: StyleKeyframe | StyleKeyframe[], options: AnimateStyleOptions = {}): MotionHandle {
  const frames = Array.isArray(keyframes) ? keyframes : [keyframes];
  if (frames.length === 0) throw new RangeError('animateStyle needs at least one keyframe');
  const iterations = options.iterations ?? 1;
  if (!(iterations > 0)) throw new RangeError('Invalid iterations');
  const delay = options.delay ?? 0;
  if (!Number.isFinite(delay) || delay < 0) throw new RangeError('Invalid delay');
  const properties = propertiesOf(frames);
  const runtime = getMotionRuntime();
  // The motion scale shortens the duration of the motion; at 0 there is no motion, as under reduced motion.
  const scale = motionScaleIn(styleOf(element));
  if (runtime.policy.reduced || motionDisabledIn(styleOf(element)) || scale === 0) {
    interrupt(element, properties);
    writeFrame(element, reducedFrame(frames, options.reduced ?? (iterations === Infinity ? 'start' : 'end')));
    return settledHandle();
  }
  let route = resolveWaapiTiming(element, options.timing ?? 'spring.default.spatial', schemeOf(element));
  if (route) route = { duration: route.duration * scale, easing: route.easing };
  // The computed values are read before the running motions are cancelled: a carried motion starts from them.
  const carry = options.carry ?? frames.length === 1;
  const start = carry ? carriedFrames(frames, styleOf(element)) : frames;
  interrupt(element, properties);
  if (!route) {
    writeFrame(element, frames[frames.length - 1]);
    if (runtime.development) console.error('[@udixio/motion] animateStyle could not route its timing; the element is at its last frame');
    return settledHandle();
  }
  let animation: Animation;
  try {
    animation = element.animate(start.map(frame => waapiKeyframe(element, frame)), { duration: route.duration, easing: route.easing, delay, iterations, fill: 'both' });
  } catch (error) {
    writeFrame(element, start[start.length - 1]);
    if (runtime.development) console.error('[@udixio/motion] animateStyle could not animate:', error);
    return settledHandle();
  }
  return follow(element, animation, start, properties, route.duration, delay);
}

/**
 * The handle of a running WAAPI motion. Its end frame is written inline from the keyframes before the animation is cancelled,
 * so the element holds nothing once the motion ends.
 */
function follow(element: MotionElement, animation: Animation, frames: StyleKeyframe[], properties: readonly string[], duration: number, delay: number): MotionHandle {
  let settled = false;
  let frozen: number | undefined;
  let resolveFinished!: (result: 'finished' | 'cancelled') => void;
  const finished = new Promise<'finished' | 'cancelled'>(done => {
    resolveFinished = done;
  });
  // In development, the motion is named by the component that reserves a kind of the element, which is what animates it.
  const motion: RunningStyle = { properties, cancel: () => end('cancelled'), ...(__MOTION_CHECKS__ && { source: ownerOf(element) ?? 'animateStyle' }) };
  listRunning(element, motion);
  if (__MOTION_CHECKS__) checkSources(element, motion);

  /** Freeze the time, forget the motion, cancel the animation, and resolve. */
  function end(result: 'finished' | 'cancelled'): void {
    if (settled) return;
    settled = true;
    frozen = Number(animation.currentTime ?? 0);
    unlistRunning(element, motion);
    animation.cancel();
    resolveFinished(result);
  }

  animation.finished.then(() => {
    if (settled) return;
    // A reversed motion ends on its first frame. A single keyframe reversed to its start stands for the underlying value.
    const reversed = animation.playbackRate < 0;
    const endpoint = reversed ? (frames.length > 1 ? frames[0] : undefined) : frames[frames.length - 1];
    if (endpoint) writeFrame(element, endpoint);
    end('finished');
  }, () => end('cancelled'));

  return {
    backend: 'waapi',
    delay,
    duration,
    get currentTime() {
      return frozen ?? Number(animation.currentTime ?? 0);
    },
    finished,
    velocity: { value: 0, source: 'unavailable' },
    play: () => {
      if (!settled) animation.play();
    },
    pause: () => {
      if (!settled) animation.pause();
    },
    reverse: () => {
      if (!settled) animation.reverse();
    },
    seek: time => {
      if (!settled) animation.currentTime = time;
    },
    cancel: () => end('cancelled'),
  };
}

/**
 * Cancel the running motions of `animateStyle` on an element that animate one of the given properties. A motion bound by
 * `motion()`, listed in development only, has no `cancel`: it is not this function's to stop.
 */
function interrupt(element: MotionElement, properties: readonly string[]): void {
  const motions = running.get(element);
  if (!motions) return;
  for (const motion of [...motions]) {
    if (motion.properties.some(property => properties.includes(property))) motion.cancel?.();
  }
}

/** The frames of a carried motion: the first frame takes the computed values of its properties, so the motion starts where the element is. */
function carriedFrames(frames: StyleKeyframe[], style: CSSStyleDeclaration): StyleKeyframe[] {
  const [first, ...rest] = frames;
  const from: StyleKeyframe = {};
  for (const key of Object.keys(first)) {
    if (key !== 'offset') from[key] = style.getPropertyValue(cssName(key)).trim();
  }
  if (frames.length === 1) return [from, first];
  return [{ ...from, ...(first.offset !== undefined && { offset: first.offset }) }, ...rest];
}

/** The keyframe WAAPI plays for a frame: `auto` sizes are measured to pixels, and `null` keeps the underlying value. */
function waapiKeyframe(element: MotionElement, frame: StyleKeyframe): Keyframe {
  const keyframe: Keyframe = {};
  for (const [key, value] of Object.entries(frame)) {
    if (value === 'auto' && SIZES.has(cssName(key))) keyframe[key] = measureAuto(element, cssName(key));
    else keyframe[key] = value;
  }
  return keyframe;
}

/**
 * The used size of a property set to `auto`, in px, read once with the element's own style restored afterwards. The
 * computed size is the content size for `content-box`, and the border box for `border-box`, as the property itself is.
 */
function measureAuto(element: MotionElement, property: string): string {
  const { style } = element;
  const previous = style.getPropertyValue(property);
  const priority = style.getPropertyPriority(property);
  style.setProperty(property, 'auto');
  const size = styleOf(element).getPropertyValue(property);
  if (previous) style.setProperty(property, previous, priority);
  else style.removeProperty(property);
  return size;
}

/**
 * Write the final values of a frame inline, keeping the priority of each property. A `null` value and an `auto` size leave no
 * inline value, so the author's CSS (or the auto size) applies again.
 */
function writeFrame(element: MotionElement, frame: StyleKeyframe): void {
  const { style } = element;
  for (const [key, value] of Object.entries(frame)) {
    if (key === 'offset') continue;
    const property = cssName(key);
    if (value === null || (value === 'auto' && SIZES.has(property))) style.removeProperty(property);
    else style.setProperty(property, String(value), style.getPropertyPriority(property));
  }
}

/** The frame an element shows under reduced motion: the last keyframe, the first one, or the given frame. */
function reducedFrame(frames: StyleKeyframe[], reduced: 'end' | 'start' | StyleKeyframe): StyleKeyframe {
  if (typeof reduced !== 'string') return reduced;
  return reduced === 'start' ? frames[0] : frames[frames.length - 1];
}
