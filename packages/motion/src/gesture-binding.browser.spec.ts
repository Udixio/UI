import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { motion, getMotion, type MotionBinding } from './bind.js';
import { connectMotion } from './connect.js';
import { defineGesture } from './gesture.js';
import { gesture, getGesture, type GestureBinding } from './gesture-binding.js';
import { loadLayoutEngine } from './layout-loader.js';
import { reflow } from './presets.js';

// The layout motions of the reorder test follow at once: the engine is loaded before the first test.
await loadLayoutEngine();

defineGesture('gb-card', { type: 'drag', alternative: 'arrows' });
defineGesture('gb-card-free', { type: 'drag', bounds: 'none', alternative: 'arrows' });
defineGesture('gb-dismiss', { type: 'swipe', alternative: 'action' });
defineGesture('gb-dismiss-remove', { type: 'swipe', afterFlyOut: 'remove' });
defineGesture('gb-row', { type: 'reorder', alternative: 'grab' });
defineGesture('gb-row-x', { type: 'reorder', axis: 'x', alternative: 'grab' });

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** Frames until `done` holds, at most `cap` of them; returns whether it holds. */
async function until(done: () => boolean, cap = 240): Promise<boolean> {
  for (let i = 0; i < cap && !done(); i++) await nextFrame();
  return done();
}

/** Frames until the offset has not changed for three frames, and at most three seconds; returns whether it came to rest. */
async function settle(binding: GestureBinding): Promise<boolean> {
  const started = Date.now();
  const at = () => `${binding.offset.x},${binding.offset.y}`;
  let last = at();
  let still = 0;
  while (still < 3 && Date.now() - started < 3000) {
    await nextFrame();
    const now = at();
    still = now === last ? still + 1 : 0;
    last = now;
  }
  return still >= 3;
}

// The binding reads its clock through performance.now(): each test sets the time of the events it dispatches.
let clock = 1000;
let page: HTMLElement;
let bindings: GestureBinding[];
let layouts: MotionBinding[];

beforeEach(() => {
  clock = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  page = document.createElement('div');
  document.body.append(page);
  bindings = [];
  layouts = [];
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  for (const layout of layouts) layout.destroy();
  page.remove();
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

/** Bind a gesture on an element, and remember the binding so that cleanup destroys it. */
function bind(el: HTMLElement, name: string): GestureBinding {
  const binding = gesture(el, name);
  bindings.push(binding);
  return binding;
}

/** A parent of `width` by `height` px, placed in the page. */
function stage(width: number, height: number): HTMLElement {
  const frame = document.createElement('div');
  frame.style.cssText = `position:relative;width:${width}px;height:${height}px`;
  page.append(frame);
  return frame;
}

/** The element of a gesture: a box of `width` by `height` px. */
function card(parent: HTMLElement, width = 100, height = 100): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `width:${width}px;height:${height}px;background:#888`;
  parent.append(el);
  return el;
}

/** A column of `count` items, each 40 px high, each bound to the reorder gesture. */
function column(count: number): { list: HTMLElement; items: HTMLElement[] } {
  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;width:200px';
  page.append(list);
  const items = Array.from({ length: count }, (_, index) => {
    const item = document.createElement('div');
    item.style.height = '40px';
    item.textContent = `Item ${index + 1}`;
    list.append(item);
    bind(item, 'gb-row');
    return item;
  });
  return { list, items };
}

function pointer(el: Element, type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel', x: number, y: number): void {
  const held = type === 'pointerdown' || type === 'pointermove';
  el.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      isPrimary: true,
      pointerType: 'mouse',
      button: 0,
      buttons: held ? 1 : 0,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function key(el: Element, name: string, init: KeyboardEventInit = {}): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }));
}

/** The details of the events of `type` that reach the element, in order. */
function listen<T>(el: Element, type: string): T[] {
  const seen: T[] = [];
  el.addEventListener(type, event => {
    seen.push((event as CustomEvent<T>).detail);
  });
  return seen;
}

/** The text of the shared live region, once a reorder is bound. */
const announced = (): string | null => document.querySelector('[data-udx-motion-live]')?.textContent ?? null;

/** Grab the card at its left and throw it: a slow move, a fast one (100 px in 50 ms), then the release. */
function throwCard(el: HTMLElement): void {
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 50, top + 50);
  clock = 1250;
  pointer(el, 'pointermove', left + 150, top + 50);
  pointer(el, 'pointerup', left + 150, top + 50);
}

it('names its type on the binding: drag, swipe or reorder', () => {
  expect(bind(card(stage(800, 300)), 'gb-card').type).toBe('drag');
});

it('follows the pointer, then glides on with its momentum and settles inside its parent', async () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  const ends = listen<{ x: number; y: number }>(el, 'motion-dragend');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 50, top + 50);
  expect(binding.offset).toEqual({ x: 40, y: 0 });
  expect(el.hasAttribute('data-motion-dragging')).toBe(true);
  clock = 1250;
  pointer(el, 'pointermove', left + 150, top + 50);
  expect(binding.offset.x).toBe(140);
  pointer(el, 'pointerup', left + 150, top + 50);
  expect(el.hasAttribute('data-motion-dragging')).toBe(false);
  expect(ends).toEqual([]);
  expect(await settle(binding)).toBe(true);
  // The release velocity is 2000 px/s: the drag is thrown 400 px on, to 540, inside the 700 px of its parent.
  expect(binding.offset.x).toBeCloseTo(540, 6);
  expect(binding.offset.y).toBe(0);
  expect(binding.offset.x).toBeLessThanOrEqual(700);
  expect(ends).toHaveLength(1);
  expect(ends[0].x).toBeCloseTo(540, 6);
  expect(binding.velocity.source).toBe('estimated');
  expect(binding.velocity.x).toBeCloseTo(2000, 6);
  // The touch-action is set when the gesture is bound, and given back only on destroy: it stays while the element is bound.
  expect(el.style.touchAction).toBe('none');
  expect(el.style.userSelect).toBe('');
});

it('stops a glide where it is when the pointer grabs it again, with no jump', async () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  throwCard(el);
  expect(await until(() => binding.offset.x !== 140)).toBe(true);
  const before = binding.offset.x;
  const { left, top } = el.getBoundingClientRect();
  clock += 20;
  pointer(el, 'pointerdown', left + 10, top + 50);
  expect(binding.offset.x).toBe(before);
  for (let i = 0; i < 6; i++) await nextFrame();
  expect(binding.offset.x).toBe(before);
  pointer(el, 'pointerup', left + 10, top + 50);
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBe(before);
});

it('releases a drag that the browser cancels, and removes its dragging state', async () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  const ends = listen<{ x: number; y: number }>(el, 'motion-dragend');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 70, top + 50);
  pointer(el, 'pointercancel', left + 70, top + 50);
  expect(el.hasAttribute('data-motion-dragging')).toBe(false);
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBe(60);
  expect(ends).toEqual([{ x: 60, y: 0 }]);
});

it('ends a drag when the pointer is released outside the element', async () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  const ends = listen<{ x: number; y: number }>(el, 'motion-dragend');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 60, top + 50);
  // The pointer has left the element, and is released on the page: the drag ends there.
  document.body.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, isPrimary: true, pointerType: 'mouse', bubbles: true }));
  expect(el.hasAttribute('data-motion-dragging')).toBe(false);
  expect(await settle(binding)).toBe(true);
  expect(ends).toEqual([{ x: 50, y: 0 }]);
});

it('keeps a reorder going when the browser drops the pointer capture of a moved item', () => {
  const { list, items } = column(5);
  const second = items[1];
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const start = second.getBoundingClientRect();
  clock = 1000;
  pointer(second, 'pointerdown', start.left + 10, start.top + 20);
  clock = 1100;
  pointer(second, 'pointermove', start.left + 10, start.top + 70);
  expect(moves).toEqual([{ from: 1, to: 2 }]);
  // Moving an item in the DOM can drop its pointer capture: the drag goes on, and the item passes the next neighbour too.
  second.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true }));
  clock = 1150;
  pointer(second, 'pointermove', start.left + 10, start.top + 115);
  expect(moves).toEqual([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ]);
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 3', 'Item 4', 'Item 2', 'Item 5']);
  pointer(second, 'pointerup', start.left + 10, start.top + 115);
});

it('clamps a drag to its parent, and a release does not carry it past the edge', async () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  pointer(el, 'pointermove', left + 900, top + 50);
  expect(binding.offset.x).toBe(700);
  pointer(el, 'pointerup', left + 900, top + 50);
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBe(700);
});

it('does not clamp a drag whose bounds are none', () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card-free');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  pointer(el, 'pointermove', left + 900, top + 50);
  // The grab was 10 px into the element, so the pointer moved 890 px: nothing clamps it.
  expect(binding.offset.x).toBe(890);
  pointer(el, 'pointerup', left + 900, top + 50);
});

it('estimates the release velocity from the last 100 ms of the pointer', () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 50, top + 50);
  clock = 1250;
  pointer(el, 'pointermove', left + 150, top + 50);
  expect(binding.velocity.source).toBe('estimated');
  expect(binding.velocity.x).toBeCloseTo(2000, 6);
  expect(binding.velocity.y).toBe(0);
  pointer(el, 'pointerup', left + 150, top + 50);
});

it('throws a swipe out past 40 % of its size: motion-swipe, then it flies out and fades to nothing', async () => {
  const el = card(stage(800, 200), 200, 100);
  const binding = bind(el, 'gb-dismiss');
  const swipes = listen<{ direction: string }>(el, 'motion-swipe');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 100, top + 80);
  // Its axis is x: the 30 px down are ignored. 90 px is 45 % of the 200 px card.
  expect(binding.offset).toEqual({ x: 90, y: 0 });
  pointer(el, 'pointerup', left + 100, top + 80);
  expect(swipes).toEqual([{ direction: 'end' }]);
  expect(await settle(binding)).toBe(true);
  // The card flies out to its size and 32 px more.
  expect(binding.offset.x).toBeCloseTo(232, 6);
  expect(el.getAttribute('aria-hidden')).toBe('true');
  expect(getComputedStyle(el).opacity).toBe('0');
});

it('keeps a swiped element in the DOM by default, hidden from assistive technology once it has flown out', async () => {
  const el = card(stage(800, 200), 200, 100);
  const binding = bind(el, 'gb-dismiss');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 100, top + 50);
  pointer(el, 'pointerup', left + 100, top + 50);
  expect(await settle(binding)).toBe(true);
  expect(el.isConnected).toBe(true);
  expect(el.getAttribute('aria-hidden')).toBe('true');
});

it('removes a swiped element from the DOM once it has flown out, with afterFlyOut remove', async () => {
  const frame = stage(800, 200);
  const el = card(frame, 200, 100);
  const binding = bind(el, 'gb-dismiss-remove');
  const swipes = listen<{ direction: string }>(el, 'motion-swipe');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 100, top + 50);
  pointer(el, 'pointerup', left + 100, top + 50);
  expect(swipes).toEqual([{ direction: 'end' }]);
  expect(await settle(binding)).toBe(true);
  expect(el.isConnected).toBe(false);
  expect(frame.children).toHaveLength(0);
});

it('keeps a remove swipe in the DOM when a listener cancels it, and springs it back', async () => {
  const el = card(stage(800, 200), 200, 100);
  const binding = bind(el, 'gb-dismiss-remove');
  el.addEventListener('motion-swipe', event => event.preventDefault());
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 100, top + 50);
  pointer(el, 'pointerup', left + 100, top + 50);
  expect(await settle(binding)).toBe(true);
  expect(el.isConnected).toBe(true);
  expect(binding.offset.x).toBe(0);
});

it('resets a swiped element: it is visible again at once, and comes back to offset 0', async () => {
  const el = card(stage(800, 200), 200, 100);
  const binding = bind(el, 'gb-dismiss');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 100, top + 50);
  pointer(el, 'pointerup', left + 100, top + 50);
  expect(await settle(binding)).toBe(true);
  binding.reset();
  expect(el.hasAttribute('aria-hidden')).toBe(false);
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBe(0);
  expect(getComputedStyle(el).opacity).toBe('1');
});

it('springs a slow swipe of 20 % back to rest, without motion-swipe', async () => {
  const el = card(stage(800, 200), 200, 100);
  const binding = bind(el, 'gb-dismiss');
  const swipes = listen(el, 'motion-swipe');
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1500;
  pointer(el, 'pointermove', left + 50, top + 50);
  pointer(el, 'pointerup', left + 50, top + 50);
  expect(swipes).toEqual([]);
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBe(0);
  expect(el.hasAttribute('aria-hidden')).toBe(false);
  expect(el.style.opacity).toBe('');
});

it('lets a listener cancel the swipe, and then springs the element back', async () => {
  const el = card(stage(800, 200), 200, 100);
  const binding = bind(el, 'gb-dismiss');
  el.addEventListener('motion-swipe', event => event.preventDefault());
  const { left, top } = el.getBoundingClientRect();
  clock = 1000;
  pointer(el, 'pointerdown', left + 10, top + 50);
  clock = 1200;
  pointer(el, 'pointermove', left + 100, top + 50);
  pointer(el, 'pointerup', left + 100, top + 50);
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBe(0);
  expect(el.hasAttribute('aria-hidden')).toBe(false);
});

it('swipes a focused element away with Delete', async () => {
  const el = card(stage(800, 200), 200, 100);
  const binding = bind(el, 'gb-dismiss');
  const swipes = listen(el, 'motion-swipe');
  el.focus();
  key(el, 'Delete');
  expect(swipes).toEqual([{ direction: 'end' }]);
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBeCloseTo(232, 6);
  expect(el.getAttribute('aria-hidden')).toBe('true');
});

it('moves a dragged item past the middle of its neighbour, and keeps it under the pointer', async () => {
  const { list, items } = column(5);
  const second = items[1];
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const start = second.getBoundingClientRect();
  clock = 1000;
  pointer(second, 'pointerdown', start.left + 10, start.top + 20);
  clock = 1100;
  pointer(second, 'pointermove', start.left + 10, start.top + 70);
  expect(moves).toEqual([{ from: 1, to: 2 }]);
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  // The pointer moved 50 px: the item is 50 px below where it started, though its place in the list changed.
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 50))).toBeLessThanOrEqual(1);
  pointer(second, 'pointerup', start.left + 10, start.top + 70);
  expect(await settle(getGesture(second) as GestureBinding)).toBe(true);
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 40))).toBeLessThanOrEqual(1);
});

it('leaves the order alone when the move is prevented, and does not ask again while it stays past the middle', async () => {
  const { list, items } = column(5);
  const second = items[1];
  list.addEventListener('motion-reorder', event => event.preventDefault());
  const moves = listen(list, 'motion-reorder');
  const start = second.getBoundingClientRect();
  clock = 1000;
  pointer(second, 'pointerdown', start.left + 10, start.top + 20);
  clock = 1100;
  pointer(second, 'pointermove', start.left + 10, start.top + 70);
  clock = 1150;
  pointer(second, 'pointermove', start.left + 10, start.top + 75);
  expect(moves).toHaveLength(1);
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 55))).toBeLessThanOrEqual(1);
  pointer(second, 'pointerup', start.left + 10, start.top + 75);
  expect(await settle(getGesture(second) as GestureBinding)).toBe(true);
  expect(Math.abs(second.getBoundingClientRect().top - start.top)).toBeLessThanOrEqual(1);
});

it('reorders with the keyboard: Space grabs, arrows move, Escape cancels, Space drops, and each step is announced', () => {
  const { list, items } = column(5);
  const second = items[1];
  const order = () => Array.from(list.children).map(child => child.textContent);
  second.focus();
  key(second, ' ');
  expect(announced()).toBe('Grabbed. Position 2 of 5.');
  key(second, 'ArrowDown');
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  expect(announced()).toBe('Moved. Position 3 of 5.');
  expect(document.activeElement).toBe(second);
  key(second, 'Escape');
  expect(order()).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
  expect(announced()).toBe('Cancelled. Position 2 of 5.');
  key(second, ' ');
  expect(announced()).toBe('Grabbed. Position 2 of 5.');
  key(second, 'ArrowDown');
  key(second, ' ');
  expect(announced()).toBe('Dropped. Position 3 of 5.');
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  expect(second.hasAttribute('data-motion-dragging')).toBe(false);
});

/** A task after the current one: where a framework's scheduler renders a state change made in an event. */
const nextTask = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * A list rendered by a framework: each reorder step is prevented, and the state moves the item in a later task, as React,
 * Angular and Svelte render a state change. The render moves the stepped item itself, as a keyed list does.
 */
function renderedByState(list: HTMLElement): void {
  list.addEventListener('motion-reorder', event => {
    event.preventDefault();
    const { from, to } = (event as CustomEvent<{ from: number; to: number }>).detail;
    setTimeout(() => {
      const children = [...list.children];
      list.insertBefore(children[from], to > from ? (children[to].nextSibling ?? null) : children[to]);
    }, 0);
  });
}

/**
 * A list rendered from its state in batches: each reorder step is prevented and applied to the state at once, and the DOM
 * follows the state in one later task, as a framework renders the state changes made before it.
 */
function renderedInBatches(list: HTMLElement): void {
  const state = Array.from(list.children);
  let render: ReturnType<typeof setTimeout> | undefined;
  list.addEventListener('motion-reorder', event => {
    event.preventDefault();
    const { from, to } = (event as CustomEvent<{ from: number; to: number }>).detail;
    state.splice(to, 0, ...state.splice(from, 1));
    render ??= setTimeout(() => {
      render = undefined;
      for (const child of state) list.append(child);
    }, 0);
  });
}

/**
 * A list rendered by a framework, with its render late: each reorder step is prevented and applied to the state at once, and
 * the DOM follows the state a microtask, a task, or 30 ms later, as a framework's scheduler renders it.
 */
function renderedWhen(list: HTMLElement, when: 'microtask' | 'task' | 'late'): void {
  const state = Array.from(list.children);
  let pending = false;
  list.addEventListener('motion-reorder', event => {
    event.preventDefault();
    const { from, to } = (event as CustomEvent<{ from: number; to: number }>).detail;
    state.splice(to, 0, ...state.splice(from, 1));
    if (pending) return;
    pending = true;
    const render = () => {
      pending = false;
      for (const child of state) list.append(child);
    };
    if (when === 'microtask') queueMicrotask(render);
    else setTimeout(render, when === 'task' ? 0 : 30);
  });
}

it('moves an item rendered by state one place past one neighbour, and keeps it under the pointer once rendered', async () => {
  const { list, items } = column(5);
  const second = items[1];
  renderedByState(list);
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const order = () => Array.from(list.children).map(child => child.textContent);
  const start = second.getBoundingClientRect();
  clock = 1000;
  pointer(second, 'pointerdown', start.left + 10, start.top + 20);
  clock = 1100;
  pointer(second, 'pointermove', start.left + 10, start.top + 70);
  await nextTask();
  // Rendered in its new slot, the item is re-based there: it is still drawn 50 px below where it started, under the pointer.
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 50))).toBeLessThanOrEqual(1);
  clock = 1150;
  pointer(second, 'pointermove', start.left + 10, start.top + 75);
  await nextTask();
  expect(moves).toEqual([{ from: 1, to: 2 }]);
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 55))).toBeLessThanOrEqual(1);
  pointer(second, 'pointerup', start.left + 10, start.top + 75);
  expect(await settle(getGesture(second) as GestureBinding)).toBe(true);
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 40))).toBeLessThanOrEqual(1);
});

it('moves an item rendered by state one place when the pointer moves on before the render', async () => {
  const { list, items } = column(5);
  const second = items[1];
  renderedByState(list);
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const start = second.getBoundingClientRect();
  clock = 1000;
  pointer(second, 'pointerdown', start.left + 10, start.top + 20);
  clock = 1100;
  pointer(second, 'pointermove', start.left + 10, start.top + 70);
  clock = 1120;
  pointer(second, 'pointermove', start.left + 10, start.top + 75);
  await nextTask();
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 55))).toBeLessThanOrEqual(1);
  clock = 1150;
  pointer(second, 'pointermove', start.left + 10, start.top + 78);
  await nextTask();
  expect(moves).toEqual([{ from: 1, to: 2 }]);
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 58))).toBeLessThanOrEqual(1);
  pointer(second, 'pointerup', start.left + 10, start.top + 78);
});

it('announces the position an item rendered by state ends at, when the keys come before the render', async () => {
  const { list, items } = column(5);
  const second = items[1];
  renderedByState(list);
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  key(second, ' ');
  await nextTask();
  await nextFrame();
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  expect(announced()).toBe('Dropped. Position 3 of 5.');
});

it('announces each keyboard step of an item rendered by state once it is rendered, and keeps the grab', async () => {
  const { list, items } = column(5);
  const second = items[1];
  renderedByState(list);
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  await nextTask();
  expect(announced()).toBe('Moved. Position 3 of 5.');
  expect(document.activeElement).toBe(second);
  expect(second.hasAttribute('data-motion-dragging')).toBe(true);
  key(second, 'ArrowDown');
  await nextTask();
  expect(announced()).toBe('Moved. Position 4 of 5.');
  key(second, ' ');
  expect(announced()).toBe('Dropped. Position 4 of 5.');
  expect(second.hasAttribute('data-motion-dragging')).toBe(false);
});

it('composes two keyboard steps pressed before the render: the second starts where the first leaves the item', async () => {
  const { list, items } = column(5);
  const second = items[1];
  renderedInBatches(list);
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const order = () => Array.from(list.children).map(child => child.textContent);
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  key(second, 'ArrowDown');
  expect(moves).toEqual([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ]);
  await nextTask();
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 4', 'Item 2', 'Item 5']);
  expect(document.activeElement).toBe(second);
  expect(announced()).toBe('Moved. Position 4 of 5.');
  key(second, ' ');
  expect(announced()).toBe('Dropped. Position 4 of 5.');
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 4', 'Item 2', 'Item 5']);
});

it('Escape walks every keyboard step of a grab back, when each step is rendered from state', async () => {
  const { list, items } = column(5);
  const second = items[1];
  renderedInBatches(list);
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const order = () => Array.from(list.children).map(child => child.textContent);
  second.focus();
  key(second, ' ');
  for (let step = 0; step < 3; step++) {
    key(second, 'ArrowDown');
    await nextTask();
  }
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 4', 'Item 5', 'Item 2']);
  key(second, 'Escape');
  await nextTask();
  expect(moves.slice(3)).toEqual([
    { from: 4, to: 3 },
    { from: 3, to: 2 },
    { from: 2, to: 1 },
  ]);
  expect(order()).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
  expect(announced()).toBe('Cancelled. Position 2 of 5.');
  expect(document.activeElement).toBe(second);
});

it('Escape cancels the steps pressed before the render, and says the place the item is back at once the list holds it', async () => {
  const { list, items } = column(5);
  const second = items[1];
  renderedInBatches(list);
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const order = () => Array.from(list.children).map(child => child.textContent);
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  key(second, 'ArrowDown');
  key(second, 'ArrowDown');
  key(second, 'Escape');
  expect(moves).toEqual([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
    { from: 4, to: 3 },
    { from: 3, to: 2 },
    { from: 2, to: 1 },
  ]);
  // Nothing is rendered yet: the item is still where the steps left it, and the region has not said where it goes back to.
  expect(announced()).toBe('Grabbed. Position 2 of 5.');
  await nextTask();
  expect(order()).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
  expect(announced()).toBe('Cancelled. Position 2 of 5.');
  expect(document.activeElement).toBe(second);
});

it('Escape walks back every keyboard step the binding moved itself', () => {
  const { list, items } = column(5);
  const second = items[1];
  const order = () => Array.from(list.children).map(child => child.textContent);
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  key(second, 'ArrowDown');
  key(second, 'ArrowDown');
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 4', 'Item 5', 'Item 2']);
  key(second, 'Escape');
  expect(order()).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
  expect(announced()).toBe('Cancelled. Position 2 of 5.');
  expect(document.activeElement).toBe(second);
});

it('says nothing when a prevented step expires after two frames, and says not moved a second after the key when nothing moves the item', async () => {
  const { list, items } = column(5);
  const second = items[1];
  list.addEventListener('motion-reorder', event => event.preventDefault());
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const order = () => Array.from(list.children).map(child => child.textContent);
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  expect(moves).toEqual([{ from: 1, to: 2 }]);
  await nextFrame();
  await nextFrame();
  // The step has expired and the list did not move the item: nothing is said yet, and the grab goes on.
  expect(order()).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
  expect(announced()).toBe('Grabbed. Position 2 of 5.');
  // A second after the key, nothing has moved it: the region says so, with the place the item holds.
  await sleep(1100);
  expect(announced()).toBe('Not moved. Position 2 of 5.');
  key(second, ' ');
  expect(announced()).toBe('Dropped. Position 2 of 5.');
  expect(second.hasAttribute('data-motion-dragging')).toBe(false);
});

it('says a keyboard step that the list renders within two frames as Moved, with the place it ends at', async () => {
  const { list, items } = column(5);
  const second = items[1];
  list.addEventListener('motion-reorder', event => event.preventDefault());
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  await nextFrame();
  // The state renders the step in the first frame: the item goes to its new place.
  list.insertBefore(second, items[2].nextSibling);
  await nextTask();
  expect(announced()).toBe('Moved. Position 3 of 5.');
  await nextFrame();
  await nextFrame();
  expect(announced()).toBe('Moved. Position 3 of 5.');
  expect(document.activeElement).toBe(second);
});

it('announces a render that comes after the two frames as moved, and the grab goes on', async () => {
  const { list, items } = column(5);
  const second = items[1];
  list.addEventListener('motion-reorder', event => event.preventDefault());
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  await nextFrame();
  await nextFrame();
  expect(announced()).toBe('Grabbed. Position 2 of 5.');
  // The list renders the step after the two frames: the item is at a new place, so the region says it.
  list.insertBefore(second, items[2].nextSibling);
  await nextTask();
  expect(announced()).toBe('Moved. Position 3 of 5.');
  expect(document.activeElement).toBe(second);
  expect(second.hasAttribute('data-motion-dragging')).toBe(true);
  key(second, ' ');
  expect(announced()).toBe('Dropped. Position 3 of 5.');
  expect(second.hasAttribute('data-motion-dragging')).toBe(false);
});

for (const when of ['microtask', 'task', 'late'] as const) {
  const label = when === 'microtask' ? 'a microtask' : when === 'task' ? 'a task' : '30 ms later';
  it('announces each keyboard step once the list renders it, and Escape too, when the render comes ' + label, async () => {
    const { list, items } = column(5);
    const second = items[1];
    renderedWhen(list, when);
    const order = () => Array.from(list.children).map(child => child.textContent);
    const wait = when === 'late' ? 60 : 20;
    second.focus();
    key(second, ' ');
    expect(announced()).toBe('Grabbed. Position 2 of 5.');
    const steps: [string, string, string[]][] = [
      ['ArrowDown', 'Moved. Position 3 of 5.', ['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']],
      ['ArrowDown', 'Moved. Position 4 of 5.', ['Item 1', 'Item 3', 'Item 4', 'Item 2', 'Item 5']],
      ['ArrowUp', 'Moved. Position 3 of 5.', ['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']],
    ];
    for (const [name, text, dom] of steps) {
      key(second, name);
      await sleep(wait);
      expect(order()).toEqual(dom);
      expect(announced()).toBe(text);
      expect(document.activeElement).toBe(second);
    }
    key(second, 'Escape');
    await sleep(wait);
    expect(order()).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']);
    expect(announced()).toBe('Cancelled. Position 2 of 5.');
    key(second, ' ');
    expect(announced()).toBe('Grabbed. Position 2 of 5.');
    key(second, ' ');
    expect(announced()).toBe('Dropped. Position 2 of 5.');
  });
}

it('nudges a focused drag with the arrows, 16 px or 64 px with Shift, and clamps it to its parent', () => {
  const el = card(stage(800, 200));
  const binding = bind(el, 'gb-card');
  el.focus();
  key(el, 'ArrowRight');
  expect(binding.offset.x).toBe(16);
  key(el, 'ArrowRight', { shiftKey: true });
  expect(binding.offset.x).toBe(80);
  for (let i = 0; i < 20; i++) key(el, 'ArrowRight', { shiftKey: true });
  expect(binding.offset.x).toBe(700);
  key(el, 'ArrowDown');
  expect(binding.offset.y).toBe(16);
});

it('writes the release at once under reduced motion, with no frame to wait for', () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  const ends = listen<{ x: number; y: number }>(el, 'motion-dragend');
  throwCard(el);
  expect(binding.offset.x).toBeCloseTo(540, 6);
  expect(ends).toHaveLength(1);
});

it('writes the release at once under --udx-motion: none', () => {
  page.style.setProperty('--udx-motion', 'none');
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  throwCard(el);
  expect(binding.offset.x).toBeCloseTo(540, 6);
});

it('removes every inline style and attribute it added on destroy, and keeps the tabindex an author set', async () => {
  const frame = stage(800, 300);
  const dragged = card(frame);
  const kept = card(frame);
  kept.tabIndex = -1;
  const draggedBinding = bind(dragged, 'gb-card');
  bind(kept, 'gb-card');
  const { left, top } = dragged.getBoundingClientRect();
  clock = 1000;
  pointer(dragged, 'pointerdown', left + 10, top + 50);
  clock = 1100;
  pointer(dragged, 'pointermove', left + 60, top + 50);
  expect(dragged.style.translate).not.toBe('');
  expect(dragged.style.touchAction).toBe('none');
  expect(dragged.getAttribute('tabindex')).toBe('0');
  draggedBinding.destroy();
  expect(dragged.style.translate).toBe('');
  expect(dragged.style.touchAction).toBe('');
  expect(dragged.style.userSelect).toBe('');
  expect(dragged.hasAttribute('data-motion-dragging')).toBe(false);
  expect(dragged.hasAttribute('tabindex')).toBe(false);
  expect(kept.getAttribute('tabindex')).toBe('-1');

  const dismiss = card(frame, 200, 100);
  const dismissBinding = bind(dismiss, 'gb-dismiss');
  dismiss.focus();
  key(dismiss, 'Delete');
  expect(await settle(dismissBinding)).toBe(true);
  expect(dismiss.getAttribute('aria-hidden')).toBe('true');
  dismissBinding.destroy();
  expect(dismiss.hasAttribute('aria-hidden')).toBe(false);
  expect(dismiss.style.opacity).toBe('');
  expect(dismiss.style.translate).toBe('');
  expect(dismiss.hasAttribute('tabindex')).toBe(false);
});

it('binds one gesture per element, and throws for a name that is not defined', () => {
  const el = card(stage(800, 300));
  const first = bind(el, 'gb-card');
  const second = bind(el, 'gb-card-free');
  expect(getGesture(el)).toBe(second);
  expect(() => first.reset()).not.toThrow();
  second.destroy();
  expect(getGesture(el)).toBeUndefined();
  expect(() => gesture(el, 'gb-never-defined')).toThrow('Unknown gesture "gb-never-defined"');
});

/** Whether an element is moving on its translate: a layout move animates it. */
function movingOnTranslate(element: HTMLElement): boolean {
  return element.getAnimations().some(animation => (animation.effect as KeyframeEffect).getKeyframes().some(frame => frame.translate != null));
}

/** A microtask later: the layout observer has read the mutations made before it. */
const tick = () => Promise.resolve();

/** Resolve once no animation under the page is still playing, the moves that a finished one starts included. */
async function settleAnimations(): Promise<void> {
  const playing = () => page.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running');
  while (playing().length > 0) await Promise.allSettled(playing().map(animation => animation.finished));
}

it('sets touch-action when the gesture is bound, from its axis, and gives the previous value back on destroy', () => {
  const both = card(stage(800, 300));
  const onX = card(stage(800, 300));
  const onY = card(stage(800, 300));
  const kept = card(stage(800, 300));
  kept.style.touchAction = 'pinch-zoom';
  bind(both, 'gb-card');
  bind(onX, 'gb-dismiss');
  bind(onY, 'gb-row');
  // A drag on both axes takes the whole touch; a gesture on x leaves the vertical pan to the browser, one on y the horizontal.
  expect(getComputedStyle(both).touchAction).toBe('none');
  expect(getComputedStyle(onX).touchAction).toBe('pan-y');
  expect(getComputedStyle(onY).touchAction).toBe('pan-x');
  const binding = bind(kept, 'gb-card');
  expect(kept.style.touchAction).toBe('none');
  binding.destroy();
  expect(kept.style.touchAction).toBe('pinch-zoom');
});

it('moves a focused drag physically, in right-to-left text too: ArrowRight goes right, and Shift moves 64 px', () => {
  const frame = stage(800, 200);
  frame.dir = 'rtl';
  const el = card(frame);
  const binding = bind(el, 'gb-card-free');
  el.focus();
  // The arrows of a direct manipulation are physical directions: the reading direction does not turn them.
  key(el, 'ArrowRight');
  expect(binding.offset).toEqual({ x: 16, y: 0 });
  key(el, 'ArrowLeft', { shiftKey: true });
  expect(binding.offset).toEqual({ x: -48, y: 0 });
  key(el, 'ArrowDown');
  expect(binding.offset).toEqual({ x: -48, y: 16 });
});

it('reorders along a row in right-to-left text: ArrowRight moves an item towards its previous sibling, on its right', () => {
  const list = document.createElement('div');
  list.dir = 'rtl';
  list.style.cssText = 'display:flex;width:300px';
  page.append(list);
  const items = [1, 2, 3].map(n => {
    const item = document.createElement('div');
    item.style.cssText = 'width:40px;height:40px';
    item.textContent = `Item ${n}`;
    list.append(item);
    bind(item, 'gb-row-x');
    return item;
  });
  const order = () => Array.from(list.children).map(child => child.textContent);
  const second = items[1];
  // The premise: the first item of a right-to-left row is the rightmost one.
  expect(items[0].getBoundingClientRect().left).toBeGreaterThan(second.getBoundingClientRect().left);
  second.focus();
  key(second, ' ');
  key(second, 'ArrowRight');
  expect(order()).toEqual(['Item 2', 'Item 1', 'Item 3']);
  expect(announced()).toBe('Moved. Position 1 of 3.');
  key(second, 'ArrowLeft');
  expect(order()).toEqual(['Item 1', 'Item 2', 'Item 3']);
  expect(announced()).toBe('Moved. Position 2 of 3.');
  // Left to right, the same key moves the item to the next sibling.
  list.dir = 'ltr';
  key(second, 'ArrowRight');
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 2']);
  key(second, ' ');
});

/** A column of `count` cards, each 40 px high, each bound to `name`, in a container that holds them. */
function cards(count: number, name = 'gb-dismiss'): { list: HTMLElement; items: HTMLElement[] } {
  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;width:200px';
  page.append(list);
  const items = Array.from({ length: count }, (_, index) => {
    const item = document.createElement('div');
    item.style.height = '40px';
    item.textContent = `Card ${index + 1}`;
    list.append(item);
    bind(item, name);
    return item;
  });
  return { list, items };
}

it('moves focus held in a swiped element to its next neighbour with the same gesture when the fly-out starts', () => {
  const { items } = cards(3);
  items[1].focus();
  key(items[1], 'Delete');
  // At fly-out start, before the element is hidden: the neighbour has it at once.
  expect(items[1].hasAttribute('aria-hidden')).toBe(false);
  expect(document.activeElement).toBe(items[2]);
});

it('moves focus to the previous neighbour when the swiped element is the last, for both afterFlyOut values', () => {
  const { items } = cards(2, 'gb-dismiss-remove');
  items[1].focus();
  key(items[1], 'Delete');
  expect(document.activeElement).toBe(items[0]);
});

it('moves focus to the container, focusable for the move only, when no neighbour carries the gesture', () => {
  const { list, items } = cards(1);
  const other = document.createElement('button');
  list.append(other);
  items[0].focus();
  key(items[0], 'Delete');
  expect(document.activeElement).toBe(list);
  expect(list.getAttribute('tabindex')).toBe('-1');
  other.focus();
  expect(list.hasAttribute('tabindex')).toBe(false);
});

it('moves focus from a control inside the swiped element too, and passes a neighbour already swiped away', async () => {
  const { items } = cards(3);
  const inner = document.createElement('button');
  items[0].append(inner);
  items[1].focus();
  key(items[1], 'Delete');
  expect(document.activeElement).toBe(items[2]);
  inner.focus();
  // The swipe of a focused control's element: Delete reaches the element only, so the pointer path swipes it.
  const { left, top } = items[0].getBoundingClientRect();
  clock = 1000;
  pointer(items[0], 'pointerdown', left + 10, top + 20);
  clock = 1200;
  pointer(items[0], 'pointermove', left + 110, top + 20);
  pointer(items[0], 'pointerup', left + 110, top + 20);
  expect(document.activeElement).toBe(items[2]);
});

it('leaves focus alone when it is not inside the swiped element', () => {
  const { items } = cards(3);
  const outside = document.createElement('button');
  page.append(outside);
  outside.focus();
  const { left, top } = items[0].getBoundingClientRect();
  clock = 1000;
  pointer(items[0], 'pointerdown', left + 10, top + 20);
  clock = 1200;
  pointer(items[0], 'pointermove', left + 110, top + 20);
  pointer(items[0], 'pointerup', left + 110, top + 20);
  expect(document.activeElement).toBe(outside);
});

it('a listener that prevents the swipe also keeps focus where it is', () => {
  const { items } = cards(3);
  items[1].addEventListener('motion-swipe', event => event.preventDefault());
  items[1].focus();
  key(items[1], 'Delete');
  expect(document.activeElement).toBe(items[1]);
});

it('sends focus to restoreFocus, an element or a function, and keeps it in place with restoreFocus false', () => {
  const elsewhere = document.createElement('button');
  page.append(elsewhere);
  for (const restoreFocus of [elsewhere, () => elsewhere, false as const]) {
    const list = document.createElement('div');
    page.append(list);
    const [first, second] = [0, 1].map(() => {
      const item = document.createElement('div');
      item.style.height = '40px';
      list.append(item);
      bindings.push(gesture(item, 'gb-dismiss', { restoreFocus }));
      return item;
    });
    first.focus();
    key(first, 'Delete');
    expect(document.activeElement).toBe(restoreFocus === false ? first : elsewhere);
    void second;
  }
});

it('a restoreFocus function that gives nothing leaves the neighbour order', () => {
  const list = document.createElement('div');
  page.append(list);
  const items = [0, 1].map(() => {
    const item = document.createElement('div');
    item.style.height = '40px';
    list.append(item);
    bindings.push(gesture(item, 'gb-dismiss', { restoreFocus: () => null }));
    return item;
  });
  items[0].focus();
  key(items[0], 'Delete');
  expect(document.activeElement).toBe(items[1]);
});

it('keeps Delete and Backspace as the swipe keys in right-to-left text, and ignores the arrows', () => {
  const frame = stage(800, 200);
  frame.dir = 'rtl';
  const el = card(frame, 200, 100);
  const other = card(frame, 200, 100);
  bind(el, 'gb-dismiss');
  bind(other, 'gb-dismiss');
  const swipes = listen<{ direction: string }>(el, 'motion-swipe');
  const otherSwipes = listen<{ direction: string }>(other, 'motion-swipe');
  el.focus();
  key(el, 'ArrowLeft');
  key(el, 'ArrowRight');
  expect(swipes).toEqual([]);
  key(el, 'Delete');
  expect(swipes).toEqual([{ direction: 'end' }]);
  other.focus();
  key(other, 'Backspace');
  expect(otherSwipes).toEqual([{ direction: 'end' }]);
});

it('a keyboard move during a drag release replaces the release, and motion-dragend fires once, after the move', async () => {
  const el = card(stage(800, 300));
  const binding = bind(el, 'gb-card');
  const ends = listen<{ x: number; y: number }>(el, 'motion-dragend');
  // The release is in flight: no frame has run since the pointer let go, so it is still at 140 px.
  throwCard(el);
  expect(ends).toEqual([]);
  el.focus();
  key(el, 'ArrowRight');
  expect(binding.offset).toEqual({ x: 156, y: 0 });
  expect(await settle(binding)).toBe(true);
  expect(binding.offset.x).toBe(156);
  expect(ends).toEqual([{ x: 156, y: 0 }]);
});

/**
 * Five items, each with a layout motion, the second one dragged down past the third and still held. The layout observer
 * has read the DOM move when this resolves; `start` is where the second item was before the drag.
 */
async function passNeighbour(): Promise<{ second: HTMLElement; third: HTMLElement; start: DOMRect }> {
  const { list, items } = column(5);
  for (const item of items) layouts.push(motion(item, reflow));
  const [, second, third] = items;
  const start = second.getBoundingClientRect();
  clock = 1000;
  pointer(second, 'pointerdown', start.left + 10, start.top + 20);
  clock = 1100;
  pointer(second, 'pointermove', start.left + 10, start.top + 70);
  await tick();
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  return { second, third, start };
}

it('reorders past a neighbour with a layout motion: the neighbour flies to its new place', async () => {
  const { second, third, start } = await passNeighbour();
  expect(movingOnTranslate(third)).toBe(true);
  expect(getMotion(third, 'layout')!.handle).not.toBeNull();
  pointer(second, 'pointerup', start.left + 10, start.top + 70);
  expect(await settle(getGesture(second) as GestureBinding)).toBe(true);
  await settleAnimations();
  // The neighbour took the place of the dragged item, and the dragged item the place of the neighbour.
  expect(Math.abs(third.getBoundingClientRect().top - start.top)).toBeLessThanOrEqual(1);
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 40))).toBeLessThanOrEqual(1);
});

it('gives the dragged item no layout flight while it is dragged past a neighbour, nor when it is let go', async () => {
  const { second, start } = await passNeighbour();
  expect(getMotion(second, 'layout')!.handle).toBeNull();
  expect(movingOnTranslate(second)).toBe(false);
  pointer(second, 'pointerup', start.left + 10, start.top + 70);
  // The layout observer reads the release (the element leaves its drag state) in a microtask: the release is its own move.
  await tick();
  expect(getMotion(second, 'layout')!.handle).toBeNull();
  expect(movingOnTranslate(second)).toBe(false);
  expect(await settle(getGesture(second) as GestureBinding)).toBe(true);
  await settleAnimations();
  // The release spring has brought the element to translate 0, in its new place.
  expect(getGesture(second)!.offset).toEqual({ x: 0, y: 0 });
  expect(getMotion(second, 'layout')!.handle).toBeNull();
  expect(Math.abs(second.getBoundingClientRect().top - (start.top + 40))).toBeLessThanOrEqual(1);
});

it('gives a drag nudged from the keyboard no layout flight, and its neighbours still fly', async () => {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;width:600px;height:100px';
  page.append(row);
  const box = (): HTMLElement => {
    const el = document.createElement('div');
    el.style.cssText = 'flex:none;width:100px;height:100px;background:#888';
    row.append(el);
    return el;
  };
  const [nudged, gone, next] = [box(), box(), box()];
  layouts.push(motion(nudged, reflow), motion(gone, reflow), motion(next, reflow));
  const binding = bind(nudged, 'gb-card');
  key(nudged, 'ArrowRight');
  expect(binding.offset.x).toBe(16);
  await tick();
  // The element after the nudged one moves to take the place of the one removed: it flies, the nudged one does not.
  gone.remove();
  await tick();
  expect(getMotion(next, 'layout')!.handle).not.toBeNull();
  expect(getMotion(nudged, 'layout')!.handle).toBeNull();
  expect(movingOnTranslate(nudged)).toBe(false);
  expect(nudged.getAnimations()).toHaveLength(0);
});

/** A host with no box (`data-motion-box="child"`), and in it the box that a test swaps for another one. */
function boxedHost(parent: HTMLElement, width = 100, height = 100): { host: HTMLElement; box: HTMLElement } {
  const host = document.createElement('div');
  host.dataset.motionBox = 'child';
  parent.append(host);
  const box = replacementBox(width, height);
  host.append(box);
  return { host, box };
}

/** A box of `width` by `height` px, not yet in the page: what a framework renders in place of the one it removes. */
function replacementBox(width = 100, height = 100): HTMLElement {
  const box = document.createElement('div');
  box.style.cssText = `width:${width}px;height:${height}px;background:#888`;
  return box;
}

it('keeps the binding of an element with no box when its box is swapped, and moves the new box', async () => {
  const { host, box } = boxedHost(stage(300, 200));
  const binding = bind(host, 'gb-card-free');
  const next = replacementBox();
  box.replaceWith(next);
  await nextTask();
  expect(getGesture(host)).toBe(binding);
  expect(getGesture(next)).toBe(binding);
  expect(getGesture(box)).toBeUndefined();
  expect(next.style.touchAction).toBe('none');
  expect(box.style.touchAction).toBe('');
  const { left, top } = next.getBoundingClientRect();
  clock = 1000;
  pointer(next, 'pointerdown', left + 10, top + 50);
  pointer(next, 'pointermove', left + 60, top + 50);
  expect(binding.offset).toEqual({ x: 50, y: 0 });
  expect(next.style.translate).toBe('50px');
  expect(box.style.translate).toBe('');
  pointer(next, 'pointerup', left + 60, top + 50);
  expect(await settle(binding)).toBe(true);
});

it('moves a held element to the new box of an element with no box at once: the offset is carried and the drag goes on', async () => {
  const { host, box } = boxedHost(stage(300, 200));
  // A press the engine gives no pointer capture: the hold has none to carry, and its listeners go on at the new box.
  box.setPointerCapture = () => {
    throw new DOMException('No active pointer with this id.', 'NotFoundError');
  };
  const binding = bind(host, 'gb-card-free');
  const { left, top } = box.getBoundingClientRect();
  clock = 1000;
  pointer(box, 'pointerdown', left + 10, top + 50);
  clock = 1100;
  pointer(box, 'pointermove', left + 60, top + 50);
  const next = replacementBox();
  box.replaceWith(next);
  await nextTask();
  // The hold moved with the box: the binding is on the new one, drawn at the offset the pointer had.
  expect(getGesture(next)).toBe(binding);
  expect(getGesture(box)).toBeUndefined();
  expect(next.style.translate).toBe('50px');
  expect(box.style.translate).toBe('');
  clock = 1150;
  pointer(next, 'pointermove', left + 80, top + 50);
  expect(binding.offset).toEqual({ x: 70, y: 0 });
  expect(next.style.translate).toBe('70px');
  pointer(next, 'pointerup', left + 80, top + 50);
  expect(await settle(binding)).toBe(true);
});

it('ends the hold with the release spring when the new box cannot take the pointer capture', async () => {
  const { host, box } = boxedHost(stage(300, 200));
  // An engine that gives the press its pointer capture: the hold has one to carry to the new box.
  box.setPointerCapture = () => {};
  const binding = bind(host, 'gb-card-free');
  const ended = listen<{ x: number; y: number }>(host, 'motion-dragend');
  const { left, top } = box.getBoundingClientRect();
  clock = 1000;
  pointer(box, 'pointerdown', left + 10, top + 50);
  clock = 1100;
  pointer(box, 'pointermove', left + 60, top + 50);
  const next = replacementBox();
  next.setPointerCapture = () => {
    throw new DOMException('No active pointer with this id.', 'NotFoundError');
  };
  box.replaceWith(next);
  await nextTask();
  // The capture did not move: the hold is over, and the release spring carries the element on from where the pointer left it.
  expect(getGesture(next)).toBe(binding);
  expect(await settle(binding)).toBe(true);
  expect(ended).toHaveLength(1);
  const rest = binding.offset.x;
  clock = 1200;
  pointer(next, 'pointermove', left + 120, top + 50);
  expect(binding.offset.x).toBe(rest);
});

it('carries the pointer capture of a held element to its new box, so a mouse drag goes on through the swap', async () => {
  const frame = stage(400, 200);
  const { host, box } = boxedHost(frame);
  const binding = bind(host, 'gb-card');
  const landing = document.createElement('div');
  landing.style.cssText = 'position:absolute;left:180px;top:40px;width:20px;height:20px;background:#444';
  frame.append(landing);
  const next = replacementBox();
  const gained: number[] = [];
  next.addEventListener('gotpointercapture', () => gained.push(1));
  // The first move of the real mouse hold swaps the box, before the gesture reads that move.
  const swap = (event: PointerEvent) => {
    if (event.buttons !== 1) return;
    document.removeEventListener('pointermove', swap);
    box.replaceWith(next);
  };
  document.addEventListener('pointermove', swap);
  try {
    await userEvent.dragAndDrop(box, landing);
  } finally {
    document.removeEventListener('pointermove', swap);
  }
  // The new box holds the pointer, and the drag went on: the element was carried from the mouse past its old place.
  expect(getGesture(next)).toBe(binding);
  expect(gained).toEqual([1]);
  expect(await settle(binding)).toBe(true);
  // The drag went on past the old box: the mouse moved the element about 140 px, to the landing place.
  expect(binding.offset.x).toBeGreaterThan(100);
});

it('reorders a held element whose box is swapped at once, while the pointer goes on', async () => {
  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;width:200px';
  page.append(list);
  const parts = Array.from({ length: 5 }, (_, index) => {
    const { host, box } = boxedHost(list, 200, 40);
    box.textContent = `Item ${index + 1}`;
    return { host, box, binding: bind(host, 'gb-row') };
  });
  const { box, binding } = parts[1];
  // A press the engine gives no pointer capture: the hold has none to carry, and the held item goes on reordering.
  box.setPointerCapture = () => {
    throw new DOMException('No active pointer with this id.', 'NotFoundError');
  };
  const moves = listen<{ from: number; to: number }>(list, 'motion-reorder');
  const start = box.getBoundingClientRect();
  clock = 1000;
  pointer(box, 'pointerdown', start.left + 10, start.top + 20);
  const next = replacementBox(200, 40);
  next.textContent = 'Item 2';
  box.replaceWith(next);
  await nextTask();
  expect(getGesture(next)).toBe(binding);
  clock = 1100;
  pointer(next, 'pointermove', start.left + 10, start.top + 70);
  expect(moves).toEqual([{ from: 1, to: 2 }]);
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 3', 'Item 2', 'Item 4', 'Item 5']);
  pointer(next, 'pointerup', start.left + 10, start.top + 70);
  expect(getGesture(next)).toBe(binding);
});

it('moves the focus of a keyboard grab to the new box of an element with no box, and the grab goes on there', async () => {
  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;width:200px';
  page.append(list);
  const parts = Array.from({ length: 3 }, (_, index) => {
    const { host, box } = boxedHost(list, 200, 40);
    box.textContent = `Item ${index + 1}`;
    return { host, box, binding: bind(host, 'gb-row') };
  });
  const { box, binding } = parts[1];
  box.focus();
  key(box, ' ');
  expect(announced()).toBe('Grabbed. Position 2 of 3.');
  const next = replacementBox(200, 40);
  next.textContent = 'Item 2';
  box.replaceWith(next);
  await nextTask();
  expect(getGesture(next)).toBe(binding);
  expect(document.activeElement).toBe(next);
  expect(next.hasAttribute('data-motion-dragging')).toBe(true);
  key(next, 'ArrowDown');
  expect(Array.from(list.children).map(child => child.textContent)).toEqual(['Item 1', 'Item 3', 'Item 2']);
  expect(announced()).toBe('Moved. Position 3 of 3.');
  key(next, ' ');
  expect(next.hasAttribute('data-motion-dragging')).toBe(false);
});

it('the HTML scanner keeps the gesture of an element with no box when its box is swapped, and moves the new box', async () => {
  const frame = stage(300, 200);
  frame.innerHTML = '<div data-motion-gesture="gb-card-free" data-motion-box="child"><div></div></div>';
  const host = frame.firstElementChild as HTMLElement;
  const box = host.firstElementChild as HTMLElement;
  box.style.cssText = 'width:100px;height:100px;background:#888';
  const disconnect = connectMotion({ root: frame });
  try {
    const binding = getGesture(host);
    expect(binding?.name).toBe('gb-card-free');
    expect(getGesture(box)).toBe(binding);
    const next = replacementBox();
    box.replaceWith(next);
    await nextTask();
    expect(getGesture(host)).toBe(binding);
    expect(getGesture(next)).toBe(binding);
    const { left, top } = next.getBoundingClientRect();
    clock = 1000;
    pointer(next, 'pointerdown', left + 10, top + 50);
    pointer(next, 'pointermove', left + 60, top + 50);
    expect(next.style.translate).toBe('50px');
    pointer(next, 'pointerup', left + 60, top + 50);
  } finally {
    disconnect();
  }
});
