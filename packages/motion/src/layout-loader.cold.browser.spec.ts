import { afterEach, expect, it } from 'vitest';
import { getMotion, motion, type MotionBinding } from './bind.js';
import { defineMotion } from './define-motion.js';
import { layoutEngine, loadLayoutEngine } from './layout-loader.js';
import { reflow } from './presets.js';

// This file runs with the engine cold, and its tests run in order: the test that loads the engine must stay last.

const out = defineMotion('cold-out', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }], exit: 'out-of-flow' });

const css = `
  .row { display: flex; justify-content: flex-start; width: 300px; height: 40px; }
  .row.end { justify-content: flex-end; }
  .box { flex: none; width: 50px; height: 40px; }
`;

let host: HTMLElement;
let style: HTMLStyleElement;
const bindings: MotionBinding[] = [];

const byId = (id: string) => document.getElementById(id) as HTMLElement;

function page(markup: string): void {
  style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
}

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  host.remove();
  style.remove();
});

it('[Review Focus 3] an out-of-flow exit with no layout motion bound neither fails nor loads the engine', async () => {
  page('<div id="col"><div class="box" id="a"></div><div class="box" id="b"></div><div class="box" id="c"></div></div>');
  const binding = motion(byId('a'), out, { settled: true });
  bindings.push(binding);
  expect(await binding.setPresent(false)).toBe('finished');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(layoutEngine()).toBeUndefined();
});

it('[Review Focus 2] a layout motion destroyed before the engine loads never follows, once it is loaded', async () => {
  page('<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  expect(layoutEngine()).toBeUndefined();
  const binding = motion(box, reflow);
  binding.destroy();
  await loadLayoutEngine();
  expect(layoutEngine()).toBeDefined();
  row.classList.add('end');
  await Promise.resolve();
  expect(box.getAnimations()).toHaveLength(0);
  expect(binding.handle).toBeNull();
  expect(getMotion(box, 'layout')).toBeUndefined();
  expect(box.style.translate).toBe('');
});
