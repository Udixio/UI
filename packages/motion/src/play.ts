import { composeHandles, settledHandle, splitFrames } from './compose.js';
import type { MotionHandle, VisualFrame } from './contract.js';
import type { MotionSpec } from './define-motion.js';
import { motionManifest, type ManifestVerb, type ManifestVisualField } from './manifest.js';
import type { SpringRef } from './motion-spec.js';
import { resolveReducedRender } from './reduced-render.js';
import type { MotionRuntime } from './runtime.js';
import { startRoutedMotion } from './timing-integration.js';
import { routeTimingWithEvaluator, type TimingSupport } from './timing-routing.js';
import type { CurveTiming, MotionScheme } from './tokens.js';
import { waapiProvider } from './providers/waapi.js';
import { probeWaapiEasing } from './waapi-probe.js';

type Direction = 'forward' | 'backward';
type Group = { keyframes: VisualFrame[]; timing: SpringRef | CurveTiming };

/** Reduced fades are opacity-only and always use this effects spring. */
const REDUCED_FADE_TIMING: SpringRef = 'spring.default.effects';
const OPACITY_ONLY: ReadonlySet<ManifestVisualField> = new Set<ManifestVisualField>(['opacity']);

/** Write the visual fields of a frame inline. Never writes `transform`. */
export function applyFrame(target: HTMLElement, frame: VisualFrame): void {
  if (frame.opacity !== undefined) target.style.opacity = String(frame.opacity);
  if (frame.x !== undefined || frame.y !== undefined) target.style.translate = `${frame.x ?? 0}px ${frame.y ?? 0}px`;
  if (frame.scale !== undefined) target.style.scale = String(frame.scale);
  else if (frame.scaleX !== undefined || frame.scaleY !== undefined) target.style.scale = `${frame.scaleX ?? 1} ${frame.scaleY ?? 1}`;
  if (frame.rotate !== undefined) target.style.rotate = `${frame.rotate}deg`;
}

const INLINE_PROPERTY: Record<keyof VisualFrame, string> = { opacity: 'opacity', x: 'translate', y: 'translate', scale: 'scale', scaleX: 'scale', scaleY: 'scale', rotate: 'rotate' };

/** Remove the inline properties written for the given fields, so that author CSS applies again. */
export function releaseFrame(target: HTMLElement, fields: Iterable<keyof VisualFrame>): void {
  for (const property of new Set([...fields].map(field => INLINE_PROPERTY[field]))) target.style.removeProperty(property);
}

function windowOf(target: HTMLElement): Window {
  return target.ownerDocument.defaultView ?? window;
}

/** The visual fields written by a set of frames. */
function fieldsOf(frames: VisualFrame[]): Set<ManifestVisualField> {
  return new Set(frames.flatMap(frame => Object.keys(frame) as ManifestVisualField[]));
}

/**
 * Write the current computed values of the given fields inline, so that a new
 * motion starts from them. Other fields stay untouched, so author CSS still applies.
 */
function freezeCurrentStyle(target: HTMLElement, fields: ReadonlySet<ManifestVisualField>): void {
  const computed = windowOf(target).getComputedStyle(target);
  if (fields.has('opacity')) target.style.opacity = computed.opacity;
  if (fields.has('x') || fields.has('y')) target.style.translate = computed.translate === 'none' ? '0px 0px' : computed.translate;
  if (fields.has('scale') || fields.has('scaleX') || fields.has('scaleY')) target.style.scale = computed.scale === 'none' ? '1' : computed.scale;
  if (fields.has('rotate')) target.style.rotate = computed.rotate === 'none' ? '0deg' : computed.rotate;
}

/** `--udx-motion: none` on the element or inherited from an ancestor turns its motions off. */
export function motionDisabledIn(style: CSSStyleDeclaration): boolean {
  return style.getPropertyValue('--udx-motion').trim() === 'none';
}

/** `--udx-motion-scale` clamped to [0, 1]; absent or non-numeric means 1. */
export function motionScaleIn(style: CSSStyleDeclaration): number {
  const value = Number.parseFloat(style.getPropertyValue('--udx-motion-scale'));
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

export function motionDisabled(target: HTMLElement): boolean {
  return motionDisabledIn(windowOf(target).getComputedStyle(target));
}

export function motionScale(target: HTMLElement): number {
  return motionScaleIn(windowOf(target).getComputedStyle(target));
}

/** A backward appear plays with the disappear defaults, and the reverse. */
function directedVerb(verb: ManifestVerb, direction: Direction): ManifestVerb {
  if (direction === 'forward') return verb;
  if (verb === 'appear') return 'disappear';
  if (verb === 'disappear') return 'appear';
  return verb;
}

/** Opacity frames of a reduced fade; a definition without opacity gets a plain fade. */
function fadeFrames(frames: VisualFrame[], direction: Direction, carry: boolean): VisualFrame[] {
  const { effects } = splitFrames(frames);
  const plain: VisualFrame[] = direction === 'forward' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
  const fade = effects.length > 0 ? effects : plain;
  return carry ? fade.slice(-1) : fade;
}

/**
 * A spec timing applies to every field at once. Otherwise the manifest default
 * applies: verbs with two default springs split spatial fields from opacity.
 */
function planGroups(keyframes: VisualFrame[], verb: ManifestVerb, timing: SpringRef | CurveTiming | undefined): Group[] {
  if (timing !== undefined) return [{ keyframes, timing }];
  const defaults = motionManifest.defaults[verb].timing as readonly SpringRef[];
  if (defaults.length === 1) return [{ keyframes, timing: defaults[0] }];
  const [spatialRef, effectsRef] = defaults;
  const { spatial, effects } = splitFrames(keyframes);
  return [
    ...(spatial.length > 0 ? [{ keyframes: spatial, timing: spatialRef }] : []),
    ...(effects.length > 0 ? [{ keyframes: effects, timing: effectsRef }] : []),
  ];
}

/** Final state at once: the destination is applied and nothing animates. */
function settle(target: HTMLElement, destination: VisualFrame, development: boolean, report?: unknown): MotionHandle {
  applyFrame(target, destination);
  if (report !== undefined && development) console.error('[@udixio/motion] playMotion settled at its destination:', report);
  return settledHandle();
}

function waapiSupport(element: HTMLElement, candidate: { easing: string }): TimingSupport {
  const { status } = probeWaapiEasing(element, candidate.easing);
  if (status === 'accepted') return 'supported';
  return status === 'refused' ? 'refused' : 'unknown';
}

const waapiTimings = new Map<string, { duration: number; easing: string } | null>();

/**
 * Duration and easing of a timing on the WAAPI provider, or null when it cannot be played. Cached per timing
 * and scheme: easing support does not change during a page's life, so the route is resolved once.
 */
export function resolveWaapiTiming(target: HTMLElement, timing: SpringRef | CurveTiming, scheme: MotionScheme): { duration: number; easing: string } | null {
  const key = `${scheme}|${typeof timing === 'string' ? timing : JSON.stringify(timing)}`;
  const cached = waapiTimings.get(key);
  if (cached !== undefined) return cached;
  const route = routeTimingWithEvaluator(timing, { scheme, backend: 'waapi' }, candidate => waapiSupport(target, candidate));
  const resolved = route.status === 'resolved' ? { duration: route.duration, easing: route.easing } : null;
  waapiTimings.set(key, resolved);
  return resolved;
}

/**
 * Play a validated motion spec on `target`. The returned handle never rejects its
 * `finished`; on any failure the target is left in its destination state. `delay`
 * (ms) postpones every group of the motion; reduced motion ignores it.
 */
export function playMotion(
  target: HTMLElement,
  spec: Readonly<MotionSpec>,
  options: { direction: Direction; carry: boolean; runtime: MotionRuntime; scheme?: MotionScheme; development?: boolean; delay?: number },
): MotionHandle {
  if (spec.verb === 'layout') throw new TypeError('playMotion does not play a layout motion: trackLayout follows it');
  const { direction, carry, runtime } = options;
  const development = options.development ?? runtime.development;
  const scheme = options.scheme ?? (target.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive');
  const verb = directedVerb(spec.verb, direction);
  const frames: VisualFrame[] = direction === 'backward' ? [...spec.keyframes].reverse() : [...spec.keyframes];
  const destination = frames[frames.length - 1];
  if (motionDisabled(target)) return settle(target, destination, development);
  const reducedPolicy = runtime.policy.reduced;
  if (reducedPolicy && resolveReducedRender(verb, spec.reduced).render !== 'fade') return settle(target, destination, development);

  // The carried animation writes only the destination's fields, so only those are frozen.
  if (carry) freezeCurrentStyle(target, reducedPolicy ? OPACITY_ONLY : fieldsOf([destination]));
  if (reducedPolicy) {
    for (const frame of splitFrames([destination]).spatial) applyFrame(target, frame);
  }
  const groups: Group[] = reducedPolicy
    ? [{ keyframes: fadeFrames(frames, direction, carry), timing: REDUCED_FADE_TIMING }]
    : planGroups(carry ? [destination] : frames, verb, spec.timing);
  const scale = reducedPolicy ? 1 : motionScale(target);
  const delay = reducedPolicy || (options.delay ?? 0) <= 0 ? undefined : options.delay;

  const started: MotionHandle[] = [];
  let failure: unknown;
  try {
    for (const group of groups) {
      const result = startRoutedMotion(
        { target, keyframes: group.keyframes, timing: group.timing, scheme, verb, reduced: spec.reduced, policy: 'normal', scale, backend: 'waapi', ...(delay !== undefined && { delay }) },
        waapiProvider,
        waapiSupport,
      );
      if (result.status !== 'started') {
        failure = result.status === 'unavailable' ? result.reason : undefined;
        break;
      }
      started.push(result.handle);
    }
  } catch (error) {
    failure = error;
  }
  if (started.length === groups.length) return composeHandles(started);
  for (const handle of started) handle.cancel();
  return settle(target, destination, development, failure);
}

/**
 * Play raw frames on `target` through the WAAPI provider. Returns null when nothing must or can
 * animate (reduced motion, `--udx-motion: none`, zero motion scale, no WAAPI, any failure):
 * the caller then leaves the element as it is.
 */
export function playFrames(
  target: HTMLElement,
  keyframes: VisualFrame[],
  options: { verb: ManifestVerb; timing: SpringRef | CurveTiming; runtime: MotionRuntime; commit?: boolean; scheme?: MotionScheme; development?: boolean },
): MotionHandle | null {
  if (options.runtime.policy.reduced || motionDisabled(target)) return null;
  const scheme = options.scheme ?? (target.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive');
  try {
    const result = startRoutedMotion(
      { target, keyframes, timing: options.timing, scheme, verb: options.verb, policy: 'normal', scale: motionScale(target), backend: 'waapi', ...(options.commit !== undefined && { commit: options.commit }) },
      waapiProvider,
      waapiSupport,
    );
    return result.status === 'started' ? result.handle : null;
  } catch (error) {
    if (options.development) console.error('[@udixio/motion] playFrames could not animate:', error);
    return null;
  }
}
