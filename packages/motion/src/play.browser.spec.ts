import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { validateMotionSpec } from './define-motion.js';
import { applyFrame, playMotion } from './play.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { resolveSpring } from './tokens.js';

const fadeSpec = validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
const slideSpec = validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }] });
const pressSpec = validateMotionSpec({ verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 0.96 }, { scale: 1 }] });

const runtime = getMotionRuntime({ development: true });
const forward = { direction: 'forward', carry: false, runtime } as const;
const spring = (ref: 'spring.default.spatial' | 'spring.default.effects') =>
  resolveSpring(ref, { scheme: 'expressive', support: { linear: true, fallback: true } }).duration;

/** Translation in px as [x, y], whatever the browser's serialization of 0px. */
const translateOf = (element: HTMLElement) => {
  const [x = '0', y = '0'] = getComputedStyle(element).translate.split(' ');
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
  expect(target.style.opacity).toBe('1');
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
  expect(target.style.opacity).toBe('1');
});

it('settles a reduced press at its final scale without animating', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const handle = playMotion(target, pressSpec, forward);
  expect(handle.duration).toBe(0);
  expect(target.style.scale).toBe('1');
  expect(target.getAnimations()).toHaveLength(0);
  expect(await handle.finished).toBe('finished');
});

it('jumps to the destination when the motion scale is zero', async () => {
  target.style.setProperty('--udx-motion-scale', '0');
  const handle = playMotion(target, slideSpec, forward);
  expect(target.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe('1');
  expect(translateOf(target)).toEqual([0, 0]);
  expect(await handle.finished).toBe('finished');
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
  expect(target.style.opacity).toBe('1');
  expect(translateOf(target)).toEqual([0, 0]);
  expect(await handle.finished).toBe('finished');
  expect(error).toHaveBeenCalledTimes(1);
});

it('lands on the destination when the provider throws', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  Object.defineProperty(target, 'animate', { value: () => { throw new Error('creation failed'); } });
  const handle = playMotion(target, slideSpec, forward);
  expect(target.style.opacity).toBe('1');
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
