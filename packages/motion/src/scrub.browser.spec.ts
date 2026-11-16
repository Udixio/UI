import { afterEach, beforeAll, beforeEach, expect, it } from 'vitest';
import { getMotion, motion, type MotionBinding } from './bind.js';
import type { MotionSpec } from './define-motion.js';
import { loadContinuous } from './feature-loader.js';

// The continuous module loads on the first bind of a loop or a scrub: these tests run with it loaded.
beforeAll(async () => {
  await loadContinuous();
});

/**
 * Whether the browser plays scroll-driven animations on a ViewTimeline (Chromium and WebKit; Firefox 157 does not).
 * The same file runs on the three browsers: where it is true, the scroll position drives the keyframes; where it is
 * false, the element stays in its stylesheet state at every scroll position. Branches with `it.runIf`, one per case.
 */
const nativeViewTimeline = typeof Reflect.get(globalThis, 'ViewTimeline') === 'function';

/** Moves from +100 px to -100 px as the element crosses the viewport. */
const scrub: MotionSpec = { verb: 'scrub', keyframes: [{ y: 100 }, { y: -100 }], range: 'cross' };

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** Two frames: the scroll position has been applied, and the computed style reads it. */
const twoFrames = async () => {
  await nextFrame();
  await nextFrame();
};

let page: HTMLElement;
let el: HTMLElement;
let bindings: MotionBinding[];

/** A spacer of one viewport height. */
function spacer(): HTMLElement {
  const element = document.createElement('div');
  element.style.height = '100vh';
  return element;
}

beforeEach(() => {
  window.scrollTo(0, 0);
  bindings = [];
  el = document.createElement('div');
  el.style.width = '100px';
  el.style.height = '100px';
  page = document.createElement('div');
  page.append(spacer(), el, spacer());
  document.body.append(page);
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  page.remove();
  window.scrollTo(0, 0);
  delete document.documentElement.dataset.motionPolicy;
});

/** Bind a scrub on the element, and remember the binding so that cleanup destroys it. */
function bindTo(spec: MotionSpec): MotionBinding {
  const binding = motion(el, spec);
  bindings.push(binding);
  return binding;
}

/** Scroll the document to `y`, and wait until the computed style reads that position. */
async function scrollTo(y: number): Promise<void> {
  window.scrollTo(0, y);
  await twoFrames();
}

/** The vertical translation of the element as computed, in px: 0 when no translation applies. */
function computedY(): number {
  const translate = getComputedStyle(el).translate;
  // A single value is the x offset alone: the y offset is then 0, which the browser may leave out.
  if (translate === 'none') return 0;
  const [, y = '0px'] = translate.split(' ');
  return Number.parseFloat(y);
}

/** The computed translation is `expected` px in y, within 2 px. */
function expectY(expected: number): void {
  const measured = computedY();
  expect(Math.abs(measured - expected), `translate y measured ${measured}, expected ${expected}`).toBeLessThanOrEqual(2);
}

/** The horizontal translation of the element as computed, in px: 0 when no translation applies. */
function computedX(): number {
  const translate = getComputedStyle(el).translate;
  if (translate === 'none') return 0;
  const [x = '0px'] = translate.split(' ');
  return Number.parseFloat(x);
}

/** Nothing is written inline: the element is in its stylesheet state. */
function expectNothingInline(): void {
  expect(el.style.translate).toBe('');
}

/** No translation applies: the computed value is the stylesheet's (none, or no offset). */
function expectNoTranslation(): void {
  expect(['none', '0px 0px']).toContain(getComputedStyle(el).translate);
}

/**
 * The scroll positions of the cover range (`cross`): 0 % when the top of the element reaches the bottom edge of the
 * viewport, 100 % when its bottom leaves the top edge. The element is 100 px high.
 */
function coverPositions(): [number, number, number] {
  const start = el.offsetTop - window.innerHeight;
  const end = el.offsetTop + el.offsetHeight;
  return [start, (start + end) / 2, end];
}

/** The scroll positions of the entry range (`enter`): 0 % when the top reaches the bottom edge, 100 % when the bottom does. */
function entryPositions(): [number, number] {
  const start = el.offsetTop - window.innerHeight;
  return [start, el.offsetTop + el.offsetHeight - window.innerHeight];
}

it('has no handle and no presence: play() settles at once and setPresent is refused', async () => {
  const binding = bindTo(scrub);
  expect(binding.verb).toBe('scrub');
  expect(binding.kind).toBe('view');
  expect(binding.handle).toBeNull();
  expect(binding.present).toBe(true);
  await expect(binding.play().finished).resolves.toBe('finished');
  expect(() => binding.setPresent(true)).toThrow(TypeError);
  expect(() => binding.setPresent(false)).toThrow(TypeError);
  expect(getMotion(el, 'view')).toBe(binding);
});

it.runIf(nativeViewTimeline)('follows the scroll position over the cover range, forwards and backwards', async () => {
  const [start, middle, end] = coverPositions();
  bindTo(scrub);
  await scrollTo(start);
  expectY(100);
  expectNothingInline();
  await scrollTo(middle);
  expectY(0);
  expectNothingInline();
  await scrollTo(end);
  expectY(-100);
  expectNothingInline();
  await scrollTo(middle);
  expectY(0);
  expectNothingInline();
});

it.runIf(nativeViewTimeline)('with range enter, holds the last keyframe once the element is fully entered', async () => {
  const [start, end] = entryPositions();
  bindTo({ ...scrub, range: 'enter' });
  await scrollTo(start);
  expectY(100);
  await scrollTo(end);
  expectY(-100);
  expectNothingInline();
  // Further down the page the animation is filled: the last keyframe stays.
  await scrollTo(document.documentElement.scrollHeight);
  expectY(-100);
  expectNothingInline();
});

it.runIf(nativeViewTimeline)('under reduced motion turned on after bind, plays nothing, and plays again when it is turned off', async () => {
  const [start, , end] = coverPositions();
  bindTo(scrub);
  await scrollTo(start);
  expectY(100);

  document.documentElement.dataset.motionPolicy = 'reduce';
  await twoFrames();
  expect(el.getAnimations()).toHaveLength(0);
  expectNoTranslation();
  expectNothingInline();
  await scrollTo(end);
  expect(el.getAnimations()).toHaveLength(0);
  expectNoTranslation();

  delete document.documentElement.dataset.motionPolicy;
  await twoFrames();
  expect(el.getAnimations()).toHaveLength(1);
  expectY(-100);
  expectNothingInline();
});

// Amplitude (step 8a-7): --udx-motion-scale scales the distance of the keyframes, not their duration (a scrub has none).
it.runIf(nativeViewTimeline)('scales the distance of its keyframes by --udx-motion-scale: at the end of the range, x is half the keyframe value', async () => {
  const [start, , end] = coverPositions();
  el.style.setProperty('--udx-motion-scale', '0.5');
  bindTo({ verb: 'scrub', keyframes: [{ x: 0, scale: 1 }, { x: 100, scale: 2 }], range: 'cross' });
  await scrollTo(start);
  expect(Math.abs(computedX())).toBeLessThanOrEqual(2);
  await scrollTo(end);
  expect(Math.abs(computedX() - 50)).toBeLessThanOrEqual(2);
  const scale = getComputedStyle(el).scale;
  expect(Math.abs(Number.parseFloat(scale === 'none' ? '1' : scale) - 1.5)).toBeLessThanOrEqual(0.02);
});

it.runIf(nativeViewTimeline)('under --udx-motion: none, plays nothing', async () => {
  const [start] = coverPositions();
  el.style.setProperty('--udx-motion', 'none');
  bindTo(scrub);
  await scrollTo(start);
  expect(el.getAnimations()).toHaveLength(0);
  expectNoTranslation();
  expectNothingInline();
});

it.runIf(nativeViewTimeline)('destroy() cancels the scroll link: nothing is left inline, and the element is back in its stylesheet state', async () => {
  const [start] = coverPositions();
  const binding = bindTo(scrub);
  await scrollTo(start);
  expect(el.getAnimations()).toHaveLength(1);
  binding.destroy();
  expect(() => binding.destroy()).not.toThrow();
  await twoFrames();
  expect(el.getAnimations()).toHaveLength(0);
  expectNoTranslation();
  expectNothingInline();
  expect(getMotion(el, 'view')).toBeUndefined();
});

it.runIf(!nativeViewTimeline)('without ViewTimeline, stays in its stylesheet state at every scroll position, and destroy() is harmless', async () => {
  const [start, middle, end] = coverPositions();
  const binding = bindTo(scrub);
  expect(el.getAnimations()).toHaveLength(0);
  expectNoTranslation();
  expectNothingInline();
  for (const y of [start, middle, end, middle]) {
    await scrollTo(y);
    expect(el.getAnimations()).toHaveLength(0);
    expectNoTranslation();
    expectNothingInline();
  }
  binding.destroy();
  expect(() => binding.destroy()).not.toThrow();
  expectNothingInline();
});
