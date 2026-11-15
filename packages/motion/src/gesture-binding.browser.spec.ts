import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defineGesture } from './gesture.js';
import { gesture, getGesture, type GestureBinding } from './gesture-binding.js';

defineGesture('gb-card', { kind: 'drag', alternative: 'arrows' });
defineGesture('gb-card-free', { kind: 'drag', bounds: 'none', alternative: 'arrows' });
defineGesture('gb-dismiss', { kind: 'swipe', alternative: 'action' });
defineGesture('gb-row', { kind: 'reorder', alternative: 'grab' });

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

beforeEach(() => {
  clock = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  page = document.createElement('div');
  document.body.append(page);
  bindings = [];
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
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
  expect(el.dataset.gesture).toBe('dragging');
  clock = 1250;
  pointer(el, 'pointermove', left + 150, top + 50);
  expect(binding.offset.x).toBe(140);
  pointer(el, 'pointerup', left + 150, top + 50);
  expect(el.hasAttribute('data-gesture')).toBe(false);
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
  expect(el.style.touchAction).toBe('');
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
  expect(el.hasAttribute('data-gesture')).toBe(false);
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
  expect(el.hasAttribute('data-gesture')).toBe(false);
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
  expect(second.hasAttribute('data-gesture')).toBe(false);
});

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
  expect(dragged.hasAttribute('data-gesture')).toBe(false);
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
