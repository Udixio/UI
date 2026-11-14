import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, motion } from './bind.js';
import { connectMotion } from './connect.js';
import { defineMotion } from './define-motion.js';
import { fade, press } from './presets.js';
import { waapiProvider } from './providers/waapi.js';

defineMotion('connect-fade', fade.spec);
defineMotion('connect-press', press.spec);

const tick = () => Promise.resolve();

let root: HTMLElement;
let disconnect: (() => void) | undefined;

/** Connect the scanner to the test root, and remember it so that cleanup disconnects it. */
function connect(options: { development?: boolean } = {}): () => void {
  disconnect = connectMotion({ root, ...options });
  return disconnect;
}

function make(name: string, hidden = false): HTMLElement {
  const el = document.createElement('div');
  el.dataset.motion = name;
  el.hidden = hidden;
  return el;
}

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  disconnect?.();
  disconnect = undefined;
  root.remove();
  vi.restoreAllMocks();
});

it('leaves content present at connect untouched, and plays the entry of an element inserted later', async () => {
  const present = make('connect-fade');
  root.append(present);
  connect();
  await tick();
  expect(present.getAnimations()).toHaveLength(0);
  expect(present.style.opacity).toBe('');
  expect(present.dataset.presence).toBe('present');

  const inserted = make('connect-fade');
  root.append(inserted);
  await tick();
  expect(inserted.getAnimations()).toHaveLength(1);
  expect(await getMotion(inserted)!.setPresent(true)).toBe('finished');
  expect(inserted.style.opacity).toBe('1');
  expect(inserted.dataset.presence).toBe('present');
});

it('binds an element that is hidden at connect as absent', () => {
  const el = make('connect-fade', true);
  root.append(el);
  connect();
  expect(getMotion(el)?.present).toBe(false);
  expect(el.hidden).toBe(true);
  expect(el.getAnimations()).toHaveLength(0);
});

it('keeps a hidden element displayed and inert during its exit, then hides it', async () => {
  const el = make('connect-fade');
  root.append(el);
  connect();
  await tick();
  el.hidden = true;
  await tick();
  expect(el.hidden).toBe(true);
  expect(getComputedStyle(el).display).not.toBe('none');
  expect(el.hasAttribute('inert')).toBe(true);
  expect(await getMotion(el)!.setPresent(false)).toBe('finished');
  expect(el.style.display).toBe('');
  expect(getComputedStyle(el).display).toBe('none');
});

it('shows an element again when hidden is removed during its exit', async () => {
  const el = make('connect-fade');
  root.append(el);
  connect();
  await tick();
  el.hidden = true;
  await tick();
  el.hidden = false;
  await tick();
  expect(await getMotion(el)!.setPresent(true)).toBe('finished');
  expect(el.style.opacity).toBe('1');
  expect(el.hasAttribute('inert')).toBe(false);
  expect(el.style.display).toBe('');
  expect(getComputedStyle(el).display).not.toBe('none');
});

it('restores the inline display the author set once the exit ends', async () => {
  const el = make('connect-fade');
  el.style.display = 'flex';
  root.append(el);
  connect();
  await tick();
  el.hidden = true;
  await tick();
  expect(await getMotion(el)!.setPresent(false)).toBe('finished');
  expect(el.style.getPropertyValue('display')).toBe('flex');
  expect(el.style.getPropertyPriority('display')).toBe('');
});

it('plays an emphasis when data-state changes', async () => {
  const el = make('connect-press');
  root.append(el);
  connect();
  await tick();
  expect(el.getAnimations()).toHaveLength(0);
  el.dataset.state = 'pressed';
  await tick();
  expect(el.getAnimations()).toHaveLength(1);
});

it('inserts without animation under --udx-motion: none', async () => {
  root.style.setProperty('--udx-motion', 'none');
  connect();
  const el = make('connect-fade');
  root.append(el);
  await tick();
  expect(el.getAnimations()).toHaveLength(0);
  expect(el.style.opacity).toBe('1');
});

it('cancels the entry of an element removed mid-entry', async () => {
  connect();
  const el = make('connect-fade');
  root.append(el);
  await tick();
  expect(waapiProvider.activeCount()).toBe(1);
  el.remove();
  await tick();
  expect(getMotion(el)).toBeUndefined();
  expect(waapiProvider.activeCount()).toBe(0);
});

it('leaves an element with an undefined motion untouched, then binds it once defined', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  connect({ development: true });
  const first = make('connect-later');
  const second = make('connect-later');
  root.append(first, second);
  await tick();
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('"connect-later"');
  expect(String(error.mock.calls[0]?.[0])).toContain('connect-fade');
  expect(getMotion(first)).toBeUndefined();
  expect(first.hasAttribute('data-presence')).toBe(false);
  expect(first.getAnimations()).toHaveLength(0);

  defineMotion('connect-later', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
  expect(getMotion(first)?.present).toBe(true);
  expect(getMotion(second)?.present).toBe(true);
  expect(first.getAnimations()).toHaveLength(0);
  expect(error).toHaveBeenCalledTimes(1);
});

it('keeps the binding of a node moved within the root and starts no animation', async () => {
  const el = make('connect-fade');
  root.append(el);
  connect();
  const binding = getMotion(el);
  expect(binding).toBeDefined();
  const section = document.createElement('section');
  root.append(section);
  section.append(el);
  await tick();
  expect(getMotion(el)).toBe(binding);
  expect(el.getAnimations()).toHaveLength(0);
});

it('keeps a binding made by hand when its element leaves the root', async () => {
  connect();
  const el = make('connect-unknown-owner');
  root.append(el);
  await tick();
  const binding = motion(el, fade.spec, { settled: true });
  el.remove();
  await tick();
  expect(getMotion(el)).toBe(binding);
  binding.destroy();
});

it('destroys every binding on disconnect and ignores later insertions', async () => {
  const fadeEl = make('connect-fade');
  const pressEl = make('connect-press');
  root.append(fadeEl, pressEl);
  const stop = connect();
  expect(getMotion(fadeEl)).toBeDefined();
  expect(getMotion(pressEl)).toBeDefined();
  stop();
  expect(getMotion(fadeEl)).toBeUndefined();
  expect(getMotion(pressEl)).toBeUndefined();
  const late = make('connect-fade');
  root.append(late);
  await tick();
  expect(getMotion(late)).toBeUndefined();
  expect(late.getAnimations()).toHaveLength(0);
});
