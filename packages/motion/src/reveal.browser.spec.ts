import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { motion, type MotionBinding, type MotionSource } from './bind.js';
import type { MotionSpec } from './define-motion.js';
import { rise } from './presets.js';
import { watchView } from './viewport.js';

/** `rise`, repeated each time the element enters the view. */
const repeating: MotionSpec = {
  verb: 'reveal',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  stagger: 'normal',
  repeat: 'always',
};

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** Two frames: the observer has reported, and the batch of a cascade has run. */
const twoFrames = async () => {
  await nextFrame();
  await nextFrame();
};

let page: HTMLElement;
let bindings: MotionBinding[];

beforeEach(() => {
  page = document.createElement('div');
  document.body.append(page);
  bindings = [];
  window.scrollTo(0, 0);
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  page.remove();
  window.scrollTo(0, 0);
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

/** Bind a reveal on an element, and remember the binding so that cleanup destroys it. */
function bindTo(item: HTMLElement, source: MotionSource = rise): MotionBinding {
  const binding = motion(item, source);
  bindings.push(binding);
  return binding;
}

/**
 * Items of 20 px, one above the other. A spacer of 200vh comes above them unless `leading` is false, and another
 * below them, so that any item can be scrolled to the top of the viewport.
 */
function layout(count: number, leading = true): HTMLElement[] {
  const spacer = () => {
    const element = document.createElement('div');
    element.style.height = '200vh';
    return element;
  };
  const list = Array.from({ length: count }, () => {
    const item = document.createElement('div');
    item.style.height = '20px';
    return item;
  });
  page.append(...(leading ? [spacer()] : []), ...list, spacer());
  return list;
}

/** Scroll the document so that the element is at the top of the viewport. */
function scrollToTop(element: Element): void {
  window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY);
}

/** Resolve once every animation of the element has ended. */
async function finishAll(element: Element): Promise<void> {
  await Promise.all(element.getAnimations().map(animation => animation.finished));
}

it('leaves content that is in view at bind untouched: no animation, no inline style', async () => {
  const [item] = layout(1, false);
  const before = item.getAttribute('style');
  bindTo(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(0);
  expect(item.getAttribute('style')).toBe(before);
  expect(getComputedStyle(item).opacity).toBe('1');
});

it('holds content out of view in its first frame, then plays it forward when it scrolls into view', async () => {
  const [item] = layout(1);
  bindTo(item);
  await twoFrames();
  expect(item.style.opacity).toBe('0');
  expect(getComputedStyle(item).translate).toBe('0px 24px');
  expect(item.getAnimations()).toHaveLength(0);

  scrollToTop(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);
  await finishAll(item);
  expect(getComputedStyle(item).opacity).toBe('1');
  expect(['none', '0px', '0px 0px']).toContain(getComputedStyle(item).translate);
  // The end frame is written inline by the provider when the animation ends: nothing else is left.
  expect(item.style.opacity).toBe('1');
  expect(item.style.translate).toBe('0px');
});

it('cascades the items that enter the view together, by visual order and capped at 400 ms', async () => {
  const list = layout(20);
  // Bound in reverse: the cascade follows the place of each item, not the order of binding.
  for (const item of [...list].reverse()) bindTo(item);
  await twoFrames();
  expect(list.every(item => item.getAnimations().length === 0)).toBe(true);

  scrollToTop(list[0]);
  await twoFrames();
  expect(list.map(item => item.getAnimations()[0]?.effect?.getTiming().delay)).toEqual(list.map((_, index) => Math.min(index * 50, 400)));

  await Promise.all(list.map(item => finishAll(item)));
  for (const item of list) {
    expect(getComputedStyle(item).opacity).toBe('1');
    expect(['none', '0px', '0px 0px']).toContain(getComputedStyle(item).translate);
  }
});

it('with repeat always, hides again when it leaves the view, and replays when it enters again', async () => {
  const [item] = layout(1);
  bindTo(item, repeating);
  scrollToTop(item);
  await twoFrames();
  await finishAll(item);
  expect(item.getAnimations()).toHaveLength(0);

  window.scrollTo(0, 0);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(0);
  expect(item.style.opacity).toBe('0');

  scrollToTop(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);
});

it('destroys a cascade before its batch runs: no animation starts, and every item is visible', async () => {
  const list = layout(20);
  for (const item of list) bindTo(item);
  // The first report of the observer is the state at the first frame: the items must be out of view by then.
  await twoFrames();
  // The observer reports in the next frame; its batch is held back instead of running in the microtask.
  const held: Array<() => void> = [];
  const spy = vi.spyOn(window, 'queueMicrotask').mockImplementation(callback => {
    held.push(callback);
  });
  scrollToTop(list[0]);
  await twoFrames();
  spy.mockRestore();
  expect(held.length).toBeGreaterThan(0);
  expect(list.every(item => item.getAnimations().length === 0)).toBe(true);

  for (const binding of bindings) binding.destroy();
  for (const run of held) run();
  await twoFrames();
  expect(list.every(item => item.getAnimations().length === 0)).toBe(true);
  for (const item of list) {
    expect(getComputedStyle(item).opacity).toBe('1');
    expect(item.style.opacity).toBe('');
  }
});

it('under reduced motion, an item scrolled into view ends visible, with no running animation', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const [item] = layout(1);
  bindTo(item);
  await twoFrames();
  expect(item.style.opacity).toBe('0');

  scrollToTop(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(0);
  expect(getComputedStyle(item).opacity).toBe('1');
  expect(['none', '0px', '0px 0px']).toContain(getComputedStyle(item).translate);
});

it('destroying an item that is hidden in its first frame makes it visible again', async () => {
  const [item] = layout(1);
  const binding = bindTo(item);
  await twoFrames();
  expect(item.style.opacity).toBe('0');
  binding.destroy();
  expect(item.style.opacity).toBe('');
  expect(item.style.translate).toBe('');
  expect(getComputedStyle(item).opacity).toBe('1');
});

it('play() replays a finished reveal from its first frame, and setPresent is refused', async () => {
  const [item] = layout(1);
  const binding = bindTo(item);
  scrollToTop(item);
  await twoFrames();
  await finishAll(item);
  expect(item.getAnimations()).toHaveLength(0);

  const replay = binding.play();
  expect(binding.handle).toBe(replay);
  expect(item.style.opacity).toBe('0');
  await nextFrame();
  const [animation] = item.getAnimations();
  expect(animation, 'a replay animation').toBeDefined();
  expect(Number((animation.effect as KeyframeEffect).getKeyframes()[0].opacity)).toBe(0);
  await finishAll(item);
  expect(getComputedStyle(item).opacity).toBe('1');

  expect(() => binding.setPresent(true)).toThrow(TypeError);
});

it('watches each element once on one observer per axis, and disconnects it when the last element is unwatched', async () => {
  const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
  const [first, second] = layout(2, false);
  const reports: Array<[string, boolean]> = [];
  const stopFirst = watchView(first, 'block', inView => reports.push(['first', inView]));
  const stopSecond = watchView(second, 'block', inView => reports.push(['second', inView]));
  await twoFrames();
  expect(reports.map(([name]) => name).sort()).toEqual(['first', 'second']);
  expect(reports.every(([, inView]) => inView)).toBe(true);

  stopFirst();
  expect(disconnect).not.toHaveBeenCalled();
  stopSecond();
  expect(disconnect).toHaveBeenCalledTimes(1);
});
