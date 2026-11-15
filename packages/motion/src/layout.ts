import type { MotionHandle, VisualFrame } from './contract.js';
import { flipFrames, parseOwnTransform, sameBox, toLayoutBox, toVisualBox, type Box, type OwnTransform } from './flip.js';
import type { MotionSpec } from './define-motion.js';
import { motionManifest } from './manifest.js';
import { motionDisabledIn, motionScaleIn, resolveWaapiTiming } from './play.js';
import { easingOf, liveContentBoxes, sampleContent, type ContentPlan, type Stretch } from './project.js';
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

/** A node of the content of a followed element, measured at rest: its box is relative to the centre of its parent. */
interface ContentNode {
  element: HTMLElement;
  kind: 'box' | 'text';
  box: Box;
  children: ContentNode[];
}

/** A followed element: its last measures and the move in flight, with the content it carries. */
interface Item {
  spec: Readonly<MotionSpec>;
  runtime: MotionRuntime;
  development: boolean;
  layout: Box | undefined; // last measured layout box
  visual: Box | undefined; // last visual box at rest
  rest: OwnTransform; // last rest transform
  handle: MotionHandle | null; // the move in flight
  flight: Flight | null; // the spring the move in flight follows; null at rest or on a curve
  content: ContentNode[]; // the content, measured at rest
  contentPlan: ContentPlan[]; // the content that the move in flight carries; empty when none
  contentHandles: MotionHandle[]; // the moves of the content, which run with the move in flight
}

/** The followed elements under one root, watched together. */
interface Scope {
  root: HTMLElement;
  items: Map<HTMLElement, Item>;
  observer: MutationObserver;
  resize: ResizeObserver;
  onScroll: () => void;
}

/** A move planned by one flush: its frames, the velocity it starts with (null from rest), the style values that decide whether it runs, and its content to project when the size changes. */
interface PlannedMove {
  element: HTMLElement;
  item: Item;
  frames: [VisualFrame, VisualFrame];
  velocity: Velocity | null;
  disabled: boolean;
  scale: number;
  content: ContentPlan[] | null;
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
/** Content nodes measured per followed element: the nodes beyond this budget are neither measured nor animated. */
const CONTENT_BUDGET = 24;
/** Deepest level of content: the children of a box are measured down to this level. */
const CONTENT_DEPTH = 3;

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
function restFrames(rest: OwnTransform): [VisualFrame, VisualFrame] {
  const frame = { x: rest.x, y: rest.y, scaleX: rest.sx, scaleY: rest.sy };
  return [frame, frame];
}

/** Whether a move changes the size of its element: a scale ratio off one by more than 1 %, on one axis at least. */
function resizes([from, to]: [VisualFrame, VisualFrame]): boolean {
  return Math.abs((from.scaleX ?? 1) / (to.scaleX ?? 1) - 1) > 0.01 || Math.abs((from.scaleY ?? 1) / (to.scaleY ?? 1) - 1) > 0.01;
}

/** Whether a carried velocity moves the scale of its element, which a content plan must then follow. */
function scalesMoving(velocity: Velocity | null): boolean {
  return velocity !== null && (Math.abs(velocity.scaleX) >= 0.01 || Math.abs(velocity.scaleY) >= 0.01);
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

/**
 * What a planned move plays on the WAAPI provider, and the spring flight it follows (null for a curve). `steps` are
 * the samples of a sampled move, and `baseProgress` the progress of its move without velocity at each of them.
 */
interface Playback {
  keyframes: VisualFrame[];
  duration: number;
  easing: string;
  flight: Flight | null;
  steps: number;
  baseProgress: ((i: number) => number) | null; // null when the move is not sampled
}

/**
 * How a planned move plays, or null when its timing cannot be played. A move from rest keeps the token's two
 * keyframes and easing, unless a content plan follows it. A move that carries a velocity, or that a content plan
 * follows, is sampled and played with a linear easing, over the same duration: from its spring (over the token's
 * duration from rest, over its settle time bounded to one or two durations with a velocity), or from its curve when
 * the easing can be evaluated. A curve whose easing cannot be evaluated keeps its two keyframes, with no content plan.
 */
function playbackOf({ element, item, frames, velocity, scale, content }: PlannedMove, scheme: MotionScheme): Playback | null {
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
  const params = springParams(timing, scheme);
  const fields = fieldMotions(frames, velocity);
  const flight: Flight = { params, timeScale: scale, fields };
  if (velocity === null && content === null) return { ...token, flight };
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

/** The watched ancestor of a followed element: closest `[data-motion-scope]`, else its parent. */
export function layoutScopeOf(target: HTMLElement): HTMLElement {
  return target.parentElement?.closest<HTMLElement>('[data-motion-scope]') ?? target.parentElement ?? target;
}

function ownOf(element: HTMLElement): OwnTransform {
  const style = getComputedStyle(element);
  return parseOwnTransform(style.translate, style.scale);
}

/** Screen pixels per local pixel inside `element`, per axis: its rect against its layout size. */
function unitOf(element: HTMLElement, rect: DOMRect): Stretch {
  return {
    x: element.offsetWidth ? rect.width / element.offsetWidth : 1,
    y: element.offsetHeight ? rect.height / element.offsetHeight : 1,
  };
}

/** Where the content of a running move is now, when a carried move starts from it: null when there is no running content. */
function liveBoxesOf(item: Item, own: OwnTransform): Map<HTMLElement, Box> | null {
  if (item.contentPlan.length === 0) return null;
  return liveContentBoxes(item.contentPlan, { x: own.sx / item.rest.sx, y: own.sy / item.rest.sy }, ownOf);
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

/** Whether an element has a direct text node with something other than whitespace. */
function hasText(element: HTMLElement): boolean {
  return Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
}

/**
 * The content nodes under `parent`, in DOM order (reads only). A followed element is not content, nor is an
 * element with no size. A box's children are measured down to `CONTENT_DEPTH`; the budget is shared by the whole tree.
 */
function measureContent(scope: Scope, parent: HTMLElement, parentRect: DOMRect, depth: number, budget: { left: number }): ContentNode[] {
  const nodes: ContentNode[] = [];
  for (const child of Array.from(parent.children)) {
    if (budget.left <= 0) break;
    if (!(child instanceof HTMLElement) || scope.items.has(child)) continue;
    const r = child.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    budget.left--;
    const kind = hasText(child) ? 'text' : 'box';
    nodes.push({
      element: child,
      kind,
      box: {
        cx: r.left + r.width / 2 - (parentRect.left + parentRect.width / 2),
        cy: r.top + r.height / 2 - (parentRect.top + parentRect.height / 2),
        w: r.width,
        h: r.height,
      },
      children: kind === 'box' && depth < CONTENT_DEPTH ? measureContent(scope, child, r, depth + 1, budget) : [],
    });
  }
  return nodes;
}

/** The content tree of an element at rest (reads only). */
function contentOf(scope: Scope, element: HTMLElement): ContentNode[] {
  return measureContent(scope, element, element.getBoundingClientRect(), 1, { left: CONTENT_BUDGET });
}

/** Measure an element at rest, from the computed style its caller has just read. */
function measureWith(scope: Scope, element: HTMLElement, item: Item, style: CSSStyleDeclaration, rects: ReferenceRects, content = true): void {
  item.rest = parseOwnTransform(style.translate, style.scale);
  item.visual = visualBoxOf(scope, element, rects);
  item.layout = toLayoutBox(item.visual, item.rest);
  if (content) item.content = contentOf(scope, element);
}

/** Measure an element at rest. Its content is measured too, unless `content` is false. */
function measure(scope: Scope, element: HTMLElement, item: Item, rects: ReferenceRects = new Map(), content = true): void {
  measureWith(scope, element, item, getComputedStyle(element), rects, content);
}

function relevant(record: MutationRecord): boolean {
  return record.type === 'childList' || record.type === 'characterData' || !IGNORED_ATTRIBUTES.has(record.attributeName ?? '');
}

function scopeFor(root: HTMLElement): Scope {
  const existing = scopes.get(root);
  if (existing) return existing;
  const scope: Scope = {
    root,
    items: new Map(),
    observer: new MutationObserver(records => {
      const changes = records.filter(relevant);
      if (changes.length > 0) flush(scope, changes);
    }),
    resize: new ResizeObserver(() => refresh(scope, true)),
    onScroll: () => refresh(scope, false),
  };
  scope.observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
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

/** Stop the move of a followed element and the content it carries, and forget both. */
function stopFlight(item: Item): void {
  item.handle?.cancel();
  for (const handle of item.contentHandles) handle.cancel();
  item.handle = null;
  item.flight = null;
  item.contentPlan = [];
  item.contentHandles = [];
}

/** An element that left the scope follows its new scope, without animating this time. */
function adopt(element: HTMLElement, item: Item): void {
  stopFlight(item);
  const scope = scopeFor(layoutScopeOf(element));
  scope.items.set(element, item);
  scopeOf.set(element, scope);
  measure(scope, element, item);
}

/** The followed elements that a mutation may have changed the content of: the nearest followed element containing each changed node. */
function dirtyItemsOf(scope: Scope, records: readonly MutationRecord[]): Set<Item> {
  const dirty = new Set<Item>();
  for (const record of records) {
    let node: Element | null = record.target instanceof Element ? record.target : record.target.parentElement;
    for (; node; node = node.parentElement) {
      const item = node instanceof HTMLElement ? scope.items.get(node) : undefined;
      if (item) {
        dirty.add(item);
        break;
      }
      if (node === scope.root) break;
    }
  }
  return dirty;
}

/**
 * The plan of the content of a resizing element (reads only): each node's box before the move, from the live boxes
 * of a carried move when there are some and else from the cache, and after it; its rest transform; and the unit of its parent.
 */
function contentPlanOf(cache: readonly ContentNode[], after: readonly ContentNode[], parent: HTMLElement, live: Map<HTMLElement, Box> | null): ContentPlan[] {
  const previous = new Map<HTMLElement, Box>();
  const flatten = (nodes: readonly ContentNode[]): void => {
    for (const node of nodes) {
      previous.set(node.element, node.box);
      flatten(node.children);
    }
  };
  flatten(cache);
  for (const [element, box] of live ?? []) previous.set(element, box);
  const plan = (nodes: readonly ContentNode[], unit: Stretch): ContentPlan[] =>
    nodes.map(node => ({
      element: node.element,
      kind: node.kind,
      before: previous.get(node.element) ?? node.box,
      after: node.box,
      rest: ownOf(node.element),
      unit,
      children: node.children.length > 0 ? plan(node.children, unitOf(node.element, node.element.getBoundingClientRect())) : [],
    }));
  return plan(after, unitOf(parent, parent.getBoundingClientRect()));
}

/**
 * Compare the layout with the cache, and play the difference of every element that moved.
 * Reads come first in each pass, and a pass never reads after its own writes: the browser then recalculates
 * the style at most once per flush, not once per element. `records` are the mutations that caused the flush.
 */
function flush(scope: Scope, records: readonly MutationRecord[] = []): void {
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
  // flight needs its style, to undo the animated transform. An element at rest whose content may have
  // changed gets its content measured again.
  const rects: ReferenceRects = new Map();
  const dirty = dirtyItemsOf(scope, records);
  const changed: Array<[HTMLElement, Item, Box, Velocity | null, Map<HTMLElement, Box> | null]> = [];
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
      // A carried move also starts its content from where it is now, read before anything is cancelled.
      changed.push(carried ? [element, item, toVisualBox(item.layout, own), velocityOf(item), liveBoxesOf(item, own)] : [element, item, item.visual, null, null]);
    } else if (sameBox(visualNow, item.visual)) {
      // It did not move, but its content may have changed.
      if (dirty.has(item)) item.content = contentOf(scope, element);
    } else {
      changed.push([element, item, item.visual, null, null]);
    }
  }
  // 2. Writes: stop only the moves whose destination changed.
  for (const [, item] of changed) stopFlight(item);
  // 3. Reads, after the writes above: measure the new rest state of the changed elements, one computed style
  // per element, from which the move's rest transform, disabled flag and scale are all taken. The content is
  // planned against the cache as it was before this measure.
  const rectsAfterWrites: ReferenceRects = new Map();
  const planned: PlannedMove[] = [];
  for (const [element, item, from, velocity, live] of changed) {
    const contentBefore = item.content;
    const style = getComputedStyle(element);
    const disabled = motionDisabledIn(style);
    const scale = motionScaleIn(style);
    measureWith(scope, element, item, style, rectsAfterWrites);
    // A move with a visible velocity still flies when its frames are null: the element is then at its destination.
    const carry = isNegligible(velocity) ? null : velocity;
    const frames = item.visual && (flipFrames(from, item.visual, item.rest) ?? (carry && restFrames(item.rest)));
    if (!frames) continue;
    // Its content follows a move that resizes it, or a scale that the velocity still carries, even at the same size.
    const follows = resizes(frames) || scalesMoving(carry);
    const content = follows && item.content.length > 0 ? contentPlanOf(contentBefore, item.content, element, live) : null;
    planned.push({ element, item, frames, velocity: carry, disabled, scale, content });
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
        if (item.handle === handle) stopFlight(item);
      });
      startContent(item, move, playback);
    } catch (error) {
      if (item.development) console.error('[@udixio/motion] layout move could not animate:', error);
    }
  }
}

/**
 * Start the content of a resizing element on the instants of its move, with the parent's own sampled frames: a node's
 * stretch is the parent's scale at the instant over its rest scale, and the progress of its box is the progress of the
 * parent's size between its first and last frames (the progress without velocity when they are equal).
 */
function startContent(item: Item, move: PlannedMove, playback: Playback): void {
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
    item.contentHandles.push(waapiProvider.animate({ target: sample.element, keyframes: sample.keyframes, timing: { duration: playback.duration, easing: 'linear' }, commit: false }));
  }
}

/**
 * The layout changed without a mutation (resize, scroll): update the cache now, animate nothing.
 * Synchronous on purpose: a ResizeObserver callback runs right after layout and a scroll event once per
 * frame, so a change made just after either is flushed against a fresh cache. The content is measured on a
 * resize only: a scroll moves the element, not the content relative to it.
 */
function refresh(scope: Scope, content: boolean): void {
  const rects: ReferenceRects = new Map();
  for (const [element, item] of scope.items) {
    if (!element.isConnected) continue;
    if (item.handle === null) {
      measure(scope, element, item, rects, content);
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
    content: [],
    contentPlan: [],
    contentHandles: [],
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
      stopFlight(item);
      const current = scopeOf.get(target);
      if (!current) return;
      scopeOf.delete(target);
      current.items.delete(target);
      if (current.items.size === 0) dispose(current);
    },
  };
}
