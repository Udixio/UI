import type { MotionElement, VisualFrame } from './contract.js';
import { motionDisabledIn, motionScaleIn } from './play.js';
import { frameToKeyframe } from './providers/waapi.js';
import { shapeFrames } from './svg-fields.js';

/** The part of the scroll an element is linked to: its entry, the crossing of the viewport, its exit, or its containment. */
export type ScrollRangeToken = 'enter' | 'cross' | 'exit' | 'contain';

/** The timeline range names of each token, from the first position to the last one. */
const RANGES: Record<ScrollRangeToken, [string, string]> = {
  enter: ['entry 0%', 'entry 100%'],
  cross: ['cover 0%', 'cover 100%'],
  exit: ['exit 0%', 'exit 100%'],
  contain: ['contain 0%', 'contain 100%'],
};

/*
 * The scroll-driven animation API, typed here because the DOM library of the build does not declare it yet.
 */
interface ViewTimelineOptions {
  subject: Element;
  axis: 'block' | 'inline';
}
type ViewTimelineConstructor = new (options: ViewTimelineOptions) => AnimationTimeline;
interface ScrollAnimationOptions extends KeyframeAnimationOptions {
  timeline: AnimationTimeline;
  rangeStart: string;
  rangeEnd: string;
}

/** Logged once per page: a scrub that the engine refuses leaves its element in the stylesheet state. */
let reported = false;

function viewTimelineConstructor(): ViewTimelineConstructor | undefined {
  const constructor: unknown = Reflect.get(globalThis, 'ViewTimeline');
  return typeof constructor === 'function' ? (constructor as ViewTimelineConstructor) : undefined;
}

/** Whether the browser plays animations on a view timeline. Firefox 157 does not. */
export function supportsViewTimeline(): boolean {
  return viewTimelineConstructor() !== undefined;
}

/** The timeline range of a token: the start and the end of the range, as the engine names them. */
export function rangeOf(token: ScrollRangeToken): [string, string] {
  return [...RANGES[token]];
}

/** Options of `startScrub`. `development` logs a refused scrub once, instead of leaving it silent. */
interface ScrubOptions {
  axis: 'block' | 'inline';
  range: ScrollRangeToken;
  development?: boolean;
}

/**
 * The keyframe at `amplitude` of its distance: `x`, `y` and `rotate` are multiplied by it, and a scale keeps its distance
 * from 1 (a scale of 2 at an amplitude of 0.5 is 1.5). A scrub has no duration, so `--udx-motion-scale` acts here.
 */
function amplitudeOf(frame: VisualFrame, amplitude: number): VisualFrame {
  if (amplitude === 1) return frame;
  const scaled: VisualFrame = { ...frame };
  if (scaled.x !== undefined) scaled.x *= amplitude;
  if (scaled.y !== undefined) scaled.y *= amplitude;
  if (scaled.rotate !== undefined) scaled.rotate *= amplitude;
  if (scaled.scale !== undefined) scaled.scale = 1 + (scaled.scale - 1) * amplitude;
  if (scaled.scaleX !== undefined) scaled.scaleX = 1 + (scaled.scaleX - 1) * amplitude;
  if (scaled.scaleY !== undefined) scaled.scaleY = 1 + (scaled.scaleY - 1) * amplitude;
  return scaled;
}

/**
 * Start a scroll-linked animation of `target` through its keyframes: the first keyframe at the start of the range,
 * the last at its end, interpolated in between, in either direction as the user scrolls. The distances of the keyframes
 * follow `--udx-motion-scale`, read when the animation starts. Returns null when the browser has no view timeline, when
 * `--udx-motion: none` applies, or when the engine refuses the animation: the element is then left as it is, in its
 * stylesheet state.
 */
export function startScrub(target: MotionElement, keyframes: readonly VisualFrame[], options: ScrubOptions): Animation | null {
  const View = viewTimelineConstructor();
  const style = (target.ownerDocument.defaultView ?? window).getComputedStyle(target);
  if (!View || motionDisabledIn(style)) return null;
  const amplitude = motionScaleIn(style);
  try {
    const [rangeStart, rangeEnd] = rangeOf(options.range);
    const animationOptions: ScrollAnimationOptions = {
      timeline: new View({ subject: target, axis: options.axis }),
      rangeStart,
      rangeEnd,
      fill: 'both',
      easing: 'linear',
    };
    return target.animate(shapeFrames(keyframes, target, 'view').map(frame => frameToKeyframe(amplitudeOf(frame, amplitude))), animationOptions);
  } catch (error) {
    if (options.development && !reported) {
      reported = true;
      console.error('[@udixio/motion] A scrub could not start: the element is left in its stylesheet state.', error);
    }
    return null;
  }
}
