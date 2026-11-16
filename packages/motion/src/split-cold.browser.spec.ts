import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { motion, type MotionBinding } from './bind.js';
import type { MotionSpec } from './define-motion.js';
import { textModule } from './feature-loader.js';

// This file never imports the text entry: the text module loads when a split definition is bound. Its import is held by
// a gate that the tests open, so the loading stays pending as long as a test needs it. The tests run in order: the first
// one leaves the module loading, and the second one opens the gate.
const gate = vi.hoisted(() => {
  let open!: () => void;
  const opened = new Promise<void>(resolve => {
    open = resolve;
  });
  return { opened, open };
});

vi.mock('./text-entry.js', async () => {
  await gate.opened;
  return vi.importActual<typeof import('./text-entry.js')>('./text-entry.js');
});

const appear: Extract<MotionSpec, { verb: 'appear' | 'disappear' }> = {
  verb: 'appear',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
  split: 'words',
};

let root: HTMLElement;
let bindings: MotionBinding[];

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** Frames until `done` holds, at most `cap` of them; returns whether it holds. */
async function until(done: () => boolean, cap = 240): Promise<boolean> {
  for (let i = 0; i < cap && !done(); i++) await nextFrame();
  return done();
}

/** Bind a motion and remember the binding so that cleanup destroys it. */
function bindTo(element: HTMLElement, source: Parameters<typeof motion>[1], options: Parameters<typeof motion>[2] = {}): MotionBinding {
  const binding = motion(element, source, options);
  bindings.push(binding);
  return binding;
}

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  bindings = [];
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  root.remove();
});

it('an exit requested while the text loads plays the element whole, at once, and is not held back by the load', async () => {
  expect(textModule()).toBeUndefined();
  const p = document.createElement('p');
  p.textContent = 'Hello big world';
  root.append(p);
  const binding = bindTo(p, appear);
  // While the module loads, the entry holds the element in its first frame: nothing plays whole yet.
  expect(p.style.opacity).toBe('0');
  expect(p.getAnimations()).toHaveLength(0);
  expect(p.dataset.presence).toBe('entering');

  const exit = binding.setPresent(false);
  expect(p.getAnimations()).toHaveLength(1);
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  // The gate is still closed: the exit has finished, and the load is still pending.
  expect(await exit).toBe('finished');
  expect(textModule()).toBeUndefined();
  expect(p.dataset.presence).toBe('exiting');
});

it('an entry requested while the text loads holds the first frame, then plays split once the module is loaded', async () => {
  // The first test left the module loading: the gate is still closed.
  expect(textModule()).toBeUndefined();
  const p = document.createElement('p');
  p.textContent = 'Hello big world';
  root.append(p);
  const binding = bindTo(p, appear, { present: false });
  expect(p.style.opacity).toBe('0');

  const entering = binding.setPresent(true);
  for (let i = 0; i < 8; i++) await nextFrame();
  // Frames pass while the module is still pending: the element stays in its first frame, and nothing plays whole.
  expect(textModule()).toBeUndefined();
  expect(p.style.opacity).toBe('0');
  expect(p.getAnimations()).toHaveLength(0);
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  expect(p.dataset.presence).toBe('entering');

  gate.open();
  expect(await until(() => textModule() !== undefined)).toBe(true);
  expect(await entering).toBe('finished');
  const pieces = [...p.querySelectorAll<HTMLElement>('[data-udx-piece]')];
  expect(pieces.map(piece => piece.textContent)).toEqual(['Hello', 'big', 'world']);
  expect(pieces.every(piece => piece.style.opacity === '')).toBe(true);
  expect(pieces.every(piece => getComputedStyle(piece).opacity === '1')).toBe(true);
  expect(p.style.opacity).toBe('');
  expect(p.dataset.presence).toBe('present');
});
