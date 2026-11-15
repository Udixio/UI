import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotionRuntime } from './runtime.js';
import { defineValue } from './value.js';
import { getValue, value, type ValueBinding } from './value-binding.js';

defineValue('bv-effects', { source: 'state', range: [0, 100], spring: 'spring.default.effects' });
defineValue('bv-spatial', { source: 'state', range: [0, 100] });
defineValue('bv-momentum', { source: 'state', range: [0, 100] });
defineValue('bv-tilt', { source: 'pointer' });
defineValue('bv-reading', { source: 'scroll' });
defineValue('bv-loop', { source: 'time', range: [0, 1], timing: { duration: 'duration.medium2', easing: 'easing.linear' } });
defineValue('bv-instant', { source: 'state', range: [0, 100], spring: 'none' });
defineValue('bv-counter', { source: 'state', range: [0, 10] });
defineValue('bv-destroy', { source: 'state', range: [0, 100] });
defineValue('bv-state', { source: 'state', range: [0, 100] });
defineValue('bv-pointer-only', { source: 'pointer', spring: 'none' });

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const frames = async (count: number) => {
  for (let i = 0; i < count; i++) await nextFrame();
};
/** Frames until `done` holds, at most `cap` of them; returns whether it holds. */
const until = async (done: () => boolean, cap = 240) => {
  for (let i = 0; i < cap && !done(); i++) await nextFrame();
  return done();
};

/** The number written to the element, or NaN when no value is written. */
const read = (el: Element, name: string): number => {
  const text = getComputedStyle(el).getPropertyValue(`--udx-motion-value-${name}`).trim();
  return text === '' ? NaN : Number(text);
};

let page: HTMLElement;
let bindings: ValueBinding[];

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

/** Bind a value on an element, and remember the binding so that cleanup destroys it. */
function bindTo(el: HTMLElement, name: string): ValueBinding {
  const binding = value(el, name);
  bindings.push(binding);
  return binding;
}

/** A box of 200 by 100 px, placed in the page. */
function box(): HTMLElement {
  const el = document.createElement('div');
  el.style.width = '200px';
  el.style.height = '100px';
  page.append(el);
  return el;
}

it('writes the initial value of a state at bind, from its range minimum, and clamps set() to the range', () => {
  const el = box();
  const binding = bindTo(el, 'bv-instant');
  expect(read(el, 'bv-instant')).toBe(0);
  expect(binding.current).toBe(0);
  binding.set(30);
  expect(read(el, 'bv-instant')).toBe(30);
  binding.set(150);
  expect(read(el, 'bv-instant')).toBe(100);
  expect(binding.current).toBe(100);
});

it('settles a critically damped state on its target, without overshoot, one frame at a time', async () => {
  const el = box();
  const binding = bindTo(el, 'bv-effects');
  binding.set(80);
  const samples: number[] = [];
  for (let i = 0; i < 240 && read(el, 'bv-effects') !== 80; i++) {
    await nextFrame();
    samples.push(read(el, 'bv-effects'));
  }
  expect(samples.at(-1)).toBe(80);
  expect(samples.length).toBeGreaterThan(5);
  for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
  expect(Math.max(...samples)).toBeLessThanOrEqual(80);
});

it('overshoots a spatial spring (damping below one) and then lands on its target', async () => {
  const el = box();
  const binding = bindTo(el, 'bv-spatial');
  const samples: number[] = [];
  binding.set(80);
  for (let i = 0; i < 240 && read(el, 'bv-spatial') !== 80; i++) {
    await nextFrame();
    samples.push(read(el, 'bv-spatial'));
  }
  const peak = Math.max(...samples);
  expect(peak).toBeGreaterThan(80);
  expect(samples.at(-1)).toBe(80);
});

it('carries the velocity when the target moves again, so that the value keeps rising for a frame', async () => {
  const el = box();
  const binding = bindTo(el, 'bv-momentum');
  const writes: number[] = [];
  binding.subscribe(written => writes.push(written));
  binding.set(100);
  await frames(3);
  const before = binding.current;
  const reversal = writes.length;
  binding.set(0);
  expect(await until(() => binding.current === 0)).toBe(true);
  const after = writes.slice(reversal);
  expect(after[0]).toBeGreaterThan(before);
  expect(after.at(-1)).toBe(0);
});

it('holds no runtime subscription at rest: the frame is requested only while the spring moves', async () => {
  const runtime = getMotionRuntime();
  const subscribe = runtime.subscribe.bind(runtime);
  const live = new Set<() => void>();
  vi.spyOn(runtime, 'subscribe').mockImplementation((name, sub, options) => {
    const unsubscribe = subscribe(name, sub, options);
    live.add(unsubscribe);
    return () => {
      live.delete(unsubscribe);
      unsubscribe();
    };
  });
  const el = box();
  const binding = bindTo(el, 'bv-spatial');
  expect(live.size).toBe(0);
  binding.set(80);
  expect(live.size).toBe(1);
  expect(await until(() => binding.current === 80)).toBe(true);
  expect(live.size).toBe(0);
  const settled = binding.current;
  await frames(5);
  expect(binding.current).toBe(settled);
  expect(live.size).toBe(0);
});

it('follows the pointer across the element, and lands on the pointer position', async () => {
  const el = box();
  const binding = bindTo(el, 'bv-tilt');
  expect(binding.current).toBe(0.5);
  expect(read(el, 'bv-tilt')).toBe(0.5);
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.left + 0.75 * rect.width, clientY: rect.top + rect.height / 2 }));
  expect(await until(() => binding.current === 0.75)).toBe(true);
  expect(read(el, 'bv-tilt')).toBe(0.75);
});

it('returns to the middle without a jump when the pointer leaves', async () => {
  const el = box();
  const binding = bindTo(el, 'bv-tilt');
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.left + 0.75 * rect.width, clientY: rect.top + rect.height / 2 }));
  expect(await until(() => binding.current === 0.75)).toBe(true);
  const path = [binding.current];
  binding.subscribe(written => path.push(written));
  el.dispatchEvent(new PointerEvent('pointerleave'));
  expect(await until(() => binding.current === 0.5)).toBe(true);
  for (let i = 1; i < path.length; i++) expect(Math.abs(path[i] - path[i - 1])).toBeLessThan(0.2);
  expect(read(el, 'bv-tilt')).toBe(0.5);
});

it('follows the document scroll progress, at once at bind and then with the spring', async () => {
  const spacer = document.createElement('div');
  spacer.style.height = '300vh';
  page.append(spacer);
  const el = box();
  const binding = bindTo(el, 'bv-reading');
  expect(binding.current).toBe(0);
  const room = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, room / 2);
  const progress = window.scrollY / room;
  // The written value has four decimals, so it lands within 1e-4 of the exact progress.
  expect(await until(() => Math.abs(binding.current - progress) < 1e-4)).toBe(true);
  expect(Math.abs(read(el, 'bv-reading') - 0.5)).toBeLessThanOrEqual(0.01);
});

it('loops a time value over its period, and wraps back below its previous value', async () => {
  const el = box();
  bindTo(el, 'bv-loop');
  expect(read(el, 'bv-loop')).toBe(0);
  let previous = read(el, 'bv-loop');
  let rose = false;
  let wrapped = false;
  const started = performance.now();
  while (performance.now() - started < 400 && !wrapped) {
    await nextFrame();
    const now = read(el, 'bv-loop');
    if (now > previous) rose = true;
    if (now < previous) wrapped = true;
    previous = now;
  }
  expect(rose).toBe(true);
  expect(wrapped).toBe(true);
});

it('holds a time value at the start of its range under reduced motion, and freezes it when reduced motion comes on', async () => {
  const el = box();
  const binding = bindTo(el, 'bv-loop');
  expect(await until(() => read(el, 'bv-loop') > 0.2)).toBe(true);
  document.documentElement.dataset.motionPolicy = 'reduce';
  await frames(2);
  expect(read(el, 'bv-loop')).toBe(0);
  await frames(20);
  expect(read(el, 'bv-loop')).toBe(0);
  expect(binding.current).toBe(0);
});

it('reads --udx-motion for a time value when it starts, not at each frame', async () => {
  const el = box();
  bindTo(el, 'bv-loop');
  const computed = vi.spyOn(window, 'getComputedStyle');
  await frames(30);
  expect(computed.mock.calls.filter(([node]) => node === el).length).toBeLessThanOrEqual(2);
});

it('reads --udx-motion again when a time value resumes after a pause', async () => {
  const el = box();
  bindTo(el, 'bv-loop');
  expect(await until(() => read(el, 'bv-loop') > 0.2)).toBe(true);
  page.style.setProperty('--udx-motion', 'none');
  document.documentElement.dataset.motionPolicy = 'reduce';
  await new Promise(resolve => setTimeout(resolve, 200));
  delete document.documentElement.dataset.motionPolicy;
  await frames(10);
  expect(read(el, 'bv-loop')).toBe(0);
  await frames(20);
  expect(read(el, 'bv-loop')).toBe(0);
  page.style.removeProperty('--udx-motion');
});

it('writes a state at once and holds a time value at range start under --udx-motion: none', async () => {
  page.style.setProperty('--udx-motion', 'none');
  const el = box();
  const state = bindTo(el, 'bv-spatial');
  state.set(80);
  expect(read(el, 'bv-spatial')).toBe(80);
  bindTo(el, 'bv-loop');
  expect(read(el, 'bv-loop')).toBe(0);
  await frames(10);
  expect(read(el, 'bv-loop')).toBe(0);
  page.style.removeProperty('--udx-motion');
});

it('writes the target at once, with no spring, when the spring is none', () => {
  const el = box();
  const binding = bindTo(el, 'bv-instant');
  binding.set(30);
  expect(read(el, 'bv-instant')).toBe(30);
});

it('writes a pointer value at once when its spring is none', () => {
  const el = box();
  const binding = bindTo(el, 'bv-pointer-only');
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.left + 0.2 * rect.width, clientY: rect.top + rect.height / 2 }));
  expect(binding.current).toBeCloseTo(0.2, 4);
  expect(read(el, 'bv-pointer-only')).toBeCloseTo(0.2, 4);
});

it('takes the initial value of a state from its value attribute, and follows the attribute', async () => {
  const data = document.createElement('data');
  data.setAttribute('value', '5');
  page.append(data);
  const binding = bindTo(data, 'bv-counter');
  expect(binding.current).toBe(5);
  expect(read(data, 'bv-counter')).toBe(5);
  data.setAttribute('value', '9');
  expect(await until(() => binding.current === 9)).toBe(true);
  expect(read(data, 'bv-counter')).toBe(9);
  data.setAttribute('value', 'n/a');
  await frames(5);
  expect(binding.current).toBe(9);
});

it('refuses set() on a value that is not a state', () => {
  const el = box();
  const binding = bindTo(el, 'bv-tilt');
  expect(() => binding.set(0.3)).toThrow(TypeError);
});

it('keeps one binding per element and name: binding the name again destroys the previous one', () => {
  const el = box();
  const first = bindTo(el, 'bv-state');
  const second = bindTo(el, 'bv-state');
  expect(getValue(el, 'bv-state')).toBe(second);
  expect(() => first.set(10)).not.toThrow();
  first.destroy();
  expect(getValue(el, 'bv-state')).toBe(second);
});

it('throws for a name that is not defined', () => {
  expect(() => value(box(), 'bv-never-defined')).toThrow('Unknown value "bv-never-defined"');
});

it('removes its property and stops writing when destroyed', async () => {
  const el = box();
  const binding = value(el, 'bv-destroy');
  binding.set(60);
  await frames(2);
  binding.destroy();
  expect(getComputedStyle(el).getPropertyValue('--udx-motion-value-bv-destroy').trim()).toBe('');
  expect(getValue(el, 'bv-destroy')).toBeUndefined();
  await frames(10);
  expect(getComputedStyle(el).getPropertyValue('--udx-motion-value-bv-destroy').trim()).toBe('');
});
