import type { MotionHandle, VisualFrame } from './contract.js';
import { flipFrames, parseOwnTransform, sameBox, toLayoutBox, toVisualBox, type Box, type OwnTransform } from './flip.js';
import type { MotionSpec } from './define-motion.js';
import { motionManifest } from './manifest.js';
import { motionDisabledIn, motionScaleIn, resolveWaapiTiming } from './play.js';
import type { SpringRef } from './motion-spec.js';
import type { MotionRuntime } from './runtime.js';
import { waapiProvider } from './providers/waapi.js';

/** A followed element: its last measures and the move in flight. */
interface Item {
  spec: Readonly<MotionSpec>;
  runtime: MotionRuntime;
  development: boolean;
  layout: Box | undefined; // last measured layout box
  visual: Box | undefined; // last visual box at rest
  rest: OwnTransform; // last rest transform
  handle: MotionHandle | null; // the move in flight
}

/** The followed elements under one root, watched together. */
interface Scope {
  root: HTMLElement;
  items: Map<HTMLElement, Item>;
  observer: MutationObserver;
  resize: ResizeObserver;
  onScroll: () => void;
}

/** A move planned by one flush: its frames, and the style values that decide whether it runs. */
interface PlannedMove {
  element: HTMLElement;
  item: Item;
  frames: [VisualFrame, VisualFrame];
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
  const changed: Array<[HTMLElement, Item, Box]> = [];
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
      changed.push([element, item, carried ? toVisualBox(item.layout, own) : item.visual]);
    } else {
      if (sameBox(visualNow, item.visual)) continue; // it did not move
      changed.push([element, item, item.visual]);
    }
  }
  // 2. Writes: stop only the moves whose destination changed.
  for (const [, item] of changed) {
    item.handle?.cancel();
    item.handle = null;
  }
  // 3. Reads, after the writes above: measure the new rest state of the changed elements, one computed style
  // per element, from which the move's rest transform, disabled flag and scale are all taken.
  const rectsAfterWrites: ReferenceRects = new Map();
  const planned: PlannedMove[] = [];
  for (const [element, item, from] of changed) {
    const style = getComputedStyle(element);
    const disabled = motionDisabledIn(style);
    const scale = motionScaleIn(style);
    measureWith(scope, element, item, style, rectsAfterWrites);
    const frames = item.visual && flipFrames(from, item.visual, item.rest);
    if (frames) planned.push({ element, item, frames, disabled, scale });
  }
  if (planned.length === 0) return;
  // 4. Writes only: no style is read from here on. The scheme and the policy are read once, before the writes.
  const scheme = scope.root.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';
  if (planned[0].item.runtime.policy.reduced) return;
  for (const { element, item, frames, disabled, scale } of planned) {
    if (disabled || scale === 0) continue;
    try {
      const timing = resolveWaapiTiming(element, item.spec.timing ?? DEFAULT_TIMING, scheme);
      if (!timing) continue;
      const duration = timing.duration * scale;
      if (!Number.isFinite(duration) || duration <= 0) continue;
      const handle = waapiProvider.animate({ target: element, keyframes: frames, timing: { duration, easing: timing.easing }, commit: false });
      item.handle = handle;
      void handle.finished.then(() => {
        if (item.handle === handle) item.handle = null;
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
      const current = scopeOf.get(target);
      if (!current) return;
      scopeOf.delete(target);
      current.items.delete(target);
      if (current.items.size === 0) dispose(current);
    },
  };
}
