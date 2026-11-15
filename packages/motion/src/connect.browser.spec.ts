import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, getMotions, motion, motionWhenDefined } from './bind.js';
import { connectMotion } from './connect.js';
import { defineMotion } from './define-motion.js';
import { fade, press, reflow, slide } from './presets.js';
import { waapiProvider } from './providers/waapi.js';
import { loadLayoutEngine } from './layout-loader.js';

// The layout motions of this file follow at once: the engine is loaded before the first test.
await loadLayoutEngine();

defineMotion('connect-fade', fade.spec);
defineMotion('connect-press', press.spec);
defineMotion('connect-reflow', { verb: 'layout' });
defineMotion('connect-multi-fade', fade.spec);
defineMotion('connect-multi-reflow', { verb: 'layout' });
defineMotion('connect-multi-slide', slide.spec);
defineMotion('connect-exit-fade', fade.spec);
defineMotion('connect-exit-reflow', { verb: 'layout' });
defineMotion('connect-exit-out', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }], exit: 'out-of-flow' });
defineMotion('connect-shared-move', { verb: 'layout' });
defineMotion('connect-rise', { verb: 'reveal', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
defineMotion('connect-loop', { verb: 'loop', keyframes: [{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }], pause: 'control' });

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

/** Three items in a relative column under the test root: 40px high, with 8px below each one, scanned with `name`. */
function column(name: string): HTMLElement[] {
  root.style.position = 'relative';
  const style = document.createElement('style');
  style.textContent = '.exit-item { height: 40px; margin-bottom: 8px; }';
  const items = [0, 1, 2].map(() => {
    const el = make(name);
    el.classList.add('exit-item');
    return el;
  });
  root.append(style, ...items);
  return items;
}

/** Whether an element is moving: a layout move animates its translate. */
function movingOnTranslate(element: HTMLElement): boolean {
  return element.getAnimations().some(animation => (animation.effect as KeyframeEffect).getKeyframes().some(frame => frame.translate != null));
}

/** Resolve once no animation under the test root is still playing, the moves that a finished one starts included. */
async function settle(): Promise<void> {
  const playing = () => root.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running');
  while (playing().length > 0) await Promise.allSettled(playing().map(animation => animation.finished));
}

/** The top edge of the element is at `top`, within half a pixel. */
function expectTop(el: HTMLElement, top: number): void {
  const measured = el.getBoundingClientRect().top;
  expect(Math.abs(measured - top), `top measured ${measured}, expected ${top}`).toBeLessThanOrEqual(0.5);
}

it('a leaving item keeps its place during its exit, and its neighbours move once it is gone', async () => {
  const [first, second, third] = column('connect-exit-fade connect-exit-reflow');
  connect();
  await tick();
  const tops = [first, second, third].map(el => el.getBoundingClientRect().top);
  first.hidden = true;
  await tick();
  expect(getComputedStyle(first).display).not.toBe('none');
  expectTop(second, tops[1]);
  expectTop(third, tops[2]);
  expect(second.getAnimations()).toHaveLength(0);
  expect(third.getAnimations()).toHaveLength(0);
  await getMotion(first, 'presence')!.setPresent(false);
  await tick();
  expect(getComputedStyle(first).display).toBe('none');
  expect(movingOnTranslate(second)).toBe(true);
  expect(movingOnTranslate(third)).toBe(true);
  await settle();
  expectTop(second, tops[0]);
  expectTop(third, tops[1]);
});

it('a finished in-place exit: removing hidden shows the element again, and its neighbours make room', async () => {
  const [first, second, third] = column('connect-exit-fade connect-exit-reflow');
  connect();
  await tick();
  const tops = [first, second, third].map(el => el.getBoundingClientRect().top);
  first.hidden = true;
  await tick();
  await getMotion(first, 'presence')!.setPresent(false);
  await tick();
  await settle();
  expect(getComputedStyle(first).display).toBe('none');
  expectTop(second, tops[0]);
  expectTop(third, tops[1]);

  first.hidden = false;
  await tick();
  expect(movingOnTranslate(second)).toBe(true);
  expect(movingOnTranslate(third)).toBe(true);
  expect(await getMotion(first, 'presence')!.setPresent(true)).toBe('finished');
  await settle();
  expect(getComputedStyle(first).display).not.toBe('none');
  expect(first.dataset.presence).toBe('present');
  expect(getMotion(first, 'presence')!.present).toBe(true);
  expectTop(first, tops[0]);
  expectTop(second, tops[1]);
  expectTop(third, tops[2]);
});

it('out-of-flow: a leaving item is taken out of the flow as its exit starts, and its neighbours move at once', async () => {
  const [first, second, third] = column('connect-exit-out connect-exit-reflow');
  connect();
  await tick();
  const tops = [first, second, third].map(el => el.getBoundingClientRect().top);
  first.hidden = true;
  await tick();
  expect(first.style.getPropertyValue('position')).toBe('absolute');
  expectTop(first, tops[0]);
  expect(movingOnTranslate(second)).toBe(true);
  expect(movingOnTranslate(third)).toBe(true);
  await getMotion(first, 'presence')!.setPresent(false);
  await tick();
  expect(getComputedStyle(first).display).toBe('none');
  await settle();
  expectTop(second, tops[0]);
  expectTop(third, tops[1]);
});

/** A thumbnail (60 x 40, shown) and a card (300 x 200, hidden), apart from each other, both layout motions of the scanner under their keys. */
function sharedPair(thumbKey: string, cardKey: string): { thumb: HTMLElement; card: HTMLElement } {
  const style = document.createElement('style');
  style.textContent = `
    .shared-thumb { position: absolute; left: 20px; top: 30px; width: 60px; height: 40px; }
    .shared-card { position: absolute; left: 200px; top: 100px; width: 300px; height: 200px; }
  `;
  const thumb = make('connect-shared-move');
  thumb.classList.add('shared-thumb');
  thumb.dataset.motionShared = thumbKey;
  const card = make('connect-shared-move', true);
  card.classList.add('shared-card');
  card.dataset.motionShared = cardKey;
  root.append(style, thumb, card);
  return { thumb, card };
}

/** Hides the thumbnail and shows the card in one task: the card has a move in flight, starting at the thumbnail's rect within 1 px. */
async function swapToCard(thumb: HTMLElement, card: HTMLElement): Promise<void> {
  const from = thumb.getBoundingClientRect();
  thumb.hidden = true;
  card.hidden = false;
  await tick();
  expect(getMotion(card, 'layout')!.handle).not.toBeNull();
  const start = card.getBoundingClientRect();
  for (const key of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(start[key] - from[key]), `${key} measured ${start[key]}, expected ${from[key]}`).toBeLessThanOrEqual(1);
  }
}

it('a card shown in place of a thumbnail with the same data-motion-shared moves from the thumbnail place', async () => {
  const { thumb, card } = sharedPair('pic', 'pic');
  connect();
  await tick();
  await swapToCard(thumb, card);
});

it('changing data-motion-shared rebinds the layout motion alone: the presence keeps its binding', async () => {
  const el = make('connect-multi-fade connect-shared-move');
  el.dataset.motionShared = 'frame-1';
  root.append(el);
  connect();
  await tick();
  const presence = getMotion(el, 'presence');
  const layout = getMotion(el, 'layout');
  expect(presence).toBeDefined();
  expect(layout).toBeDefined();

  el.dataset.motionShared = 'frame-2';
  await tick();

  expect(getMotion(el, 'layout')).toBeDefined();
  expect(getMotion(el, 'layout')).not.toBe(layout);
  expect(getMotion(el, 'presence')).toBe(presence);
});

it('a changed data-motion-shared is the key the layout motion is bound under: the card moves from the thumbnail under it', async () => {
  const { thumb, card } = sharedPair('frame-3', 'frame-4');
  connect();
  await tick();
  card.dataset.motionShared = 'frame-3';
  await tick();
  await swapToCard(thumb, card);
});

it('an invalid data-motion-shared is reported once and bound without a key: the scan goes on, and no exception escapes', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => errors.push(event.error);
  window.addEventListener('error', onError);
  const bad = make('connect-shared-move');
  bad.dataset.motionShared = 'Pic';
  const valid = make('connect-fade');
  root.append(bad, valid);

  expect(() => connect({ development: true })).not.toThrow();
  await tick();
  expect(getMotion(valid)).toBeDefined();
  expect(getMotion(bad, 'layout')).toBeDefined();
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('data-motion-shared="Pic"');

  bad.dataset.motionShared = 'Bad Key';
  await tick();
  window.removeEventListener('error', onError);
  expect(errors).toEqual([]);
  expect(getMotion(bad, 'layout')).toBeDefined();
  expect(error).toHaveBeenCalledTimes(2);
  expect(String(error.mock.calls[1]?.[0])).toContain('data-motion-shared="Bad Key"');
});

it('skips a loop that is not bound yet: no exception escapes, one error in development, the element untouched', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const el = make('connect-loop');
  root.append(el);
  expect(() => connect({ development: true })).not.toThrow();
  await tick();
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('connect-loop');
  expect(getMotion(el)).toBeUndefined();
  expect(el.getAttribute('style')).toBeNull();
  expect(el.hasAttribute('data-presence')).toBe(false);
});

it('refuses a loop before it registers anything, and motionWhenDefined does not throw', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  for (const [name, verb] of [['connect-loop', 'loop']] as const) {
    const el = make(name);
    expect(() => motion(el, name)).toThrow(`${verb} motions are not bound yet`);
    expect(getMotion(el)).toBeUndefined();
    expect(el.getAttribute('style')).toBeNull();
    const deferred = motionWhenDefined(el, name, { development: true });
    expect(deferred.binding).toBeUndefined();
    expect(getMotion(el)).toBeUndefined();
    expect(el.getAttribute('style')).toBeNull();
  }
  expect(error).toHaveBeenCalledTimes(1);
});
