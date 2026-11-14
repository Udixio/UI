import type { SpringRef } from './motion-spec.js';
import { resolveCurve, resolveSpring } from './tokens.js';
import type { CurveTiming, MotionScheme } from './tokens.js';

/** Semantic support established by the caller for the exact candidate and backend. */
export type TimingSupport = 'supported' | 'refused' | 'unknown';
export type TimingBackend = 'css' | 'waapi' | 'animejs';
type SpringOptions = { scheme: MotionScheme; backend: TimingBackend; support: { linear: TimingSupport; fallback: TimingSupport } };
type CurveOptions = { scheme: MotionScheme; backend: TimingBackend; support: { curve: TimingSupport } };
type Source = 'linear' | 'fallback' | 'curve';
export type TimingRoute =
  | { status: 'resolved'; backend: TimingBackend; duration: number; easing: string; source: Source }
  | { status: 'unknown' | 'refused'; backend: TimingBackend; source: Source };

function property(object: unknown, key: string): unknown {
  if (object === null || typeof object !== 'object' || Array.isArray(object)) throw new TypeError('Invalid timing options');
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor || !('value' in descriptor)) throw new TypeError('Invalid timing options');
  return descriptor.value;
}
function supportState(value: unknown): TimingSupport {
  if (value !== 'supported' && value !== 'refused' && value !== 'unknown') throw new TypeError('Invalid timing support');
  return value;
}

/** Resolve timing only. The caller owns policy, semantic support detection and provider invocation. */
export function routeTiming(...[timing, options]: [timing: SpringRef, options: SpringOptions] | [timing: CurveTiming, options: CurveOptions]): TimingRoute {
  const scheme = property(options, 'scheme');
  if (scheme !== 'standard' && scheme !== 'expressive') throw new RangeError('Invalid motion scheme');
  const backend = property(options, 'backend');
  if (backend !== 'css' && backend !== 'waapi' && backend !== 'animejs') throw new RangeError('Invalid timing backend');
  const support = property(options, 'support');
  if (typeof timing === 'string') {
    // Validate the reference even when no candidate is currently supported.
    const preferred = resolveSpring(timing, { scheme, support: { linear: true, fallback: false } });
    const linear = supportState(property(support, 'linear'));
    const fallback = supportState(property(support, 'fallback'));
    if (backend !== 'animejs') {
      if (linear === 'supported') return { status: 'resolved', backend, ...preferred };
      if (linear === 'unknown') return { status: 'unknown', backend, source: 'linear' };
    }
    if (fallback !== 'supported') return { status: fallback, backend, source: 'fallback' };
    return { status: 'resolved', backend, ...resolveSpring(timing, { scheme, support: { linear: false, fallback: true } }) };
  }
  const curve = resolveCurve(timing);
  const state = supportState(property(support, 'curve'));
  if (state !== 'supported') return { status: state, backend, source: 'curve' };
  return { status: 'resolved', backend, ...curve, source: 'curve' };
}

/** Internal boundary: the caller establishes semantic support for this exact backend and easing. */
export function routeTimingWithEvaluator(
  timing: SpringRef | CurveTiming,
  options: { scheme: MotionScheme; backend: TimingBackend },
  evaluate: (candidate: { backend: TimingBackend; easing: string }) => TimingSupport,
): TimingRoute {
  const scheme = property(options, 'scheme');
  const backend = property(options, 'backend');
  if (scheme !== 'standard' && scheme !== 'expressive') throw new RangeError('Invalid motion scheme');
  if (backend !== 'css' && backend !== 'waapi' && backend !== 'animejs') throw new RangeError('Invalid timing backend');
  if (typeof evaluate !== 'function') throw new TypeError('Invalid timing evaluator');
  if (typeof timing === 'string') {
    if (backend !== 'animejs') {
      const preferred = resolveSpring(timing, { scheme, support: { linear: true, fallback: false } });
      const linear = supportState(evaluate({ backend, easing: preferred.easing }));
      if (linear === 'supported') return { status: 'resolved', backend, ...preferred };
      if (linear === 'unknown') return { status: 'unknown', backend, source: 'linear' };
    }
    const fallback = resolveSpring(timing, { scheme, support: { linear: false, fallback: true } });
    const fallbackState = supportState(evaluate({ backend, easing: fallback.easing }));
    if (fallbackState !== 'supported') return { status: fallbackState, backend, source: 'fallback' };
    return { status: 'resolved', backend, ...fallback };
  }
  const curve = resolveCurve(timing);
  const support = supportState(evaluate({ backend, easing: curve.easing }));
  if (support !== 'supported') return { status: support, backend, source: 'curve' };
  return { status: 'resolved', backend, ...curve, source: 'curve' };
}
