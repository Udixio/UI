import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { motion, motionWhenDefined, type MotionBinding, type MotionSource } from './bind.js';
import { defineMotion } from './define-motion.js';
import { blink, fade, parallax, press, reflow, rise, rotate } from './presets.js';

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** Two frames: the observer has reported, and a change of policy has been applied. */
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

/** Bind a loop on an element, and remember the binding so that cleanup destroys it. */
function bindTo(item: HTMLElement, source: MotionSource = rotate): MotionBinding {
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

/** The play state of the first animation of an element. */
function playStateOf(item: HTMLElement): string | undefined {
  return item.getAnimations()[0]?.playState;
}

/** The timing of the first animation of an element. */
function timingOf(item: HTMLElement) {
  return (item.getAnimations()[0].effect as KeyframeEffect).getTiming();
}

it('plays a loop forever from the moment it is bound, and keeps it running while it is in view', async () => {
  const [item] = layout(1, false);
  bindTo(item);
  expect(item.getAnimations()).toHaveLength(1);
  expect(timingOf(item).iterations).toBe(Infinity);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);
  expect(playStateOf(item)).toBe('running');
});

it('pauses by itself while it is out of view, and resumes when it comes back into view', async () => {
  const [item] = layout(1);
  bindTo(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);
  expect(playStateOf(item)).toBe('paused');

  scrollToTop(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);
  expect(playStateOf(item)).toBe('running');
});

it('stays paused when the author pauses it, through scrolls, until the author plays it again', async () => {
  const [item] = layout(1);
  const binding = bindTo(item);
  scrollToTop(item);
  await twoFrames();
  expect(playStateOf(item)).toBe('running');

  binding.pause();
  expect(playStateOf(item)).toBe('paused');
  window.scrollTo(0, 0);
  await twoFrames();
  expect(playStateOf(item)).toBe('paused');
  scrollToTop(item);
  await twoFrames();
  expect(playStateOf(item)).toBe('paused');

  binding.play();
  expect(playStateOf(item)).toBe('running');
});

it('under reduced motion, a loop does not play at all: the element keeps its stylesheet state', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const [item] = layout(1, false);
  const before = item.getAttribute('style');
  bindTo(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(0);
  expect(getComputedStyle(item).rotate).toBe('none');
  expect(item.getAttribute('style')).toBe(before);
});

it('under reduced motion turned on while a loop runs, stops it, and runs it again when reduced motion is turned off', async () => {
  const [item] = layout(1, false);
  bindTo(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);

  document.documentElement.dataset.motionPolicy = 'reduce';
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(0);
  expect(getComputedStyle(item).rotate).toBe('none');

  delete document.documentElement.dataset.motionPolicy;
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);
  expect(playStateOf(item)).toBe('running');
});

it('with --udx-motion: none, a loop does not play', async () => {
  const [item] = layout(1, false);
  item.style.setProperty('--udx-motion', 'none');
  bindTo(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(0);
});

it('with a motion scale of 0, a loop does not play', async () => {
  const [item] = layout(1, false);
  item.style.setProperty('--udx-motion-scale', '0');
  bindTo(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(0);
});

it('destroy() stops the loop: no animation remains, nothing is written inline, and play() does not restart it', async () => {
  const [item] = layout(1, false);
  const before = item.getAttribute('style');
  const binding = bindTo(item);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);

  binding.destroy();
  expect(item.getAnimations()).toHaveLength(0);
  expect(item.getAttribute('style')).toBe(before);
  expect(getComputedStyle(item).rotate).toBe('none');

  binding.play();
  expect(item.getAnimations()).toHaveLength(0);
  expect(binding.handle).toBeNull();
});

it('pause() is refused, with a TypeError, on every motion that is not a loop', () => {
  for (const source of [fade, press, rise, parallax, reflow]) {
    const item = document.createElement('div');
    page.append(item);
    const binding = bindTo(item, source);
    expect(() => binding.pause()).toThrow(new TypeError('pause applies to a loop motion'));
  }
});

it('the blink preset runs one cycle per second', () => {
  const [item] = layout(1, false);
  bindTo(item, blink);
  expect(timingOf(item).duration).toBe(1000);
  expect(timingOf(item).iterations).toBe(Infinity);
});

it('a loop bound paused before its name is defined starts paused once the name arrives', async () => {
  const [item] = layout(1, false);
  const deferred = motionWhenDefined(item, 'loop-paused-later', { paused: true });
  expect(deferred.binding).toBeUndefined();
  defineMotion('loop-paused-later', rotate.spec);
  await twoFrames();
  expect(item.getAnimations()).toHaveLength(1);
  expect(item.getAnimations()[0].playState).toBe('paused');
  deferred.binding!.play();
  expect(item.getAnimations()[0].playState).toBe('running');
  deferred.destroy();
});
