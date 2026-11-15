import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, getMotions, motion } from './bind.js';
import { connectMotion } from './connect.js';
import { defineMotion } from './define-motion.js';
import { fade, press, reflow, slide } from './presets.js';
import { waapiProvider } from './providers/waapi.js';

defineMotion('connect-fade', fade.spec);
defineMotion('connect-press', press.spec);
defineMotion('connect-reflow', { verb: 'layout' });
defineMotion('connect-multi-fade', fade.spec);
defineMotion('connect-multi-reflow', { verb: 'layout' });
defineMotion('connect-multi-slide', slide.spec);

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

it('follows a layout change of its container with a layout flight', async () => {
  const style = document.createElement('style');
  style.textContent = `
    .connect-row { display: flex; justify-content: flex-start; width: 300px; height: 40px; }
    .connect-row.end { justify-content: flex-end; }
    .connect-row > div { flex: none; width: 50px; height: 40px; }
  `;
  const container = document.createElement('div');
  container.className = 'connect-row';
  const first = make('connect-reflow');
  const second = make('connect-reflow');
  container.append(first, second);
  root.append(style, container);
  connect();
  await tick();
  expect(getMotion(first)!.handle).toBeNull();

  container.classList.add('end');
  await tick();
  expect(getMotion(first)!.handle).not.toBeNull();
  expect(getMotion(second)!.handle).not.toBeNull();
});

it('ignores hidden on a layout element: no presence is set and no error is raised', async () => {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => errors.push(event.error);
  window.addEventListener('error', onError);
  const el = make('connect-reflow');
  root.append(el);
  connect();
  await tick();
  el.hidden = true;
  await tick();
  window.removeEventListener('error', onError);
  expect(errors).toEqual([]);
  expect(getMotion(el)).toBeDefined();
  expect(getMotion(el)!.present).toBe(true);
  expect(el.hasAttribute('data-presence')).toBe(false);
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

it('binds each name of data-motion: a presence and a layout, and hidden drives the presence', async () => {
  const el = make('connect-multi-fade connect-multi-reflow');
  root.append(el);
  connect();
  await tick();
  expect(getMotions(el).map(binding => binding.kind)).toEqual(['presence', 'layout']);
  el.hidden = true;
  await tick();
  expect(getMotion(el, 'presence')!.present).toBe(false);
  expect(el.hasAttribute('inert')).toBe(true);
  expect(getMotion(el, 'layout')!.handle).toBeNull();
});

it('binds the other names of an element at once, and a name undefined at connect waits alone', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  connect({ development: true });
  const el = make('connect-multi-fade connect-multi-later');
  root.append(el);
  await tick();
  expect(getMotion(el, 'presence')?.verb).toBe('appear');
  expect(getMotion(el, 'layout')).toBeUndefined();
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('"connect-multi-later"');

  defineMotion('connect-multi-later', { verb: 'layout' });
  expect(getMotion(el, 'layout')?.verb).toBe('layout');
  expect(getMotion(el, 'presence')?.verb).toBe('appear');
  expect(error).toHaveBeenCalledTimes(1);
});

it('ignores a second name of a kind the element already has, with one error in development', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  connect({ development: true });
  const el = make('connect-multi-fade connect-multi-slide');
  root.append(el);
  await tick();
  expect(getMotions(el)).toHaveLength(1);
  expect(el.getAnimations()).toHaveLength(1);
  expect((el.getAnimations()[0].effect as KeyframeEffect).getKeyframes().some(frame => frame.translate != null)).toBe(false);
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('"connect-multi-slide"');
  expect(String(error.mock.calls[0]?.[0])).toContain('"connect-multi-fade"');
});

it('removing the element destroys both bindings the scanner made', async () => {
  const el = make('connect-multi-fade connect-multi-reflow');
  root.append(el);
  connect();
  await tick();
  expect(getMotions(el)).toHaveLength(2);
  el.remove();
  await tick();
  expect(getMotions(el)).toHaveLength(0);
});

it('keeps a binding made by hand of a kind the scanner did not bind, when the element is removed', async () => {
  const el = make('connect-multi-fade');
  root.append(el);
  connect();
  await tick();
  const hand = motion(el, reflow);
  el.remove();
  await tick();
  expect(getMotion(el, 'layout')).toBe(hand);
  expect(getMotion(el, 'presence')).toBeUndefined();
  hand.destroy();
});

it('keeps a binding made by hand that replaced the scanner binding of its kind, when the element is removed', async () => {
  const el = make('connect-multi-fade');
  root.append(el);
  connect();
  await tick();
  const hand = motion(el, slide.spec);
  el.remove();
  await tick();
  expect(getMotion(el, 'presence')).toBe(hand);
  hand.destroy();
});
