import { composeHandles, settledHandle, splitFrames } from './compose.js';
import type { MotionHandle, VisualFrame } from './contract.js';
import type { MotionSpec } from './define-motion.js';
import { motionManifest, type ManifestVerb } from './manifest.js';
import type { SpringRef } from './motion-spec.js';
import { resolveReducedRender } from './reduced-render.js';
import type { MotionRuntime } from './runtime.js';
import { startRoutedMotion } from './timing-integration.js';
import type { TimingSupport } from './timing-routing.js';
import type { CurveTiming, MotionScheme } from './tokens.js';
import { waapiProvider } from './providers/waapi.js';
import { probeWaapiEasing } from './waapi-probe.js';

type Direction = 'forward' | 'backward';
type Group = { keyframes: VisualFrame[]; timing: SpringRef | CurveTiming };

/** Reduced fades are opacity-only and always use this effects spring. */
const REDUCED_FADE_TIMING: SpringRef = 'spring.default.effects';

/** Write the visual fields of a frame inline. Never writes `transform`. */
export function applyFrame(target: HTMLElement, frame: VisualFrame): void {
  if (frame.opacity !== undefined) target.style.opacity = String(frame.opacity);
  if (frame.x !== undefined || frame.y !== undefined) target.style.translate = `${frame.x ?? 0}px ${frame.y ?? 0}px`;
  if (frame.scale !== undefined) target.style.scale = String(frame.scale);
  if (frame.rotate !== undefined) target.style.rotate = `${frame.rotate}deg`;
}

function windowOf(target: HTMLElement): Window {
  return target.ownerDocument.defaultView ?? window;
}

/** Write the current computed values inline so that a new motion starts from them. */
function freezeCurrentStyle(target: HTMLElement): void {
  const computed = windowOf(target).getComputedStyle(target);
  target.style.opacity = computed.opacity;
  target.style.translate = computed.translate === 'none' ? '0px 0px' : computed.translate;
  target.style.scale = computed.scale === 'none' ? '1' : computed.scale;
  target.style.rotate = computed.rotate === 'none' ? '0deg' : computed.rotate;
}

/** `--udx-motion-scale` clamped to [0, 1]; absent or non-numeric means 1. */
function motionScale(target: HTMLElement): number {
  const value = Number.parseFloat(windowOf(target).getComputedStyle(target).getPropertyValue('--udx-motion-scale'));
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
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
function settle(target: HTMLElement, destination: VisualFrame, runtime: MotionRuntime, report?: unknown): MotionHandle {
  applyFrame(target, destination);
  if (report !== undefined && runtime.development) console.error('[@udixio/motion] playMotion settled at its destination:', report);
  return settledHandle();
}

function waapiSupport(element: HTMLElement, candidate: { easing: string }): TimingSupport {
  const { status } = probeWaapiEasing(element, candidate.easing);
  if (status === 'accepted') return 'supported';
  return status === 'refused' ? 'refused' : 'unknown';
}

/**
 * Play a validated motion spec on `target`. The returned handle never rejects its
 * `finished`; on any failure the target is left in its destination state.
 */
export function playMotion(
  target: HTMLElement,
  spec: Readonly<MotionSpec>,
  options: { direction: Direction; carry: boolean; runtime: MotionRuntime; scheme?: MotionScheme },
): MotionHandle {
  const { direction, carry, runtime } = options;
  const scheme = options.scheme ?? (target.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive');
  const verb = directedVerb(spec.verb, direction);
  const frames: VisualFrame[] = direction === 'backward' ? [...spec.keyframes].reverse() : [...spec.keyframes];
  const destination = frames[frames.length - 1];
  const reducedPolicy = runtime.policy.reduced;
  if (reducedPolicy && resolveReducedRender(verb, spec.reduced).render !== 'fade') return settle(target, destination, runtime);

  if (carry) freezeCurrentStyle(target);
  if (reducedPolicy) {
    for (const frame of splitFrames([destination]).spatial) applyFrame(target, frame);
  }
  const groups: Group[] = reducedPolicy
    ? [{ keyframes: fadeFrames(frames, direction, carry), timing: REDUCED_FADE_TIMING }]
    : planGroups(carry ? [destination] : frames, verb, spec.timing);
  const scale = reducedPolicy ? 1 : motionScale(target);

  const started: MotionHandle[] = [];
  let failure: unknown;
  try {
    for (const group of groups) {
      const result = startRoutedMotion(
        { target, keyframes: group.keyframes, timing: group.timing, scheme, verb, reduced: spec.reduced, policy: 'normal', scale, backend: 'waapi' },
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
  return settle(target, destination, runtime, failure);
}
