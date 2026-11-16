import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { validateMotionSpec } from './define-motion.js';
import { applyFrame, playMotion, releaseFrame } from './play.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { resolveSpring } from './tokens.js';

const fadeSpec = validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
const slideSpec = validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }] });
const pressSpec = validateMotionSpec({ verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 0.96 }, { scale: 1 }] });
const scaleXSpec = validateMotionSpec({ verb: 'appear', keyframes: [{ scaleX: 0 }, { scaleX: 1 }] });

const runtime = getMotionRuntime({ development: true });
const forward = { direction: 'forward', carry: false, runtime } as const;
const spring = (ref: 'spring.default.spatial' | 'spring.default.effects') =>
  resolveSpring(ref, { scheme: 'expressive', support: { linear: true, fallback: true } }).duration;

/** Translation in px as [x, y], whatever the browser's serialization of 0px, and of the initial value `none`. */
const translateOf = (element: HTMLElement) => {
  const computed = getComputedStyle(element).translate;
  const [x = '0', y = '0'] = (computed === 'none' ? '0px' : computed).split(' ');
  return [parseFloat(x), parseFloat(y)];
};

/** Scale as [x, y], whatever the browser's serialization of a one-value scale, and of the initial value `none`. */
const scaleOf = (element: HTMLElement) => {
  const computed = getComputedStyle(element).scale;
  const [x = '1', y = x] = (computed === 'none' ? '1' : computed).split(' ');
  return [parseFloat(x), parseFloat(y)];
};

let target: HTMLElement;
let releaseRuntime: () => void;

beforeEach(() => {
  releaseRuntime = retainMotionRuntime(runtime);
  target = document.createElement('div');
  document.body.append(target);
});

afterEach(() => {
  target.remove();
  delete document.documentElement.dataset.motionPolicy;
  releaseRuntime();
  vi.restoreAllMocks();
});

it('plays a slide forward on the spatial spring and ends at its destination', async () => {
  const handle = playMotion(target, slideSpec, forward);
  expect(handle.duration).toBe(spring('spring.default.spatial'));
  expect(handle.duration).toBeGreaterThan(spring('spring.default.effects'));
  expect(await handle.finished).toBe('finished');
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(translateOf(target)).toEqual([0, 0]);
});

it('plays a backward fade to its inverted destination', async () => {
  const handle = playMotion(target, fadeSpec, { ...forward, direction: 'backward' });
  expect(await handle.finished).toBe('finished');
  expect(target.style.opacity).toBe('0');
});

it('carries the interrupted opacity into a backward fade', () => {
  const first = playMotion(target, fadeSpec, forward);
  first.pause();
  first.seek(first.duration / 2);
  const before = Number(getComputedStyle(target).opacity);
  expect(before).toBeGreaterThan(0);
  expect(before).toBeLessThan(1);
  const second = playMotion(target, fadeSpec, { ...forward, direction: 'backward', carry: true });
  expect(Math.abs(Number(getComputedStyle(target).opacity) - before)).toBeLessThan(0.02);
  first.cancel();
  second.cancel();
});

it('leaves scale, rotate and translate untouched on a carried fade', async () => {
  const handle = playMotion(target, fadeSpec, { ...forward, carry: true });
  expect(target.style.scale).toBe('');
  expect(target.style.rotate).toBe('');
  expect(target.style.translate).toBe('');
  expect(await handle.finished).toBe('finished');
  expect(target.style.scale).toBe('');
  expect(target.style.rotate).toBe('');
  expect(target.style.translate).toBe('');
});

it('renders a reduced slide with its offset applied at once and an animated opacity', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const handle = playMotion(target, slideSpec, forward);
  expect(translateOf(target)).toEqual([0, 0]);
  expect(handle.duration).toBe(spring('spring.default.effects'));
  handle.pause();
  handle.seek(handle.duration / 2);
  const middle = Number(getComputedStyle(target).opacity);
  expect(middle).toBeGreaterThan(0);
  expect(middle).toBeLessThan(1);
  handle.seek(handle.duration);
  handle.play();
  expect(await handle.finished).toBe('finished');
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('settles a reduced press at its final scale without animating', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const handle = playMotion(target, pressSpec, forward);
  expect(handle.duration).toBe(0);
  expect(target.style.scale).toBe('');
  expect(scaleOf(target)).toEqual([1, 1]);
  expect(target.getAnimations()).toHaveLength(0);
  expect(await handle.finished).toBe('finished');
});

it('jumps to the destination when the motion scale is zero', async () => {
  target.style.setProperty('--udx-motion-scale', '0');
  const handle = playMotion(target, slideSpec, forward);
  expect(target.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(translateOf(target)).toEqual([0, 0]);
  expect(await handle.finished).toBe('finished');
});

it('scales the distance of an appear by the motion scale: at 0.5 it starts 12px lower, and ends at rest', async () => {
  target.style.setProperty('--udx-motion-scale', '0.5');
  const handle = playMotion(target, slideSpec, forward);
  for (const animation of target.getAnimations()) {
    animation.pause();
    animation.currentTime = 0;
  }
  expect(translateOf(target)).toEqual([0, 12]);
  for (const animation of target.getAnimations()) animation.finish();
  expect(await handle.finished).toBe('finished');
  expect(translateOf(target)).toEqual([0, 0]);
});

it('multiplies the spatial duration by the motion scale', async () => {
  target.style.setProperty('--udx-motion-scale', '0.5');
  const handle = playMotion(target, slideSpec, forward);
  expect(handle.duration).toBeCloseTo(spring('spring.default.spatial') * 0.5);
  handle.cancel();
  expect(await handle.finished).toBe('cancelled');
});

it('lands on the destination without throwing when the target cannot animate', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  Object.defineProperty(target, 'animate', { value: undefined });
  const handle = playMotion(target, slideSpec, forward);
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(translateOf(target)).toEqual([0, 0]);
  expect(await handle.finished).toBe('finished');
  expect(error).toHaveBeenCalledTimes(1);
});

it('lands on the destination when the provider throws', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  Object.defineProperty(target, 'animate', { value: () => { throw new Error('creation failed'); } });
  const handle = playMotion(target, slideSpec, forward);
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(translateOf(target)).toEqual([0, 0]);
  expect(await handle.finished).toBe('finished');
  expect(error).toHaveBeenCalledTimes(1);
});

it('applies only the visual fields of a frame and never transform', () => {
  applyFrame(target, { opacity: 0.5, x: 3, scale: 2, rotate: 90 });
  expect(target.style.opacity).toBe('0.5');
  expect(translateOf(target)).toEqual([3, 0]);
  expect(target.style.scale).toBe('2');
  expect(target.style.rotate).toBe('90deg');
  expect(target.style.transform).toBe('');
});

it('writes scaleX and scaleY as one scale value and releases it', () => {
  applyFrame(target, { scaleY: 2 });
  expect(scaleOf(target)).toEqual([1, 2]);
  releaseFrame(target, ['scaleX']);
  expect(target.style.scale).toBe('');
});

it('ends a scaleX appear at a scale of 1', async () => {
  const handle = playMotion(target, scaleXSpec, forward);
  expect(await handle.finished).toBe('finished');
  expect(scaleOf(target)).toEqual([1, 1]);
});

it('carries an interrupted scale into the next motion', () => {
  // The spring overshoots, so a destination of 2 keeps the interrupted value far from the 1 an uncarried motion starts at.
  const doubling = validateMotionSpec({ verb: 'appear', keyframes: [{ scaleX: 0 }, { scaleX: 2 }] });
  const first = playMotion(target, doubling, forward);
  first.pause();
  first.seek(first.duration / 2);
  const [before] = scaleOf(target);
  expect(before).toBeGreaterThan(1.5);
  const second = playMotion(target, doubling, { ...forward, carry: true });
  expect(Math.abs(scaleOf(target)[0] - before)).toBeLessThan(0.02);
  first.cancel();
  second.cancel();
});

it('settles at the destination without animating when --udx-motion is none', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  target.style.setProperty('--udx-motion', 'none');
  const handle = playMotion(target, slideSpec, forward);
  expect(target.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(translateOf(target)).toEqual([0, 0]);
  expect(await handle.finished).toBe('finished');
  expect(error).not.toHaveBeenCalled();
});

it('inherits --udx-motion: none from an ancestor', async () => {
  const parent = document.createElement('div');
  parent.style.setProperty('--udx-motion', 'none');
  document.body.append(parent);
  parent.append(target);
  const handle = playMotion(target, slideSpec, forward);
  expect(target.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(await handle.finished).toBe('finished');
  parent.remove();
});

// Values at rest (step 8a-2): a finished motion leaves the neutral fields of its destination to the stylesheet.
const scaleAppearSpec = validateMotionSpec({ verb: 'appear', keyframes: [{ scale: 0.5 }, { scale: 1 }] });

/** A stylesheet rule the author writes; removed with the element at the end of the test. */
function authorRule(css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  return style;
}

it('releases the neutral fields of its destination once it has ended', async () => {
  const handle = playMotion(target, slideSpec, forward);
  expect(await handle.finished).toBe('finished');
  expect(target.style.opacity).toBe('');
  expect(target.style.translate).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('keeps a destination that is not neutral inline once it has ended', async () => {
  const handle = playMotion(target, fadeSpec, { ...forward, direction: 'backward' });
  expect(await handle.finished).toBe('finished');
  expect(target.style.opacity).toBe('0');
});

it('lets the author stylesheet set the scale at rest once an appear has ended', async () => {
  const rule = authorRule('.at-rest { scale: 1.05; }');
  target.classList.add('at-rest');
  const handle = playMotion(target, scaleAppearSpec, forward);
  expect(await handle.finished).toBe('finished');
  expect(target.style.scale).toBe('');
  expect(scaleOf(target)[0]).toBeCloseTo(1.05);
  rule.remove();
});

it('leaves a press with nothing inline once it has ended', async () => {
  const handle = playMotion(target, pressSpec, forward);
  expect(await handle.finished).toBe('finished');
  expect(target.style.scale).toBe('');
  expect(scaleOf(target)).toEqual([1, 1]);
});

it('releases the destination of a reduced fade once it has ended', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const handle = playMotion(target, slideSpec, forward);
  expect(await handle.finished).toBe('finished');
  expect(target.style.opacity).toBe('');
  expect(target.style.translate).toBe('');
});

it('releases the destination at once when the motion is settled', () => {
  target.style.setProperty('--udx-motion', 'none');
  playMotion(target, slideSpec, forward);
  expect(target.style.opacity).toBe('');
  expect(target.style.translate).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('releases nothing when the motion is cancelled: the value it froze stays inline for the next motion', async () => {
  const handle = playMotion(target, fadeSpec, { ...forward, direction: 'backward', carry: true });
  handle.cancel();
  expect(await handle.finished).toBe('cancelled');
  expect(target.style.opacity).not.toBe('');
});
