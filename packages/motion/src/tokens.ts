import type { SpringRef } from './motion-spec.js';
import type { SpringParams } from './spring.js';
import { curveData } from './curve-data.generated.js';
import { springData } from './spring-data.generated.js';

/** Material 3 motion scheme selected for a product. */
export type MotionScheme = 'expressive' | 'standard';
/** Physical spring parameters and the official last-resort web approximation. */
export type SpringToken = {
  dampingRatio: number;
  stiffness: number;
  fallback: { duration: number; easing: string };
  linear: { duration: number; easing: string };
};
/** A Material 3 duration token, from `duration.short1` (50 ms) to `duration.extraLong4` (1000 ms). */
export type DurationToken = `duration.${keyof typeof curveData.duration}`;
/** A Material 3 easing token. */
export type EasingToken = `easing.${keyof typeof curveData.easing}`;
/**
 * A timing as a curve, in place of a spring: a duration and an easing. The tokens are the recommended path; a duration in
 * milliseconds and a CSS easing are accepted where a token does not fit.
 */
export type CurveTiming = {
  /** How long the motion lasts: a duration token, or milliseconds above 0. */
  duration: DurationToken | number;
  /** How its progress accelerates and slows down: an easing token, or a CSS easing (`cubic-bezier(…)`, `linear(…)`, `ease-out`…). */
  easing: EasingToken | (string & {});
};
/**
 * The one timing grammar of @udixio/motion: a spring token, or a curve. Each API takes the forms its nature allows: a scrub
 * takes none, a loop and a time value a curve, what follows a moving target and keeps its velocity (a spring number, a
 * scroll, a gesture, a smoothed value) a spring, and everything else both.
 */
export type Timing = SpringRef | CurveTiming;
/** A resolved curve timing; duration is in milliseconds. */
export type ResolvedCurve = { duration: number; easing: string };
export type MotionTokens = {
  duration: Record<keyof typeof curveData.duration, number>;
  easing: Record<keyof typeof curveData.easing, string>;
  /** Experimental CSS pixel magnitudes; visual calibration is pending. */
  distance: Record<'sm' | 'md' | 'lg', number>;
  /** Experimental stagger steps and maximum relative start delay, in milliseconds. */
  stagger: Record<'tight' | 'normal' | 'loose' | 'max', number>;
  spring: Record<'fast' | 'default' | 'slow', Record<'spatial' | 'effects', SpringToken>>;
};

function token(source: (typeof springData.effects)[number] | (typeof springData.expressive)[number] | (typeof springData.standard)[number]): SpringToken {
  return { ...source, fallback: { ...source.fallback }, linear: { ...source.linear } };
}
/** Select a product-wide M3 scheme. Durations are in milliseconds. */
export function defineTokens(options: { scheme?: MotionScheme } = {}): MotionTokens {
  const scheme = options.scheme ?? 'expressive';
  if (scheme !== 'expressive' && scheme !== 'standard') {
    throw new RangeError(`Unknown motion scheme: ${String(scheme)}`);
  }
  const pair = (index: number) => ({ spatial: token(springData[scheme][index]), effects: token(springData.effects[index]) });
  return {
    duration: { ...curveData.duration },
    easing: { ...curveData.easing },
    spring: { fast: pair(0), default: pair(1), slow: pair(2) },
    distance: { sm: 8, md: 24, lg: 64 },
    stagger: { tight: 20, normal: 50, loose: 100, max: 400 },
  };
}

/**
 * Resolve a curve to its duration in milliseconds and its CSS easing, without applying motion policy or CSS overrides. A
 * token is read from its table; milliseconds and a CSS easing are taken as written (the browser judges the easing).
 */
export function resolveCurve(timing: CurveTiming): ResolvedCurve {
  if (timing === null || typeof timing !== 'object' || Array.isArray(timing)) throw new TypeError('Invalid curve timing');
  const keys = Reflect.ownKeys(timing);
  const duration = Object.getOwnPropertyDescriptor(timing, 'duration');
  const easing = Object.getOwnPropertyDescriptor(timing, 'easing');
  if (keys.length !== 2 || !duration || !('value' in duration) || !easing || !('value' in easing)) throw new TypeError('Invalid curve timing');
  const durationRef: unknown = duration.value;
  const easingRef: unknown = easing.value;
  const ms =
    typeof durationRef === 'number'
      ? durationRef > 0 && durationRef < Infinity && durationRef
      : typeof durationRef === 'string' && durationRef.startsWith('duration.') && Object.hasOwn(curveData.duration, durationRef.slice(9)) && curveData.duration[durationRef.slice(9) as keyof typeof curveData.duration];
  const css =
    typeof easingRef === 'string' && easingRef !== '' &&
    (!easingRef.startsWith('easing.') ? easingRef : Object.hasOwn(curveData.easing, easingRef.slice(7)) && curveData.easing[easingRef.slice(7) as keyof typeof curveData.easing]);
  if (!ms || !css) throw new RangeError('Invalid curve timing');
  return { duration: ms, easing: css };
}

/** Explicit capabilities of the consuming animation backend. */
export type SpringSupport = { linear: boolean; fallback: boolean };
/** A complete spring timing pair, in milliseconds, and its selected source. */
export type ResolvedSpring = { duration: number; easing: string; source: 'linear' | 'fallback' };

const springRefs = 'spring.fast.spatial,spring.fast.effects,spring.default.spatial,spring.default.effects,spring.slow.spatial,spring.slow.effects'.split(',');

/** The spring token a valid reference names, for a scheme. */
function springToken(ref: SpringRef, scheme: MotionScheme | undefined): SpringToken {
  const [, speed, type] = ref.split('.') as ['spring', 'fast' | 'default' | 'slow', 'spatial' | 'effects'];
  return defineTokens({ scheme }).spring[speed][type];
}

/** Physical parameters of a spring reference for a scheme, as input of the analytic spring. */
export function springParams(ref: SpringRef, scheme: MotionScheme): SpringParams {
  if (typeof ref !== 'string' || !springRefs.includes(ref)) throw new RangeError('Unknown spring reference');
  const { dampingRatio, stiffness } = springToken(ref, scheme);
  return { dampingRatio, stiffness };
}

/** Resolve an experimental spring reference using explicitly supplied backend capabilities. */
export function resolveSpring(ref: SpringRef, options: { scheme?: MotionScheme; support: SpringSupport }): ResolvedSpring {
  const index = typeof ref === 'string' ? springRefs.indexOf(ref) : -1;
  if (index < 0) throw new RangeError('Unknown spring reference');
  if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Spring options are required');
  const { scheme, support } = options;
  if (scheme !== undefined && scheme !== 'expressive' && scheme !== 'standard') throw new RangeError('Unknown motion scheme');
  if (support === null || typeof support !== 'object' || Array.isArray(support) || typeof support.linear !== 'boolean' || typeof support.fallback !== 'boolean') throw new TypeError('Boolean spring support flags are required');
  const source = support.linear ? 'linear' : support.fallback ? 'fallback' : undefined;
  if (!source) throw new Error('No supported spring easing');
  return { ...springToken(ref, scheme)[source], source };
}
