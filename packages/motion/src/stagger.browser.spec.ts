import { afterEach, beforeEach, expect, it } from 'vitest';
import { motion, type MotionBinding } from './bind.js';
import type { MotionHandle } from './contract.js';
import { defineMotion } from './define-motion.js';

const cascade = defineMotion('stagger-test-cascade', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0 },
  ],
  stagger: 'normal',
});

let root: HTMLElement;
let bindings: MotionBinding[];

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  bindings = [];
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  root.remove();
  delete document.documentElement.dataset.motionPolicy;
});

/** Bind and remember the binding so that cleanup destroys it. */
function bindTo(...args: Parameters<typeof motion>): MotionBinding {
  const binding = motion(...args);
  bindings.push(binding);
  return binding;
}

/** A list of `count` boxes, 20px high, one above the other, in its own container. */
function list(count: number, left = 0): HTMLElement[] {
  const container = document.createElement('div');
  container.style.cssText = `position: absolute; top: 0; left: ${left}px; width: 120px;`;
  root.append(container);
  return Array.from({ length: count }, () => {
    const item = document.createElement('div');
    item.style.height = '20px';
    container.append(item);
    return item;
  });
}

/** The delay of the first animation of an element, in milliseconds. */
function delayOf(element: Element): number | undefined {
  return element.getAnimations()[0]?.effect?.getTiming().delay;
}

it('cascades ten entries by visual order, capped at 400 ms, although bound in reverse order', async () => {
  const items = list(10);
  for (const item of [...items].reverse()) bindTo(item, cascade);
  await Promise.resolve();
  expect(items.map(delayOf)).toEqual([0, 50, 100, 150, 200, 250, 300, 350, 400, 400]);
});

it('runs two lists bound in the same task as two independent cascades', async () => {
  const left = list(5, 0);
  const right = list(5, 200);
  for (const [index, item] of left.entries()) {
    bindTo(item, cascade);
    bindTo(right[index], cascade);
  }
  await Promise.resolve();
  expect(left.map(delayOf)).toEqual([0, 50, 100, 150, 200]);
  expect(right.map(delayOf)).toEqual([0, 50, 100, 150, 200]);
});

it('starts a lone entry at once', async () => {
  const item = list(1)[0];
  bindTo(item, cascade);
  await Promise.resolve();
  expect(delayOf(item)).toBe(0);
});

it('starts every entry at once under reduced motion', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const items = list(4);
  for (const item of items) bindTo(item, cascade);
  await Promise.resolve();
  expect(items.map(delayOf)).toEqual([0, 0, 0, 0]);
});

it('creates no animation when cancelled before the cascade runs, and finishes cancelled', async () => {
  const item = list(1)[0];
  const binding = bindTo(item, cascade);
  const handle = binding.handle as MotionHandle;
  handle.cancel();
  await Promise.resolve();
  expect(item.getAnimations()).toHaveLength(0);
  await expect(handle.finished).resolves.toBe('cancelled');
});

it('holds the first keyframe during the delay of an entry that is not carried', async () => {
  const items = list(10);
  for (const item of items) bindTo(item, cascade);
  await Promise.resolve();
  expect(getComputedStyle(items[9]).opacity).toBe('0');
});

it('keeps the current opacity during the delay of a carried entry', async () => {
  const items = list(3);
  const bound = items.map(item => bindTo(item, cascade, { present: false }));
  for (const item of items) item.style.opacity = '0.5';
  for (const binding of bound) void binding.setPresent(true);
  await Promise.resolve();
  expect(delayOf(items[2])).toBe(100);
  expect(getComputedStyle(items[2]).opacity).toBe('0.5');
});

it('cascades five exits by visual order and sets inert on all of them at once', async () => {
  const items = list(5);
  const bound = items.map(item => bindTo(item, cascade, { settled: true }));
  for (const binding of bound) void binding.setPresent(false);
  expect(items.every(item => item.hasAttribute('inert'))).toBe(true);
  await Promise.resolve();
  expect(items.map(delayOf)).toEqual([0, 50, 100, 150, 200]);
});
