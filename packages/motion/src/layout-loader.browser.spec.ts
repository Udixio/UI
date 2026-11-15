import { afterEach, beforeEach, expect, it } from 'vitest';
import { motion, type MotionBinding } from './bind.js';
import { layoutEngine, loadLayoutEngine } from './layout-loader.js';
import { reflow } from './presets.js';

// The first test checks a cold page, so it must run before anything loads the engine: this file does not load it at
// its top level, and its tests run in order.

type Rect = { left: number; top: number; width: number; height: number };

const css = `
  .row { display: flex; justify-content: flex-start; width: 300px; height: 40px; }
  .row.end { justify-content: flex-end; }
  .box { flex: none; width: 50px; height: 40px; }
`;

let host: HTMLElement;
let style: HTMLStyleElement;
let bindings: MotionBinding[];

const byId = (id: string) => document.getElementById(id) as HTMLElement;

/** The box of `element` relative to `origin`, so that the page position and scrolling do not matter. */
function local(element: HTMLElement, origin: HTMLElement): Rect {
  const r = element.getBoundingClientRect();
  const o = origin.getBoundingClientRect();
  return { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height };
}

function expectNear(actual: Rect, expected: Rect, tolerance: number): void {
  for (const key of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `${key} measured ${actual[key]}, expected ${expected[key]}`).toBeLessThanOrEqual(tolerance);
  }
}

function page(markup: string): void {
  style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
}

beforeEach(() => {
  bindings = [];
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  host.remove();
  style.remove();
});

it('[Review Focus 1] on a cold page a layout motion follows only once the engine is loaded', async () => {
  page('<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  expect(layoutEngine()).toBeUndefined();
  const binding = motion(box, reflow);
  bindings.push(binding);
  expect(binding.verb).toBe('layout');
  expect(binding.handle).toBeNull();
  row.classList.add('end');
  await Promise.resolve();
  expect(box.getAnimations()).toHaveLength(0);

  await loadLayoutEngine();
  expect(layoutEngine()).toBeDefined();
  row.classList.remove('end');
  await Promise.resolve();
  const handle = binding.handle;
  if (!handle) throw new Error('no move in flight');
  await handle.finished;
  expectNear(local(box, row), { left: 0, top: 0, width: 50, height: 40 }, 0.5);
  expect(box.style.translate).toBe('');
  expect(box.style.scale).toBe('');
  expect(box.getAnimations()).toHaveLength(0);
});

it('loadLayoutEngine() called again resolves at once, and keeps the same engine', async () => {
  const first = loadLayoutEngine();
  const second = loadLayoutEngine();
  await expect(first).resolves.toBeUndefined();
  await expect(second).resolves.toBeUndefined();
  const engine = layoutEngine();
  expect(engine).toBeDefined();
  await loadLayoutEngine();
  expect(layoutEngine()).toBe(engine);
});
