import type { MotionHandle, VisualFrame } from './contract.js';
import { flipFrames, parseOwnTransform, sameBox, toLayoutBox, toVisualBox, type Box, type OwnTransform } from './flip.js';
import type { MotionSpec } from './define-motion.js';
import { motionManifest } from './manifest.js';
import { motionDisabledIn, motionScaleIn, resolveWaapiTiming } from './play.js';
import type { SpringRef } from './motion-spec.js';
import type { MotionRuntime } from './runtime.js';
import { springOffset, springSettleTime, springVelocity, type SpringParams } from './spring.js';
import { springParams, type MotionScheme } from './tokens.js';
import { waapiProvider } from './providers/waapi.js';

/** The four fields a layout move animates. */
type Field = 'x' | 'y' | 'scaleX' | 'scaleY';
const FIELDS: readonly Field[] = ['x', 'y', 'scaleX', 'scaleY'];
/** A field of a spring flight: where it starts, where it lands, and its velocity at the start, per second of spring time. */
interface FieldMotion {
  from: number;
  to: number;
  velocity: number;
}
/** The velocity of each field at one instant, per second of spring time. */
type Velocity = Record<Field, number>;
/** What a spring flight is doing, so that its velocity can be read at any time. Its real time is spring time × timeScale. */
interface Flight {
  params: SpringParams;
  timeScale: number; // motion scale when the flight started; a scale change between two flights is not carried (rare, accepted)
  fields: Record<Field, FieldMotion>;
}

/** A followed element: its last measures and the move in flight. */
interface Item {
  spec: Readonly<MotionSpec>;
  runtime: MotionRuntime;
  development: boolean;
  layout: Box | undefined; // last measured layout box
  visual: Box | undefined; // last visual box at rest
  rest: OwnTransform; // last rest transform
  handle: MotionHandle | null; // the move in flight
  flight: Flight | null; // the spring the move in flight follows; null at rest or on a curve
}

/** The followed elements under one root, watched together. */
interface Scope {
  root: HTMLElement;
  items: Map<HTMLElement, Item>;
  observer: MutationObserver;
  resize: ResizeObserver;
  onScroll: () => void;
}

/** A move planned by one flush: its frames, the velocity it starts with (null from rest), and the style values that decide whether it runs. */
interface PlannedMove {
  element: HTMLElement;
  item: Item;
  frames: [VisualFrame, VisualFrame];
  velocity: Velocity | null;
  disabled: boolean;
  scale: number;
}

/**
 * The reference rects read by one pass. A cache is only valid between two writes: each pass that reads
 * after a write uses a fresh one.
 */
type ReferenceRects = Map<HTMLElement, DOMRect>;

export interface LayoutTracking {
  /** The move in flight, if any. */
  readonly handle: MotionHandle | null;
  /** Compare now, as the scope's observer would. */
  flush(): void;
  destroy(): void;
}

const scopes = new WeakMap<HTMLElement, Scope>();
const scopeOf = new WeakMap<HTMLElement, Scope>();
/** Mutations of these attributes never move anything: the library writes them itself. */
const IGNORED_ATTRIBUTES = new Set(['style', 'data-presence', 'inert']);
const DEFAULT_TIMING = motionManifest.defaults.layout.timing[0] as SpringRef;

/** Whether a velocity is too small to be seen: under 1 px/s, or 0.01 scale per second. No velocity is negligible. */
function isNegligible(velocity: Velocity | null): boolean {
  return velocity === null || (Math.abs(velocity.x) < 1 && Math.abs(velocity.y) < 1 && Math.abs(velocity.scaleX) < 0.01 && Math.abs(velocity.scaleY) < 0.01);
}

/** The velocity of the spring flight of an item at its current instant; null when no spring is in flight. */
function velocityOf({ flight, handle }: Item): Velocity | null {
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
function restFrames(rest: OwnTransform): [VisualFrame, VisualFrame] {
  const frame = { x: rest.x, y: rest.y, scaleX: rest.sx, scaleY: rest.sy };
  return [frame, frame];
}

/** What a planned move plays on the WAAPI provider, and the spring flight it follows (null for a curve). */
interface Playback {
  keyframes: VisualFrame[];
  duration: number;
  easing: string;
  flight: Flight | null;
}

/**
 * How a planned move plays, or null when its timing cannot be played. A move from rest keeps the token's two
 * keyframes and easing. A move that carries a velocity is sampled from its spring, for the token's settle time
 * bounded to between one and two of its durations, and played with a linear easing. A curve has no spring to carry.
 */
function playbackOf({ element, item, frames, velocity, scale }: PlannedMove, scheme: MotionScheme): Playback | null {
  const timing = item.spec.timing ?? DEFAULT_TIMING;
  const resolved = resolveWaapiTiming(element, timing, scheme);
  if (!resolved) return null;
  const token: Playback = { keyframes: frames, duration: resolved.duration * scale, easing: resolved.easing, flight: null };
  if (typeof timing !== 'string') return token;
  const params = springParams(timing, scheme);
  const fields = fieldMotions(frames, velocity);
  const flight: Flight = { params, timeScale: scale, fields };
  if (velocity === null) return { ...token, flight };
  const base = resolved.duration / 1000;
  const settle = Math.max(
    ...FIELDS.map(name => springSettleTime(params, fields[name].from - fields[name].to, fields[name].velocity, name === 'x' || name === 'y' ? 0.5 : 0.001)),
  );
  const seconds = Math.min(Math.max(settle, base), base * 2);
  const steps = Math.min(Math.max(Math.ceil(seconds * 60), 8), 90);
  return { keyframes: sampleFlight(params, fields, seconds, steps), duration: seconds * 1000 * scale, easing: 'linear', flight };
}

/** The watched ancestor of a followed element: closest `[data-motion-scope]`, else its parent. */
export function layoutScopeOf(target: HTMLElement): HTMLElement {
  return target.parentElement?.closest<HTMLElement>('[data-motion-scope]') ?? target.parentElement ?? target;
}

function ownOf(element: HTMLElement): OwnTransform {
  const style = getComputedStyle(element);
  return parseOwnTransform(style.translate, style.scale);
}

/** The nearest followed ancestor inside the scope, else the scope root. */
function referenceOf(scope: Scope, element: HTMLElement): HTMLElement {
  for (let parent = element.parentElement; parent && parent !== scope.root; parent = parent.parentElement) {
    if (scope.items.has(parent)) return parent;
  }
  return scope.root;
}

function visualBoxOf(scope: Scope, element: HTMLElement, rects: ReferenceRects): Box {
  const r = element.getBoundingClientRect();
  const reference = referenceOf(scope, element);
  let o = rects.get(reference);
  if (!o) {
    o = reference.getBoundingClientRect();
    rects.set(reference, o);
  }
  return { cx: r.left + r.width / 2 - o.left, cy: r.top + r.height / 2 - o.top, w: r.width, h: r.height };
}

/** Measure an element at rest, from the computed style its caller has just read. */
function measureWith(scope: Scope, element: HTMLElement, item: Item, style: CSSStyleDeclaration, rects: ReferenceRects): void {
  item.rest = parseOwnTransform(style.translate, style.scale);
  item.visual = visualBoxOf(scope, element, rects);
  item.layout = toLayoutBox(item.visual, item.rest);
}

/** Measure an element at rest. */
function measure(scope: Scope, element: HTMLElement, item: Item, rects: ReferenceRects = new Map()): void {
  measureWith(scope, element, item, getComputedStyle(element), rects);
}

function relevant(record: MutationRecord): boolean {
  return record.type === 'childList' || !IGNORED_ATTRIBUTES.has(record.attributeName ?? '');
}

function scopeFor(root: HTMLElement): Scope {
  const existing = scopes.get(root);
  if (existing) return existing;
  const scope: Scope = {
    root,
    items: new Map(),
    observer: new MutationObserver(records => {
      if (records.some(relevant)) flush(scope);
    }),
    resize: new ResizeObserver(() => refresh(scope)),
    onScroll: () => refresh(scope),
  };
  scope.observer.observe(root, { childList: true, subtree: true, attributes: true });
  scope.resize.observe(root);
  root.addEventListener('scroll', scope.onScroll, { capture: true, passive: true });
  scopes.set(root, scope);
  return scope;
}

function dispose(scope: Scope): void {
  scope.observer.disconnect();
  scope.resize.disconnect();
  scope.root.removeEventListener('scroll', scope.onScroll, { capture: true });
  scopes.delete(scope.root);
}

/** An element that left the scope follows its new scope, without animating this time. */
function adopt(element: HTMLElement, item: Item): void {
  item.handle?.cancel();
  item.handle = null;
  item.flight = null;
  const scope = scopeFor(layoutScopeOf(element));
  scope.items.set(element, item);
  scopeOf.set(element, scope);
  measure(scope, element, item);
}

/**
 * Compare the layout with the cache, and play the difference of every element that moved.
 * Reads come first in each pass, and a pass never reads after its own writes: the browser then recalculates
 * the style at most once per flush, not once per element.
 */
function flush(scope: Scope): void {
  for (const [element, item] of [...scope.items]) {
    if (element.isConnected && !scope.root.contains(element)) {
      scope.items.delete(element);
      adopt(element, item);
    }
  }
  if (scope.items.size === 0) {
    dispose(scope);
    return;
  }
  // 1. Reads only, nothing is stopped: find the elements whose place really changed. An element at rest
  // needs its rect alone, since its visual box already includes its own transform. Only an element in
  // flight needs its style, to undo the animated transform.
  const rects: ReferenceRects = new Map();
  const changed: Array<[HTMLElement, Item, Box, Velocity | null]> = [];
  for (const [element, item] of scope.items) {
    if (!element.isConnected) continue;
    if (!item.layout || !item.visual) {
      if (item.handle === null) measure(scope, element, item, rects);
      continue;
    }
    const visualNow = visualBoxOf(scope, element, rects);
    if (item.handle !== null) {
      // In flight: the underlying layout box, with the animated transform undone.
      const own = ownOf(element);
      if (sameBox(toLayoutBox(visualNow, own), item.layout)) continue; // its destination did not change: keep flying
      const carried = (item.spec.interrupt ?? 'carry') === 'carry';
      // A carried move keeps the velocity its spring has now, read before the move is cancelled.
      changed.push(carried ? [element, item, toVisualBox(item.layout, own), velocityOf(item)] : [element, item, item.visual, null]);
    } else {
      if (sameBox(visualNow, item.visual)) continue; // it did not move
      changed.push([element, item, item.visual, null]);
    }
  }
  // 2. Writes: stop only the moves whose destination changed.
  for (const [, item] of changed) {
    item.handle?.cancel();
    item.handle = null;
    item.flight = null;
  }
  // 3. Reads, after the writes above: measure the new rest state of the changed elements, one computed style
  // per element, from which the move's rest transform, disabled flag and scale are all taken.
  const rectsAfterWrites: ReferenceRects = new Map();
  const planned: PlannedMove[] = [];
  for (const [element, item, from, velocity] of changed) {
    const style = getComputedStyle(element);
    const disabled = motionDisabledIn(style);
    const scale = motionScaleIn(style);
    measureWith(scope, element, item, style, rectsAfterWrites);
    // A move with a visible velocity still flies when its frames are null: the element is then at its destination.
    const carry = isNegligible(velocity) ? null : velocity;
    const frames = item.visual && (flipFrames(from, item.visual, item.rest) ?? (carry && restFrames(item.rest)));
    if (frames) planned.push({ element, item, frames, velocity: carry, disabled, scale });
  }
  if (planned.length === 0) return;
  // 4. Writes only: no style is read from here on. The scheme and the policy are read once, before the writes.
  const scheme = scope.root.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';
  if (planned[0].item.runtime.policy.reduced) return;
  for (const move of planned) {
    const { element, item, disabled, scale } = move;
    if (disabled || scale === 0) continue;
    try {
      const playback = playbackOf(move, scheme);
      if (!playback || !Number.isFinite(playback.duration) || playback.duration <= 0) continue;
      const handle = waapiProvider.animate({ target: element, keyframes: playback.keyframes, timing: { duration: playback.duration, easing: playback.easing }, commit: false });
      item.handle = handle;
      item.flight = playback.flight;
      void handle.finished.then(() => {
        if (item.handle === handle) {
          item.handle = null;
          item.flight = null;
        }
      });
    } catch (error) {
      if (item.development) console.error('[@udixio/motion] layout move could not animate:', error);
    }
  }
}

/**
 * The layout changed without a mutation (resize, scroll): update the cache now, animate nothing.
 * Synchronous on purpose: a ResizeObserver callback runs right after layout and a scroll event once per
 * frame, so a change made just after either is flushed against a fresh cache.
 */
function refresh(scope: Scope): void {
  const rects: ReferenceRects = new Map();
  for (const [element, item] of scope.items) {
    if (!element.isConnected) continue;
    if (item.handle === null) {
      measure(scope, element, item, rects);
    } else {
      item.layout = toLayoutBox(visualBoxOf(scope, element, rects), ownOf(element));
      item.visual = toVisualBox(item.layout, item.rest);
    }
  }
}

/** Start following `target`: it moves to its new place when its scope changes. */
export function trackLayout(target: HTMLElement, spec: Readonly<MotionSpec>, options: { runtime: MotionRuntime; development?: boolean }): LayoutTracking {
  const item: Item = {
    spec,
    runtime: options.runtime,
    development: options.development ?? false,
    layout: undefined,
    visual: undefined,
    rest: { x: 0, y: 0, sx: 1, sy: 1 },
    handle: null,
    flight: null,
  };
  const scope = scopeFor(layoutScopeOf(target));
  scope.items.set(target, item);
  scopeOf.set(target, scope);
  measure(scope, target, item);
  return {
    get handle() {
      return item.handle;
    },
    flush() {
      const current = scopeOf.get(target);
      if (current) flush(current);
    },
    destroy() {
      item.handle?.cancel();
      item.handle = null;
      item.flight = null;
      const current = scopeOf.get(target);
      if (!current) return;
      scopeOf.delete(target);
      current.items.delete(target);
      if (current.items.size === 0) dispose(current);
    },
  };
}
