import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { motion, motionWhenDefined, type MotionBinding, type MotionSource } from './bind.js';
import { defineMotion } from './define-motion.js';
import { loadContinuous } from './feature-loader.js';
import { blink, fade, parallax, press, reflow, rise, rotate } from './presets.js';

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** Two frames: the observer has reported, and a change of policy has been applied. */
const twoFrames = async () => {
  await nextFrame();
  await nextFrame();
};

// The continuous module loads on the first bind of a loop or a scrub: these tests run with it loaded.
beforeAll(async () => {
  await loadContinuous();
});

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

it('pauses while the tab is hidden, and plays again when the tab is shown', async () => {
  const [item] = layout(1, false);
  bindTo(item);
  await twoFrames();
  expect(playStateOf(item)).toBe('running');

  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  try {
    document.dispatchEvent(new Event('visibilitychange'));
    expect(playStateOf(item)).toBe('paused');
  } finally {
    delete (document as { visibilityState?: string }).visibilityState;
  }
  document.dispatchEvent(new Event('visibilitychange'));
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

it('scales the distances of a loop by the motion scale: at 0.5, rotate turns half a turn in its first iteration', async () => {
  const [item] = layout(1, false);
  item.style.setProperty('--udx-motion-scale', '0.5');
  bindTo(item, rotate);
  await twoFrames();
  const [animation] = item.getAnimations();
  animation.pause();
  // Just before the end of the first iteration: at the end itself, the second iteration starts from 0.
  animation.currentTime = (timingOf(item).duration as number) - 1;
  expect(Math.abs(parseFloat(getComputedStyle(item).rotate) - 180)).toBeLessThanOrEqual(1);
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

// A thumb that starts clipped out of its track, as an indeterminate bar's thumb does: only its own motion brings it in.
const clippedThumb = defineMotion('loop-clipped-thumb', {
  verb: 'loop',
  keyframes: [{ x: 0 }, { x: 240 }],
  timing: { duration: 'duration.extraLong1', easing: 'easing.linear' },
  pause: 'essential',
  reason: 'The test thumb moves across its track.',
});

/**
 * A track of 200 px that clips its content, and a 40 px thumb placed entirely outside it, to the left, with a gap of 20 px:
 * an edge that only touches the track still counts as intersecting.
 */
function clippedTrack(): { track: HTMLElement; thumb: HTMLElement } {
  const track = document.createElement('div');
  track.style.cssText = 'position: relative; width: 200px; height: 8px; overflow: hidden;';
  const thumb = document.createElement('div');
  thumb.style.cssText = 'position: absolute; top: 0; left: -60px; width: 40px; height: 8px;';
  track.append(thumb);
  return { track, thumb };
}

/** A spacer of 200vh: an element placed after one is out of view at load. */
function spacer(): HTMLElement {
  const element = document.createElement('div');
  element.style.height = '200vh';
  return element;
}

/** The track between two spacers: out of view at load, and scrollable to the top of the viewport. */
function trackBetweenSpacers(track: HTMLElement): void {
  page.append(spacer(), track, spacer());
}

it('plays a loop whose element starts clipped out of its track, while the track is in view', async () => {
  const { track, thumb } = clippedTrack();
  trackBetweenSpacers(track);
  scrollToTop(track);
  bindTo(thumb, clippedThumb);
  await twoFrames();
  expect(thumb.getAnimations()).toHaveLength(1);
  expect(playStateOf(thumb)).toBe('running');
  const before = thumb.getAnimations()[0].currentTime;
  await twoFrames();
  expect(thumb.getAnimations()[0].currentTime as number).toBeGreaterThan(before as number);
});

it('pauses a loop whose element starts clipped while its track is out of view, and plays it again when the track comes into view', async () => {
  const { track, thumb } = clippedTrack();
  trackBetweenSpacers(track);
  bindTo(thumb, clippedThumb);
  await twoFrames();
  expect(playStateOf(thumb)).toBe('paused');

  scrollToTop(track);
  await twoFrames();
  expect(playStateOf(thumb)).toBe('running');

  window.scrollTo(0, 0);
  await twoFrames();
  expect(playStateOf(thumb)).toBe('paused');
});

it('a loop clipped by a transformed box that is its containing block is in view while that box is', async () => {
  const track = document.createElement('div');
  track.style.cssText = 'height: 8px; width: 200px; overflow: hidden; transform: translateZ(0);';
  const thumb = document.createElement('div');
  thumb.style.cssText = 'position: absolute; top: 0; left: -60px; width: 40px; height: 8px;';
  track.append(thumb);
  trackBetweenSpacers(track);
  scrollToTop(track);
  bindTo(thumb, clippedThumb);
  await twoFrames();
  expect(playStateOf(thumb)).toBe('running');
});

it('a body that clips horizontally does not clip its loops: its overflow reaches the viewport', async () => {
  document.body.style.overflowX = 'hidden';
  try {
    const [item] = layout(1);
    bindTo(item);
    await twoFrames();
    expect(playStateOf(item)).toBe('paused');
    scrollToTop(item);
    await twoFrames();
    expect(playStateOf(item)).toBe('running');
  } finally {
    document.body.style.overflowX = '';
  }
});

it('a loop in a scroll container keeps its own box: scrolled out of the container it pauses, and plays when scrolled back', async () => {
  const scroller = document.createElement('div');
  scroller.style.cssText = 'height: 40px; overflow: auto;';
  const content = document.createElement('div');
  content.style.cssText = 'height: 100px;';
  const item = document.createElement('div');
  item.style.cssText = 'height: 20px;';
  scroller.append(content, item);
  page.append(scroller);
  bindTo(item);
  await twoFrames();
  expect(playStateOf(item)).toBe('paused');
  scroller.scrollTop = 100;
  await twoFrames();
  expect(playStateOf(item)).toBe('running');
});

it('a fixed loop element is in view on its own box, though the box that holds it is out of view', async () => {
  const track = document.createElement('div');
  track.style.cssText = 'height: 20px; overflow: hidden;';
  const item = document.createElement('div');
  item.style.cssText = 'position: fixed; top: 0; left: 0; width: 20px; height: 20px;';
  track.append(item);
  page.append(spacer(), track, spacer());
  bindTo(item);
  await twoFrames();
  expect(playStateOf(item)).toBe('running');
});

it('an absolutely positioned loop element is clipped by its containing block, not by a clipping box between them', async () => {
  const frame = document.createElement('div');
  frame.style.cssText = 'position: relative; height: 400px;';
  const clip = document.createElement('div');
  clip.style.cssText = 'height: 20px; overflow: hidden;';
  const item = document.createElement('div');
  item.style.cssText = 'position: absolute; top: 300px; left: 0; width: 20px; height: 20px;';
  clip.append(item);
  frame.append(clip);
  page.append(spacer(), frame, spacer());
  bindTo(item);
  // The top of the frame is 200 px above the viewport: the clip is out of view, the element 100 px below its top.
  window.scrollTo(0, frame.getBoundingClientRect().top + window.scrollY + 200);
  await twoFrames();
  expect(playStateOf(item)).toBe('running');
});

it('a loop in an absolutely positioned box that escapes a clipping ancestor is not clipped by it', async () => {
  const frame = document.createElement('div');
  frame.style.cssText = 'position: relative; height: 400px;';
  const clip = document.createElement('div');
  clip.style.cssText = 'height: 20px; overflow: hidden;';
  const escaped = document.createElement('div');
  escaped.style.cssText = 'position: absolute; top: 300px; left: 0;';
  const item = document.createElement('div');
  item.style.cssText = 'width: 20px; height: 20px;';
  escaped.append(item);
  clip.append(escaped);
  frame.append(clip);
  page.append(spacer(), frame, spacer());
  bindTo(item);
  window.scrollTo(0, frame.getBoundingClientRect().top + window.scrollY + 200);
  await twoFrames();
  expect(playStateOf(item)).toBe('running');
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
