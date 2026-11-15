import type { VisualFrame } from '../contract.js';
import type { OwnTransform } from '../flip.js';
import { motionManifest } from '../manifest.js';
import type { SpringRef } from '../motion-spec.js';
import { resolveWaapiTiming } from '../play.js';
import { easingOf, sampleContent } from '../project.js';
import { springOffset, springSettleTime, springVelocity, type SpringParams } from '../spring.js';
import { springParams, type MotionScheme } from '../tokens.js';
import { waapiProvider } from '../providers/waapi.js';
import { FIELDS, type Field, type FieldMotion, type Flight, type Item, type PlannedMove, type Playback, type Velocity } from './types.js';

const DEFAULT_TIMING = motionManifest.defaults.layout.timing[0] as SpringRef;

/** The velocity of the spring flight of an item at its current instant; null when no spring is in flight. */
export function velocityOf({ flight, handle }: Item): Velocity | null {
  if (!flight || !handle) return null;
  const t = handle.currentTime / 1000 / flight.timeScale;
  const at = (name: Field) => springVelocity(flight.params, flight.fields[name].from - flight.fields[name].to, flight.fields[name].velocity, t);
  return { x: at('x'), y: at('y'), scaleX: at('scaleX'), scaleY: at('scaleY') };
}

/** The fields of a flight from its first and last frames, with the velocity it starts with (zero from rest). */
function fieldMotions([from, to]: [VisualFrame, VisualFrame], velocity: Velocity | null): Record<Field, FieldMotion> {
  const field = (name: Field): FieldMotion => ({ from: from[name] ?? 0, to: to[name] ?? 0, velocity: velocity?.[name] ?? 0 });
  return { x: field('x'), y: field('y'), scaleX: field('scaleX'), scaleY: field('scaleY') };
}

/** Samples of a spring or a curve move: one per 1/60 s, between 8 and 90. */
function sampleCount(seconds: number): number {
  return Math.min(Math.max(Math.ceil(seconds * 60), 8), 90);
}

/** `steps + 1` frames of a spring flight at uniform instants of `seconds`; the last one is exactly the target. */
function sampleFlight(params: SpringParams, fields: Record<Field, FieldMotion>, seconds: number, steps: number): VisualFrame[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const frame: VisualFrame = {};
    for (const name of FIELDS) {
      const { from, to, velocity } = fields[name];
      frame[name] = i === steps ? to : to + springOffset(params, from - to, velocity, (i * seconds) / steps);
    }
    return frame;
  });
}

/** The frames of a move from the rest state to itself: it only carries a velocity. */
export function restFrames(rest: OwnTransform): [VisualFrame, VisualFrame] {
  const frame = { x: rest.x, y: rest.y, scaleX: rest.sx, scaleY: rest.sy };
  return [frame, frame];
}

/** `steps + 1` frames from one frame to the other, at the progress `progress(i)` of each sample; the last one is exactly the end. */
function sampleBetween([from, to]: [VisualFrame, VisualFrame], progress: (i: number) => number, steps: number): VisualFrame[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const frame: VisualFrame = {};
    const e = progress(i);
    for (const name of FIELDS) {
      const start = from[name] ?? 0;
      const end = to[name] ?? 0;
      frame[name] = i === steps ? end : start + (end - start) * e;
    }
    return frame;
  });
}

/** The spring parameters of a reference for a scheme, read once: a token lookup builds the whole token tree. */
const flightParams = new Map<MotionScheme, Map<SpringRef, SpringParams>>();
function flightParamsOf(timing: SpringRef, scheme: MotionScheme): SpringParams {
  let byTiming = flightParams.get(scheme);
  if (!byTiming) flightParams.set(scheme, (byTiming = new Map()));
  let params = byTiming.get(timing);
  if (!params) byTiming.set(timing, (params = springParams(timing, scheme)));
  return params;
}

/**
 * How a planned move plays, or null when its timing cannot be played. A move from rest keeps the token's two
 * keyframes and easing, unless a content plan follows it. A move that carries a velocity, or that a content plan
 * follows, is sampled and played with a linear easing, over the same duration: from its spring (over the token's
 * duration from rest, over its settle time bounded to one or two durations with a velocity), or from its curve when
 * the easing can be evaluated. A curve whose easing cannot be evaluated keeps its two keyframes, with no content plan.
 */
export function playbackOf({ element, item, frames, velocity, scale, content }: PlannedMove, scheme: MotionScheme): Playback | null {
  const timing = item.spec.timing ?? DEFAULT_TIMING;
  const resolved = resolveWaapiTiming(element, timing, scheme);
  if (!resolved) return null;
  const base = resolved.duration / 1000;
  const steps = sampleCount(base);
  const token: Playback = { keyframes: frames, duration: resolved.duration * scale, easing: resolved.easing, flight: null, steps, baseProgress: null };
  if (typeof timing !== 'string') {
    const ease = content !== null ? easingOf(resolved.easing) : null;
    if (!ease) return token;
    return { keyframes: sampleBetween(frames, i => ease(i / steps), steps), duration: resolved.duration * scale, easing: 'linear', flight: null, steps, baseProgress: i => ease(i / steps) };
  }
  const params = flightParamsOf(timing, scheme);
  const fields = fieldMotions(frames, velocity);
  const flight: Flight = { params, timeScale: scale, fields };
  if (velocity === null && content === null) {
    token.flight = flight;
    return token;
  }
  let seconds = base;
  if (velocity !== null) {
    const settle = Math.max(
      ...FIELDS.map(name => springSettleTime(params, fields[name].from - fields[name].to, fields[name].velocity, name === 'x' || name === 'y' ? 0.5 : 0.001)),
    );
    seconds = Math.min(Math.max(settle, base), base * 2);
  }
  const sampled = sampleCount(seconds);
  return {
    keyframes: sampleFlight(params, fields, seconds, sampled),
    duration: seconds * 1000 * scale,
    easing: 'linear',
    flight,
    steps: sampled,
    baseProgress: i => 1 - springOffset(params, 1, 0, (i * seconds) / sampled),
  };
}

/** Stop the move of a followed element, the content it carries and the followed elements it animates as content, and forget them all. */
export function stopFlight(item: Item): void {
  item.handle?.cancel();
  for (const handle of item.contentHandles) handle.cancel();
  for (const child of item.projected) stopFlight(child);
  item.handle = null;
  item.flight = null;
  if (item.contentPlan.length > 0) item.contentPlan = [];
  if (item.contentHandles.length > 0) item.contentHandles = [];
  if (item.projected.length > 0) item.projected = [];
  item.projector = null;
}

/**
 * Start the content of a resizing element on the instants of its move, with the parent's own sampled frames: a node's
 * stretch is the parent's scale at the instant over its rest scale, and the progress of its box is the progress of the
 * parent's size between its first and last frames (the progress without velocity when they are equal).
 */
export function startContent(item: Item, move: PlannedMove, playback: Playback, nodes: ReadonlyMap<HTMLElement, Item>): void {
  const { content, frames: [from, to] } = move;
  const { keyframes, steps, baseProgress } = playback;
  if (!content || !baseProgress) return;
  const rest = item.rest;
  const scaleAt = (i: number, name: 'scaleX' | 'scaleY'): number => keyframes[i][name] ?? 1;
  const progressOf = (i: number, name: 'scaleX' | 'scaleY'): number => {
    const start = from[name] ?? 1;
    const end = to[name] ?? 1;
    return start === end ? baseProgress(i) : (scaleAt(i, name) - start) / (end - start);
  };
  const samples = sampleContent(
    content,
    i => ({ x: scaleAt(i, 'scaleX') / rest.sx, y: scaleAt(i, 'scaleY') / rest.sy }),
    i => ({ x: progressOf(i, 'scaleX'), y: progressOf(i, 'scaleY') }),
    steps,
  );
  item.contentPlan = content;
  for (const sample of samples) {
    const handle = waapiProvider.animate({ target: sample.element, keyframes: sample.keyframes, timing: { duration: playback.duration, easing: 'linear' }, commit: false });
    item.contentHandles.push(handle);
    // A followed element in the content moves with this sample: the sample is its move in flight, with no spring of its own.
    const child = nodes.get(sample.element);
    if (!child) continue;
    child.handle = handle;
    child.flight = null;
    child.projector = item;
    item.projected.push(child);
  }
}
