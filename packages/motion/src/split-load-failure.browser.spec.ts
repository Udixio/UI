import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { motion, type MotionBinding } from './bind.js';
import type { MotionSpec } from './define-motion.js';
import { textModule } from './feature-loader.js';

// This file never imports the text entry, and the load of the text module fails: `loadText` rejects once the gate opens.
// The failure is made in the loader, not by a throwing module factory, which the browser mocker reports as an error of
// the run. The rest of the loader is the real one.
const gate = vi.hoisted(() => {
  let open!: () => void;
  const opened = new Promise<void>(resolve => {
    open = resolve;
  });
  return { opened, open };
});

vi.mock('./feature-loader.js', async importOriginal => {
  const actual = await importOriginal<typeof import('./feature-loader.js')>();
  return {
    ...actual,
    loadText: () => gate.opened.then(() => Promise.reject(new Error('the text module failed to load'))),
  };
});

const appear: Extract<MotionSpec, { verb: 'appear' | 'disappear' }> = {
  verb: 'appear',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
  split: 'words',
};

let root: HTMLElement;
let bindings: MotionBinding[];

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  bindings = [];
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  root.remove();
});

it('an entry whose text module fails to load plays the element whole, and makes no split', async () => {
  expect(textModule()).toBeUndefined();
  const p = document.createElement('p');
  p.textContent = 'Hello big world';
  root.append(p);
  const binding = motion(p, appear, { present: false });
  bindings.push(binding);
  const entering = binding.setPresent(true);
  expect(p.style.opacity).toBe('0');
  for (let i = 0; i < 8; i++) await nextFrame();
  expect(p.getAnimations()).toHaveLength(0);

  gate.open();
  expect(await entering).toBe('finished');
  expect(textModule()).toBeUndefined();
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  expect(getComputedStyle(p).opacity).toBe('1');
  expect(p.dataset.motionPresence).toBe('present');
});
