import type { MotionElement, MotionHandle, MotionProvider, VisualFrame } from './contract.js';
import { motionManifest, type ManifestReduced, type ManifestVerb } from './manifest.js';
import type { SpringRef } from './motion-spec.js';
import { resolveReducedRender } from './reduced-render.js';
import { routeTimingWithEvaluator, type TimingBackend, type TimingRoute, type TimingSupport } from './timing-routing.js';
import { resolveCurve, resolveSpring, type CurveTiming, type MotionScheme } from './tokens.js';

type Input = { target: MotionElement | null; keyframes: VisualFrame[]; timing: SpringRef | CurveTiming; scheme: MotionScheme; verb: ManifestVerb; reduced?: ManifestReduced; policy: 'normal' | 'reduced' | 'unknown'; scale: number; delay?: number; commit?: boolean; backend: TimingBackend };
type Result = { status: 'started'; handle: MotionHandle; route: Extract<TimingRoute, { status: 'resolved' }> } | { status: 'reduced'; render: ManifestReduced; scalesWithMotion: boolean } | { status: 'instant'; reason: 'zero-scale' } | { status: 'unavailable'; reason: 'policy-unknown' | 'no-target' | 'support-unknown' | 'support-refused'; source?: 'linear' | 'fallback' | 'curve' };
const active = new WeakSet<object>();
function own(object: unknown, key: PropertyKey, optional = false): unknown {
  if (object === null || typeof object !== 'object') throw new TypeError('Invalid input');
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor && optional) return undefined;
  if (!descriptor || !('value' in descriptor)) throw new TypeError(`Invalid ${String(key)}`);
  return descriptor.value;
}
function dataProperty(object: object, key: string): unknown {
  let current: object | null = object;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) {
      if (!('value' in descriptor)) throw new TypeError(`Invalid provider ${key}`);
      return descriptor.value;
    }
    current = Object.getPrototypeOf(current) as object | null;
  }
  throw new TypeError(`Invalid provider ${key}`);
}
function framesCopy(value: unknown): VisualFrame[] {
  if (!Array.isArray(value)) throw new TypeError('Invalid frames');
  const result: VisualFrame[] = [];
  for (let i = 0; i < value.length; i++) {
    const frame = own(value, String(i));
    if (frame === null || typeof frame !== 'object' || Array.isArray(frame)) throw new TypeError('Invalid frame');
    const copy: Record<string, number> = {};
    for (const key of Reflect.ownKeys(frame)) {
      if (typeof key !== 'string' || !(motionManifest.domains.visualFields as readonly string[]).includes(key)) throw new TypeError('Invalid frame field');
      const number = own(frame, key);
      if (typeof number !== 'number' || !Number.isFinite(number)) throw new TypeError('Invalid frame value');
      copy[key] = number;
    }
    result.push(copy);
  }
  return result;
}
/**
 * Internal, point-in-time decision. Semantic support and lifecycle belong to the caller.
 * Provider backend and animate must be data properties (inherited methods are accepted).
 * Accessors are rejected; proxy traps can still execute and are outside this guarantee.
 */
export function startRoutedMotion(input: Input, provider: MotionProvider, evaluate: (target: MotionElement, candidate: { backend: TimingBackend; easing: string }) => TimingSupport): Result {
  if (input === null || typeof input !== 'object') throw new TypeError('Invalid input');
  if (active.has(input)) throw new Error('Reentrant motion input');
  active.add(input);
  try {
    const rawTiming = own(input, 'timing');
    const scheme = own(input, 'scheme');
    if (scheme !== 'standard' && scheme !== 'expressive') throw new RangeError('Invalid motion scheme');
    let timing: SpringRef | CurveTiming;
    if (typeof rawTiming === 'string') {
      resolveSpring(rawTiming as SpringRef, { scheme, support: { linear: true, fallback: false } });
      timing = rawTiming as SpringRef;
    } else {
      resolveCurve(rawTiming as CurveTiming);
      timing = { duration: own(rawTiming, 'duration'), easing: own(rawTiming, 'easing') } as CurveTiming;
    }
    const reduced = resolveReducedRender(own(input, 'verb') as ManifestVerb, own(input, 'reduced', true) as ManifestReduced | undefined);
    const policy = own(input, 'policy');
    if (policy !== 'normal' && policy !== 'reduced' && policy !== 'unknown') throw new RangeError('Invalid policy');
    const backend = own(input, 'backend');
    if (backend !== 'waapi' && backend !== 'css' && backend !== 'animejs') throw new RangeError('Invalid backend');
    if (!provider || typeof provider !== 'object' || dataProperty(provider, 'backend') !== backend) throw new TypeError('Invalid provider');
    const animate = dataProperty(provider, 'animate');
    if (typeof animate !== 'function') throw new TypeError('Invalid provider');
    const keyframes = framesCopy(own(input, 'keyframes'));
    const scale = own(input, 'scale');
    if (typeof scale !== 'number' || !Number.isFinite(scale) || scale < 0 || scale > 1) throw new RangeError('Invalid scale');
    const delay = own(input, 'delay', true);
    if (delay !== undefined && (typeof delay !== 'number' || !Number.isFinite(delay) || delay < 0)) throw new RangeError('Invalid delay');
    const commit = own(input, 'commit', true);
    if (commit !== undefined && typeof commit !== 'boolean') throw new RangeError('Invalid commit');
    const target = own(input, 'target') as MotionElement | null;
    if (target !== null && (typeof target !== 'object' || !target.ownerDocument)) throw new TypeError('Invalid target');
    const document = target?.ownerDocument;
    if (typeof evaluate !== 'function') throw new TypeError('Invalid evaluator');
    if (policy === 'reduced') return { status: 'reduced', ...reduced };
    if (policy === 'unknown') return { status: 'unavailable', reason: 'policy-unknown' };
    if (!target) return { status: 'unavailable', reason: 'no-target' };
    if (scale === 0) return { status: 'instant', reason: 'zero-scale' };
    const route = routeTimingWithEvaluator(timing, { scheme, backend }, candidate => {
      const support = evaluate(target, candidate);
      if (target.ownerDocument !== document) throw new Error('Target document changed');
      return support;
    });
    if (route.status !== 'resolved') return { status: 'unavailable', reason: route.status === 'unknown' ? 'support-unknown' : 'support-refused', source: route.source };
    const duration = route.duration * scale;
    if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('Invalid scaled duration');
    const handle = animate.call(provider, { target, keyframes, timing: { duration, easing: route.easing, ...(delay !== undefined && { delay }) }, ...(commit !== undefined && { commit }) });
    return { status: 'started', handle, route };
  } finally { active.delete(input); }
}
