import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, getMotions, motion, type BindOptions, type MotionBinding, type MotionSource } from './bind.js';
import { connectMotion } from './connect.js';
import { defineMotion } from './define-motion.js';
import { defineGesture } from './gesture.js';
import { gesture, getGesture } from './gesture-binding.js';
import { loadContinuous, loadGestures, loadValues } from './feature-loader.js';
import { fade, press } from './presets.js';
import { getValue, value } from './value-binding.js';
import { defineValue } from './value.js';
import { inspect, revert, type MotionInspection } from './scope-entry.js';

defineMotion('scope-breathe', { verb: 'loop', keyframes: [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], pause: 'control' });
defineMotion('scope-press', { verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 0.96 }, { scale: 1 }] });
defineMotion('scope-fade', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
defineGesture('scope-card', { kind: 'drag', bounds: 'none', alternative: 'arrows' });
defineValue('scope-count', { source: 'state', range: [0, 100], spring: 'none' });

// The continuous, value and gesture modules load on the first bind of their kind: these tests run with them loaded.
beforeAll(async () => {
  await loadContinuous();
  await loadValues();
  await loadGestures();
});

let page: HTMLElement;
let section: HTMLElement;
let bindings: MotionBinding[];
let disconnects: Array<() => void>;

beforeEach(() => {
  page = document.createElement('div');
  section = document.createElement('section');
  page.append(section);
  document.body.append(page);
  bindings = [];
  disconnects = [];
  window.scrollTo(0, 0);
});

afterEach(() => {
  for (const disconnect of disconnects) disconnect();
  for (const binding of bindings) binding.destroy();
  page.remove();
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

/** Bind a motion, and remember the binding so that cleanup destroys it. */
function bindTo(target: HTMLElement, source: MotionSource, options?: BindOptions): MotionBinding {
  const binding = motion(target, source, options);
  bindings.push(binding);
  return binding;
}

function element(parent: HTMLElement = section, id = ''): HTMLElement {
  const el = document.createElement('div');
  if (id) el.id = id;
  parent.append(el);
  return el;
}

/** Two frames: the attribute observer has reported. */
const twoFrames = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

it('revert destroys every binding under the root and its descendants, and leaves the bindings outside it', () => {
  const inside = element();
  const nested = element(inside);
  const outside = element(page);
  const presence = bindTo(inside, fade, { present: false });
  const emphasis = bindTo(nested, press);
  const kept = bindTo(outside, fade);
  revert(section);
  expect(getMotions(inside)).toHaveLength(0);
  expect(getMotions(nested)).toHaveLength(0);
  expect(presence.handle).toBeNull();
  expect(emphasis.handle).toBeNull();
  expect(getMotion(outside, 'presence')).toBe(kept);
});

it('revert gives the elements back their stylesheet state: inline values, data-presence and inert are released', () => {
  const target = element();
  bindTo(target, fade, { present: false });
  expect(target.style.opacity).toBe('0');
  expect(target.getAttribute('data-presence')).toBe('exiting');
  expect(target.hasAttribute('inert')).toBe(true);
  revert(section);
  expect(target.style.opacity).toBe('');
  expect(target.hasAttribute('data-presence')).toBe(false);
  expect(target.hasAttribute('inert')).toBe(false);
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('revert destroys the value and the gesture bound under the root', () => {
  const target = element();
  value(target, 'scope-count');
  gesture(target, 'scope-card');
  revert(section);
  expect(getValue(target, 'scope-count')).toBeUndefined();
  expect(getGesture(target)).toBeUndefined();
  expect(target.style.touchAction).toBe('');
});

it('revert stops the connection that covers the root: a later change is not bound, and a new connection binds it again', async () => {
  const target = element();
  target.dataset.motion = 'scope-fade';
  disconnects.push(connectMotion({ root: page }));
  await twoFrames();
  expect(getMotion(target, 'presence')).toBeDefined();
  revert(section);
  expect(getMotion(target, 'presence')).toBeUndefined();
  target.dataset.motion = 'scope-press';
  await twoFrames();
  expect(getMotion(target, 'emphasis')).toBeUndefined();
  disconnects.push(connectMotion({ root: section }));
  await twoFrames();
  expect(getMotion(target, 'emphasis')?.kind).toBe('emphasis');
});

it('revert stops a connection rooted inside the reverted root, which binds nothing after that', async () => {
  const target = element();
  disconnects.push(connectMotion({ root: section }));
  revert(page);
  target.dataset.motion = 'scope-fade';
  await twoFrames();
  expect(getMotion(target, 'presence')).toBeUndefined();
});

it('inspect lists the bindings under the root with their kinds, names, verbs and states, and is serialisable', () => {
  const presence = element(section, 'scope-presence');
  const emphasis = element();
  const loop = element();
  bindTo(presence, fade, { present: false });
  bindTo(emphasis, press);
  const breathing = bindTo(loop, 'scope-breathe');
  breathing.pause();
  const report: MotionInspection = inspect(section);
  expect(report.bindings).toEqual(
    expect.arrayContaining([
      { element: expect.stringContaining('#scope-presence'), kind: 'presence', name: 'fade', verb: 'appear', state: 'absent' },
      { element: expect.any(String), kind: 'emphasis', name: 'press', verb: 'emphasize', state: 'idle' },
      { element: expect.any(String), kind: 'loop', name: 'scope-breathe', verb: 'loop', state: 'paused' },
    ]),
  );
  expect(report.definitions).toEqual(expect.arrayContaining(['fade', 'press', 'scope-breathe']));
  expect(JSON.parse(JSON.stringify(report))).toEqual(report);
});

it('inspect is read-only: the page and its bindings are the same after it', () => {
  const target = element();
  bindTo(target, fade, { present: false });
  const before = section.outerHTML;
  const count = getMotions(target).length;
  inspect(section);
  expect(section.outerHTML).toBe(before);
  expect(getMotions(target)).toHaveLength(count);
});

it('inspect reports the document policy under reduced motion, and no policy otherwise', () => {
  expect(inspect(section).policy).toEqual({ reduced: false, source: 'none' });
  document.documentElement.dataset.motionPolicy = 'reduce';
  expect(inspect(section).policy).toEqual({ reduced: true, source: 'document' });
});

it('importing the scope entry exposes inspect on globalThis.udixio.motion in development', async () => {
  await import('./scope-entry.js');
  const host = globalThis as unknown as { udixio?: { motion?: { inspect?: unknown } } };
  expect(host.udixio?.motion?.inspect).toBe(inspect);
});
