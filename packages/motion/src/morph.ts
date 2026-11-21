import { animate } from 'animejs';
import { morphTo } from 'animejs/svg';
import { settledHandle } from './compose.js';
import type { MotionHandle } from './contract.js';
import { animejsEase } from './ease.js';
import type { SpringRef } from './motion-spec.js';
import { motionDisabledIn, motionScaleIn } from './motion-style.js';
import { getMotionRuntime } from './runtime.js';
import { routeTimingWithEvaluator } from './timing-routing.js';
import type { CurveTiming, MotionScheme } from './tokens.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** The options of `morph`: a timing (a spring, `spring.default.spatial` by default, or a curve), and the sampling precision. */
export interface MorphOptions {
  /**
   * A spring token, or a curve.
   * @defaultValue 'spring.default.spatial'
   */
  timing?: SpringRef | CurveTiming;
  /** Points per unit of length that the two shapes are resampled to; 0 morphs the two `d` strings as they are. */
  precision?: number;
}

/**
 * A hidden path of the shape `d`, in the SVG of `path`: a morph reads it as its target, and it is removed when the morph
 * ends. The path must be inside an SVG.
 */
function scratchPath(path: SVGPathElement, d: string): SVGPathElement {
  const svg = path.ownerSVGElement;
  if (!svg) throw new TypeError('morph needs the path to be inside an SVG');
  const element = path.ownerDocument.createElementNS(SVG_NAMESPACE, 'path');
  element.setAttribute('d', d);
  element.style.visibility = 'hidden';
  svg.append(element);
  return element;
}

/**
 * Morph the shape of `path` into `to` (a path, or the `d` of one) over the timing, with anime.js. The handle ends when the
 * shape is there, and then `path` carries exactly the `d` of `to`. Under reduced motion, with `--udx-motion: none` or a zero
 * motion scale, the shape is set at once.
 * @param path - The path whose shape changes.
 * @param to - The path to become, or its `d`.
 * @param options - The timing and the sampling precision.
 * @returns The handle of the morph.
 */
export function morph(path: SVGPathElement, to: SVGPathElement | string, options: MorphOptions = {}): MotionHandle {
  const d = typeof to === 'string' ? to : (to.getAttribute('d') ?? '');
  const style = (path.ownerDocument.defaultView ?? window).getComputedStyle(path);
  const scale = motionScaleIn(style);
  if (getMotionRuntime().policy.reduced || motionDisabledIn(style) || scale === 0) {
    path.setAttribute('d', d);
    return { ...settledHandle(), backend: 'animejs' };
  }
  const scheme: MotionScheme = path.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';
  // The same routing as the anime.js provider: a spring falls back to its cubic-bezier, a curve is its own easing.
  const route = routeTimingWithEvaluator(options.timing ?? 'spring.default.spatial', { scheme, backend: 'animejs' }, candidate => {
    try {
      animejsEase(candidate.easing);
      return 'supported';
    } catch {
      return 'refused';
    }
  });
  if (route.status !== 'resolved') throw new RangeError('The timing cannot be played by anime.js');
  const duration = route.duration * scale;
  const scratch = typeof to === 'string' ? scratchPath(path, to) : undefined;
  const target = scratch ?? to;
  let settled = false;
  let frozen: number | undefined;
  let resolve!: (result: 'finished' | 'cancelled') => void;
  const finished = new Promise<'finished' | 'cancelled'>(done => {
    resolve = done;
  });
  const settle = (result: 'finished' | 'cancelled') => {
    if (settled) return;
    settled = true;
    scratch?.remove();
    resolve(result);
  };
  const animation = animate(path, {
    d: morphTo(target, options.precision),
    duration,
    ease: animejsEase(route.easing),
    onComplete: () => {
      frozen = duration;
      // anime.js leaves its own resampled string at the end: the shape is the one asked for.
      path.setAttribute('d', d);
      settle('finished');
    },
  });
  return {
    backend: 'animejs',
    delay: 0,
    duration,
    get currentTime() {
      return frozen ?? animation.currentTime;
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
    seek: timeMs => {
      if (!settled) animation.seek(timeMs);
    },
    cancel: () => {
      if (settled) return;
      // The shape stays where it is: the animation is removed, not reverted.
      frozen = animation.currentTime;
      animation.cancel();
      settle('cancelled');
    },
  };
}
