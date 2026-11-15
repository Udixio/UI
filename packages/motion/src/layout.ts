import type { MotionHandle, VisualFrame } from './contract.js';
import { flipFrames, parseOwnTransform, toLayoutBox, toVisualBox, type Box, type OwnTransform } from './flip.js';
import type { MotionSpec } from './define-motion.js';
import { motionManifest } from './manifest.js';
import { playFrames } from './play.js';
import type { SpringRef } from './motion-spec.js';
import type { MotionRuntime } from './runtime.js';

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
  refreshQueued: boolean;
  onScroll: () => void;
}

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

function visualBoxOf(scope: Scope, element: HTMLElement): Box {
  const r = element.getBoundingClientRect();
  const o = referenceOf(scope, element).getBoundingClientRect();
  return { cx: r.left + r.width / 2 - o.left, cy: r.top + r.height / 2 - o.top, w: r.width, h: r.height };
}

/** Measure an element at rest. */
function measure(scope: Scope, element: HTMLElement, item: Item): void {
  item.rest = ownOf(element);
  item.visual = visualBoxOf(scope, element);
  item.layout = toLayoutBox(item.visual, item.rest);
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
    refreshQueued: false,
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

/** Compare the layout with the cache, and play the difference of every element that moved. */
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
  // Where each element is seen right now. A move in flight is carried from its current place.
  const before = new Map<HTMLElement, Box>();
  for (const [element, item] of scope.items) {
    if (!element.isConnected || !item.layout || !item.visual) continue;
    const carried = item.handle !== null && (item.spec.interrupt ?? 'carry') === 'carry';
    before.set(element, carried ? toVisualBox(item.layout, ownOf(element)) : item.visual);
  }
  // Stop the moves in flight: the elements are back in the new layout.
  for (const item of scope.items.values()) {
    item.handle?.cancel();
    item.handle = null;
  }
  // Measure the new layout and plan the moves.
  const moves: Array<[HTMLElement, Item, [VisualFrame, VisualFrame]]> = [];
  for (const [element, item] of scope.items) {
    if (!element.isConnected) continue;
    measure(scope, element, item);
    const from = before.get(element);
    if (!from || !item.visual) continue;
    const frames = flipFrames(from, item.visual, item.rest);
    if (frames) moves.push([element, item, frames]);
  }
  for (const [element, item, frames] of moves) {
    const handle = playFrames(element, frames, {
      verb: 'layout',
      timing: item.spec.timing ?? DEFAULT_TIMING,
      runtime: item.runtime,
      commit: false,
      development: item.development,
    });
    if (!handle) continue;
    item.handle = handle;
    void handle.finished.then(() => {
      if (item.handle === handle) item.handle = null;
    });
  }
}

/** The layout changed without a mutation (resize, scroll): update the cache, animate nothing. */
function refresh(scope: Scope): void {
  const runtime = scope.items.values().next().value?.runtime;
  if (scope.refreshQueued || !runtime) return;
  scope.refreshQueued = true;
  runtime.frame.read(() => {
    scope.refreshQueued = false;
    for (const [element, item] of scope.items) {
      if (!element.isConnected) continue;
      if (item.handle === null) {
        measure(scope, element, item);
      } else {
        item.layout = toLayoutBox(visualBoxOf(scope, element), ownOf(element));
        item.visual = toVisualBox(item.layout, item.rest);
      }
    }
  });
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
