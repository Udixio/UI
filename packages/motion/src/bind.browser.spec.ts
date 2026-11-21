import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, getMotions, motion, motionsWhenDefined, motionWhenDefined, type DeferredMotion, type MotionBinding, type MotionSource } from './bind.js';
import { defineMotion, type MotionSpec } from './define-motion.js';
import { fade, press, reflow, shake, slide } from './presets.js';
import { waapiProvider } from './providers/waapi.js';
import { loadLayoutEngine } from './layout-loader.js';

// The layout motions of this file follow at once: the engine is loaded before the first test.
await loadLayoutEngine();

const disappear: MotionSpec = { verb: 'disappear', keyframes: [{ opacity: 1 }, { opacity: 0 }] };
/** A reveal without a stagger: a single element, so that its replay is a single animation. */
const reveal: MotionSpec = { verb: 'reveal', keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }] };
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

let target: HTMLElement;
let bindings: MotionBinding[];
let deferreds: DeferredMotion[];

/** Bind and remember the binding so that cleanup destroys it. */
function bindTo(...args: Parameters<typeof motion>): MotionBinding {
  const binding = motion(...args);
  bindings.push(binding);
  return binding;
}

/** Bind when defined and remember the handle so that cleanup destroys it. */
function deferTo(...args: Parameters<typeof motionWhenDefined>): DeferredMotion {
  const deferred = motionWhenDefined(...args);
  deferreds.push(deferred);
  return deferred;
}

/** Bind a list when defined and remember its motions so that cleanup destroys them. */
function listTo(...args: Parameters<typeof motionsWhenDefined>): DeferredMotion[] {
  const motions = motionsWhenDefined(...args);
  deferreds.push(...motions);
  return motions;
}

beforeEach(() => {
  target = document.createElement('div');
  document.body.append(target);
  bindings = [];
  deferreds = [];
});

afterEach(() => {
  for (const deferred of deferreds) deferred.destroy();
  for (const binding of bindings) binding.destroy();
  target.remove();
  for (const probe of document.querySelectorAll('[data-focus-probe]')) probe.remove();
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

it('writes its first frame at the motion scale, where a hidden appear begins: at 0.5 it is 12px lower', () => {
  target.style.setProperty('--udx-motion-scale', '0.5');
  bindTo(target, slide, { present: false });
  const [x = '0', y = '0'] = getComputedStyle(target).translate.split(' ');
  expect([parseFloat(x), parseFloat(y)]).toEqual([0, 12]);
});

it('binds an element the server marked present settled: no entry replays, and nothing is written inline', () => {
  target.setAttribute('data-motion-presence', 'present');
  const binding = bindTo(target, fade);
  expect(binding.present).toBe(true);
  expect(target.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe('');
  expect(target.getAttribute('data-motion-presence')).toBe('present');
});

it('replays the entry of a marked element when settled is asked false', () => {
  target.setAttribute('data-motion-presence', 'present');
  bindTo(target, fade, { settled: false });
  expect(target.getAnimations()).toHaveLength(1);
});

it('plays a fade on bind and marks the element present when it ends', async () => {
  const binding = bindTo(target, fade);
  expect(target.dataset.motionPresence).toBe('entering');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.dataset.motionPresence).toBe('present');
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(waapiProvider.activeCount()).toBe(0);
});

it('leaves a settled element in place without animating', () => {
  target.style.opacity = '0.5';
  const binding = bindTo(target, fade, { settled: true });
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe('0.5');
  expect(target.dataset.motionPresence).toBe('present');
  expect(binding.handle).toBeNull();
});

it('applies the first frame without animation when not present, then enters from it', async () => {
  const binding = bindTo(target, fade, { present: false });
  expect(binding.present).toBe(false);
  expect(target.style.opacity).toBe('0');
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.motionPresence).toBe('exiting');
  expect(target.hasAttribute('inert')).toBe(true);
  expect(await binding.setPresent(false)).toBe('finished');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(target.hasAttribute('inert')).toBe(false);
});

it('interrupts an exit with an entry: inert goes at once and the exit resolves cancelled', async () => {
  const binding = bindTo(target, fade);
  await binding.setPresent(true);
  const exit = binding.setPresent(false);
  expect(target.dataset.motionPresence).toBe('exiting');
  expect(target.hasAttribute('inert')).toBe(true);
  const enter = binding.setPresent(true);
  expect(target.hasAttribute('inert')).toBe(false);
  expect(target.dataset.motionPresence).toBe('entering');
  expect(await exit).toBe('cancelled');
  expect(await enter).toBe('finished');
  expect(target.dataset.motionPresence).toBe('present');
});

it('gives focus back in the same task that an entry cancels an exit: inert is gone when setPresent(true) returns', async () => {
  target.tabIndex = -1;
  const binding = bindTo(target, fade);
  await binding.setPresent(true);
  const exit = binding.setPresent(false);
  const enter = binding.setPresent(true);
  expect(target.hasAttribute('inert')).toBe(false);
  target.focus();
  expect(document.activeElement).toBe(target);
  expect(await exit).toBe('cancelled');
  expect(await enter).toBe('finished');
});

it('under reduced motion, an entry that meets an exit gives focus back in the same task', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  target.tabIndex = -1;
  const binding = bindTo(target, fade, { settled: true });
  const exit = binding.setPresent(false);
  expect(target.hasAttribute('inert')).toBe(true);
  const enter = binding.setPresent(true);
  expect(target.hasAttribute('inert')).toBe(false);
  target.focus();
  expect(document.activeElement).toBe(target);
  await exit;
  expect(await enter).toBe('finished');
});

it('gives focus back at once to an element present again after its exit has ended', async () => {
  target.tabIndex = -1;
  const binding = bindTo(target, fade);
  await binding.setPresent(true);
  expect(await binding.setPresent(false)).toBe('finished');
  expect(target.hasAttribute('inert')).toBe(true);
  const enter = binding.setPresent(true);
  expect(target.hasAttribute('inert')).toBe(false);
  target.focus();
  expect(document.activeElement).toBe(target);
  expect(await enter).toBe('finished');
});

it('under reduced motion, gives focus back at once to an element present again after its exit has ended', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  target.tabIndex = -1;
  const binding = bindTo(target, fade, { settled: true });
  expect(await binding.setPresent(false)).toBe('finished');
  expect(target.hasAttribute('inert')).toBe(true);
  const enter = binding.setPresent(true);
  expect(target.hasAttribute('inert')).toBe(false);
  target.focus();
  expect(document.activeElement).toBe(target);
  expect(await enter).toBe('finished');
});

// Focus in a presence exit (WCAG 2.4.3): with focus inside, the exit moves it to `restoreFocus` before inert is set; without a
// target, the element stays focusable until focus leaves it, and inert waits for that or for the end of the exit.
/** An element outside the target, that focus can go to; the afterEach removes it. */
function outsideProbe(tag: 'button' | 'div' = 'button'): HTMLElement {
  const probe = document.createElement(tag);
  probe.setAttribute('data-focus-probe', '');
  document.body.append(probe);
  return probe;
}

/** A focusable button inside the target, focused by the test. */
function focusedButton(): HTMLButtonElement {
  const button = document.createElement('button');
  target.append(button);
  button.focus();
  return button;
}

it('moves focus to restoreFocus before inert is set when an exit starts with focus inside', async () => {
  const back = outsideProbe();
  const inertAtArrival: boolean[] = [];
  back.addEventListener('focus', () => inertAtArrival.push(target.hasAttribute('inert')));
  focusedButton();
  const binding = bindTo(target, fade, { settled: true, restoreFocus: back });
  const exit = binding.setPresent(false);
  expect(document.activeElement).toBe(back);
  expect(inertAtArrival).toEqual([false]);
  expect(target.hasAttribute('inert')).toBe(true);
  expect(target.dataset.motionPresence).toBe('exiting');
  expect(await exit).toBe('finished');
});

it('reads a restoreFocus function when the exit starts, not when it is bound', async () => {
  const back = outsideProbe();
  const restore = vi.fn(() => back);
  focusedButton();
  const binding = bindTo(target, fade, { settled: true, restoreFocus: restore });
  expect(restore).not.toHaveBeenCalled();
  const exit = binding.setPresent(false);
  expect(restore).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(back);
  await exit;
});

it('gives a non-focusable restoreFocus target a tabindex of -1 for the move, and takes it back once focus leaves', async () => {
  const dest = outsideProbe('div');
  focusedButton();
  const binding = bindTo(target, fade, { settled: true, restoreFocus: dest });
  const exit = binding.setPresent(false);
  expect(document.activeElement).toBe(dest);
  expect(dest.getAttribute('tabindex')).toBe('-1');
  dest.blur();
  expect(dest.hasAttribute('tabindex')).toBe(false);
  await exit;
});

it('keeps the tabindex of a restoreFocus target that has one', async () => {
  const dest = outsideProbe('div');
  dest.setAttribute('tabindex', '-1');
  focusedButton();
  const binding = bindTo(target, fade, { settled: true, restoreFocus: dest });
  const exit = binding.setPresent(false);
  expect(document.activeElement).toBe(dest);
  dest.blur();
  expect(dest.getAttribute('tabindex')).toBe('-1');
  await exit;
});

it('leaves focus where it is when an exit starts with focus outside the element, and sets inert at once', async () => {
  const back = outsideProbe();
  const outside = outsideProbe();
  outside.focus();
  const binding = bindTo(target, fade, { settled: true, restoreFocus: back });
  const exit = binding.setPresent(false);
  expect(document.activeElement).toBe(outside);
  expect(target.hasAttribute('inert')).toBe(true);
  await exit;
});

it('without restoreFocus, keeps an element with focus inside focusable until its exit ends, and warns once', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const button = focusedButton();
  const binding = bindTo(target, fade, { settled: true, development: true });
  const exit = binding.setPresent(false);
  expect(target.hasAttribute('inert')).toBe(false);
  expect(document.activeElement).toBe(button);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(String(warn.mock.calls[0]?.[0])).toContain('restoreFocus');
  expect(await exit).toBe('finished');
  expect(target.hasAttribute('inert')).toBe(true);
  // A second exit with focus inside again: the element was warned about already.
  await binding.setPresent(true);
  focusedButton().focus();
  await binding.setPresent(false);
  expect(warn).toHaveBeenCalledTimes(1);
});

it('without restoreFocus, sets inert once focus leaves the element during its exit', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const outside = outsideProbe();
  focusedButton();
  const binding = bindTo(target, fade, { settled: true, development: true });
  const exit = binding.setPresent(false);
  expect(target.hasAttribute('inert')).toBe(false);
  outside.focus();
  expect(target.hasAttribute('inert')).toBe(true);
  expect(await exit).toBe('finished');
  expect(warn).toHaveBeenCalledTimes(1);
});

it('an entry during the wait for focus ends the wait: inert is not set when focus later leaves', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const outside = outsideProbe();
  focusedButton();
  const binding = bindTo(target, fade, { settled: true, development: true });
  const exit = binding.setPresent(false);
  const enter = binding.setPresent(true);
  expect(await exit).toBe('cancelled');
  outside.focus();
  expect(target.hasAttribute('inert')).toBe(false);
  expect(await enter).toBe('finished');
});

it('destroying the binding during the wait for focus leaves no inert and no listener behind', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const outside = outsideProbe();
  focusedButton();
  const binding = bindTo(target, fade, { settled: true, development: true });
  binding.setPresent(false);
  binding.destroy();
  outside.focus();
  expect(target.hasAttribute('inert')).toBe(false);
  expect(target.hasAttribute('data-motion-presence')).toBe(false);
});

it('keeps one active batch when an emphasis is played twice in a row', () => {
  const binding = bindTo(target, press);
  binding.play();
  const second = binding.play();
  expect(binding.handle).toBe(second);
  expect(waapiProvider.activeCount()).toBe(1);
});

it('plays a disappear entry instantly and its keyframes forward on exit', async () => {
  const binding = bindTo(target, disappear, { present: false });
  expect(target.style.opacity).toBe('0');
  binding.setPresent(true);
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.motionPresence).toBe('present');
  const exit = binding.setPresent(false);
  expect(waapiProvider.activeCount()).toBe(1);
  expect(await exit).toBe('finished');
  expect(target.style.opacity).toBe('0');
  expect(target.dataset.motionPresence).toBe('exiting');
});

it('rejects setPresent on an emphasis, and play on a presence verb, with a TypeError', () => {
  const presence = bindTo(target, fade);
  expect(() => presence.play()).toThrow(TypeError);
  const emphasis = bindTo(target, press);
  expect(() => emphasis.setPresent(false)).toThrow(TypeError);
});

it('resolves a motion name through the registry and rejects an unknown one', () => {
  expect(bindTo(target, 'fade').handle).not.toBeNull();
  expect(() => motion(target, 'no-such-motion')).toThrow(/no-such-motion/);
});

it('finds the binding of an element, and forgets it after destroy', () => {
  const binding = bindTo(target, fade, { present: false });
  expect(getMotion(target)).toBe(binding);
  binding.destroy();
  expect(getMotion(target)).toBeUndefined();
  expect(target.hasAttribute('data-motion-presence')).toBe(false);
  expect(target.hasAttribute('inert')).toBe(false);
});

it('removes an inert it set on destroy but keeps one the author set', () => {
  target.setAttribute('inert', '');
  const binding = bindTo(target, fade, { present: false });
  binding.destroy();
  expect(target.hasAttribute('data-motion-presence')).toBe(false);
  expect(target.hasAttribute('inert')).toBe(true);
});

it('destroys the previous binding of an element, and a stale destroy keeps the newer one', () => {
  const first = bindTo(target, fade);
  const second = bindTo(target, fade);
  expect(getMotion(target)).toBe(second);
  expect(waapiProvider.activeCount()).toBe(1);
  first.destroy();
  expect(getMotion(target)).toBe(second);
});

it('lands ten alternating presence toggles in one task on the last state', async () => {
  const binding = bindTo(target, fade);
  let last!: Promise<'finished' | 'cancelled'>;
  for (let i = 0; i < 10; i++) last = binding.setPresent(i % 2 === 1);
  expect(await last).toBe('finished');
  expect(binding.present).toBe(true);
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(target.hasAttribute('inert')).toBe(false);
  expect(target.dataset.motionPresence).toBe('present');
  expect(waapiProvider.activeCount()).toBe(0);
});

it('lands a running entry at once when the policy turns reduced', async () => {
  const binding = bindTo(target, fade);
  const entry = binding.setPresent(true);
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  await nextFrame();
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(await entry).toBe('finished');
});

it('under reduced motion an absent element hides its opacity only: its box stays where it is while present', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const binding = bindTo(target, slide, { present: false, settled: true });
  expect(target.style.opacity).toBe('0');
  expect(target.style.translate).toBe('');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(target.style.translate).toBe('');
});

it('under reduced motion an exit fades in place, and leaves no inline box behind', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const binding = bindTo(target, slide, { settled: true });
  const leaving = binding.setPresent(false);
  expect(target.style.translate).toBe('');
  expect(await leaving).toBe('finished');
  expect(getComputedStyle(target).opacity).toBe('0');
  expect(target.style.translate).toBe('');
});

it('writes the exited frame of an absent element even when it is settled', async () => {
  const binding = bindTo(target, fade, { present: false, settled: true });
  expect(target.style.opacity).toBe('0');
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.motionPresence).toBe('exiting');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('releases the inline opacity it wrote when destroyed mid-motion', async () => {
  const binding = bindTo(target, fade);
  binding.setPresent(false);
  await nextFrame();
  binding.setPresent(true);
  expect(target.style.opacity).not.toBe('');
  binding.destroy();
  expect(target.style.opacity).toBe('');
});

it('releases the exited frame it wrote when destroyed while absent', () => {
  const binding = bindTo(target, fade, { present: false });
  expect(target.style.opacity).toBe('0');
  binding.destroy();
  expect(target.style.opacity).toBe('');
});

it('exposes the verb of its motion on the binding', () => {
  expect(bindTo(target, press).verb).toBe('emphasize');
});

it('binds a motion whose name is already defined at once, with its entry', () => {
  const deferred = deferTo(target, 'fade');
  expect(deferred.binding?.present).toBe(true);
  expect(target.dataset.motionPresence).toBe('entering');
  expect(waapiProvider.activeCount()).toBe(1);
});

it('leaves an element untouched while its motion is undefined, then binds it settled once defined', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const deferred = deferTo(target, 'when-defined-later', { development: true });
  expect(deferred.binding).toBeUndefined();
  expect(target.getAttribute('style')).toBeNull();
  expect(target.hasAttribute('data-motion-presence')).toBe(false);
  expect(target.hasAttribute('inert')).toBe(false);
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('"when-defined-later"');

  defineMotion('when-defined-later', fade.spec);
  expect(deferred.binding?.present).toBe(true);
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.motionPresence).toBe('present');
});

it('binds nothing when destroyed before its name is defined', () => {
  const deferred = deferTo(target, 'when-defined-destroyed');
  deferred.destroy();
  defineMotion('when-defined-destroyed', fade.spec);
  expect(deferred.binding).toBeUndefined();
  expect(getMotion(target)).toBeUndefined();
});

it('destroys its binding when destroyed after the binding exists', () => {
  const deferred = deferTo(target, 'fade');
  deferred.destroy();
  expect(getMotion(target)).toBeUndefined();
  expect(waapiProvider.activeCount()).toBe(0);
});

it('throws a TypeError for an invalid spec, whatever the definition state', () => {
  expect(() => deferTo(target, { verb: 'nope', keyframes: [] } as unknown as MotionSpec)).toThrow(TypeError);
});

it('holds one binding of each kind on an element, and reads each one by its kind', () => {
  const presence = bindTo(target, fade);
  const layout = bindTo(target, reflow);
  const all = getMotions(target);
  expect(all).toHaveLength(2);
  expect(all[0]).toBe(presence);
  expect(all[1]).toBe(layout);
  expect(getMotion(target)).toBe(presence);
  expect(getMotion(target, 'layout')).toBe(layout);
  expect(getMotion(target, 'emphasis')).toBeUndefined();
  expect(presence.kind).toBe('presence');
  expect(layout.kind).toBe('layout');
  expect(layout.verb).toBe('layout');
});

it('lists the bindings of an element in the order presence, emphasis, layout', () => {
  bindTo(target, reflow);
  bindTo(target, press);
  bindTo(target, fade);
  expect(getMotions(target).map(binding => binding.kind)).toEqual(['presence', 'emphasis', 'layout']);
  expect(getMotion(target)?.kind).toBe('presence');
});

it('a motion of a kind the element already holds destroys that binding, and keeps the others', () => {
  const presence = bindTo(target, fade);
  const layout = bindTo(target, reflow);
  const replacement = bindTo(target, slide);
  expect(getMotions(target)).toHaveLength(2);
  expect(getMotion(target)).toBe(replacement);
  expect(getMotion(target, 'layout')).toBe(layout);
  expect(presence.handle).toBeNull();
  expect(target.dataset.motionPresence).toBe('entering');
});

it('destroying one kind leaves the other registered and working, and the last destroy empties the element', async () => {
  const presence = bindTo(target, fade);
  await presence.setPresent(true);
  const layout = bindTo(target, reflow);
  layout.destroy();
  expect(getMotions(target)).toHaveLength(1);
  expect(getMotion(target)).toBe(presence);
  expect(await presence.setPresent(false)).toBe('finished');
  expect(target.dataset.motionPresence).toBe('exiting');
  presence.destroy();
  expect(getMotions(target)).toHaveLength(0);
  expect(getMotion(target)).toBeUndefined();
});

const out: MotionSpec = { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }], exit: 'out-of-flow' };
const INLINE_LAYOUT = ['position', 'left', 'top', 'width', 'height', 'margin', 'box-sizing'];

/** Three items in a relative column (the test target): 40px high, with 8px below each one, from a stylesheet, not inline. */
function column(): HTMLElement[] {
  target.style.position = 'relative';
  const style = document.createElement('style');
  style.textContent = '.item { height: 40px; margin-bottom: 8px; }';
  const items = [0, 1, 2].map(() => {
    const item = document.createElement('div');
    item.className = 'item';
    return item;
  });
  target.append(style, ...items);
  return items;
}

/** Three items, each bound to the presence motion and to a layout. */
function listOf(presence: MotionSource): HTMLElement[] {
  const items = column();
  for (const item of items) {
    bindTo(item, presence, { settled: true });
    bindTo(item, reflow);
  }
  return items;
}

/** Whether an element is moving: a layout move animates its translate. */
function movingOnTranslate(element: HTMLElement): boolean {
  return element.getAnimations().some(animation => (animation.effect as KeyframeEffect).getKeyframes().some(frame => frame.translate != null));
}

/** Resolve once no animation under `root` is still playing, the moves that a finished one starts included. */
async function settle(root: HTMLElement): Promise<void> {
  const playing = () => root.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running');
  while (playing().length > 0) await Promise.allSettled(playing().map(animation => animation.finished));
}

/** Each edge and size of the box agrees with the expected one, within half a pixel. */
function expectSameBox(actual: DOMRect, expected: DOMRect): void {
  for (const key of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `${key} measured ${actual[key]}, expected ${expected[key]}`).toBeLessThanOrEqual(0.5);
  }
}

it('out-of-flow: a leaving item stays where it stands, and its neighbours close the gap as its exit starts', async () => {
  const [first, second, third] = listOf(out);
  const before = first.getBoundingClientRect();
  getMotion(first, 'presence')!.setPresent(false);
  expect(first.style.getPropertyValue('position')).toBe('absolute');
  expectSameBox(first.getBoundingClientRect(), before);
  expect(movingOnTranslate(second)).toBe(true);
  expect(movingOnTranslate(third)).toBe(true);
  await Promise.resolve();
  expect(first.style.getPropertyValue('position')).toBe('absolute');
  expectSameBox(first.getBoundingClientRect(), before);
  expect(movingOnTranslate(second)).toBe(true);
  expect(movingOnTranslate(third)).toBe(true);
});

it('out-of-flow: setPresent(true) before the exit ends takes the item back into the flow, and the neighbours make room again', async () => {
  const items = listOf(out);
  const [first, second, third] = items;
  const natural = items.map(item => item.getBoundingClientRect());
  const presence = getMotion(first, 'presence')!;
  presence.setPresent(false);
  await Promise.resolve();
  // Freeze every animation 40 ms in: the neighbours are visibly on their way and the exit still runs, whatever the
  // machine load (two real frames can outlast the exit on a loaded machine).
  for (const animation of items.flatMap(item => item.getAnimations())) {
    animation.pause();
    animation.currentTime = 40;
  }
  expect(first.getAnimations().length, 'the exit is still running').toBeGreaterThan(0);
  expect(movingOnTranslate(second)).toBe(true);
  const enter = presence.setPresent(true);
  for (const property of INLINE_LAYOUT) expect(first.style.getPropertyValue(property), property).toBe('');
  expect(movingOnTranslate(second)).toBe(true);
  expect(movingOnTranslate(third)).toBe(true);
  expect(await enter).toBe('finished');
  await settle(target);
  items.forEach((item, index) => expectSameBox(item.getBoundingClientRect(), natural[index]));
});

it('out-of-flow: under reduced motion a leaving item is not pinned', async () => {
  const [first] = listOf(out);
  document.documentElement.dataset.motionPolicy = 'reduce';
  await nextFrame();
  getMotion(first, 'presence')!.setPresent(false);
  expect(first.style.getPropertyValue('position')).toBe('');
});

it('out-of-flow: destroying the binding during the exit gives the item back its inline styles', () => {
  const [first] = listOf(out);
  const presence = getMotion(first, 'presence')!;
  presence.setPresent(false);
  expect(first.style.getPropertyValue('position')).toBe('absolute');
  presence.destroy();
  for (const property of INLINE_LAYOUT) expect(first.style.getPropertyValue(property), property).toBe('');
});

it('out-of-flow: destroying the presence binding of a pinned element puts it back, and its neighbours make room', async () => {
  const items = listOf(out);
  const [first, second, third] = items;
  const natural = items.map(item => item.getBoundingClientRect());
  const presence = getMotion(first, 'presence')!;
  presence.setPresent(false);
  await Promise.resolve();
  // Freeze every animation 40 ms in, so that the exit is still running whatever the machine load.
  for (const animation of items.flatMap(item => item.getAnimations())) {
    animation.pause();
    animation.currentTime = 40;
  }
  expect(first.getAnimations().length, 'the exit is still running').toBeGreaterThan(0);
  const [secondBefore, thirdBefore] = [second, third].map(item => item.getBoundingClientRect());
  presence.destroy();
  expect(first.style.getPropertyValue('position')).toBe('');
  // The neighbours do not jump when the element comes back: they fly on from where they are.
  expectSameBox(second.getBoundingClientRect(), secondBefore);
  expectSameBox(third.getBoundingClientRect(), thirdBefore);
  expect(movingOnTranslate(second)).toBe(true);
  expect(movingOnTranslate(third)).toBe(true);
  await settle(target);
  items.forEach((item, index) => expectSameBox(item.getBoundingClientRect(), natural[index]));
});

it('in-place: a leaving item keeps its place, and its neighbours do not move', async () => {
  const [first, second, third] = listOf(fade.spec);
  getMotion(first, 'presence')!.setPresent(false);
  expect(first.style.getPropertyValue('position')).toBe('');
  expect(movingOnTranslate(second)).toBe(false);
  expect(movingOnTranslate(third)).toBe(false);
  await Promise.resolve();
  expect(first.style.getPropertyValue('position')).toBe('');
  expect(movingOnTranslate(second)).toBe(false);
  expect(movingOnTranslate(third)).toBe(false);
});

// Values at rest (step 8a-2): a presence or an emphasis that has ended leaves its neutral values to the stylesheet.
it('an appear leaves no inline opacity or scale at rest, so that the author classes apply', async () => {
  const binding = bindTo(target, fade);
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.style.opacity).toBe('');
  expect(target.style.scale).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('an emphasis leaves nothing inline once it has ended', async () => {
  const binding = bindTo(target, press);
  expect(await binding.play().finished).toBe('finished');
  expect(target.style.scale).toBe('');
});

it('a disappear that is present at bind leaves no inline opacity at rest', () => {
  bindTo(target, disappear);
  expect(target.dataset.motionPresence).toBe('present');
  expect(target.style.opacity).toBe('');
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('applies a presence set to leave before its name is defined: the element leaves with its exit once defined', () => {
  const deferred = deferTo(target, 'pending-leave');
  void deferred.setPresent(false);
  defineMotion('pending-leave', fade.spec);
  expect(deferred.binding?.present).toBe(false);
  expect(target.dataset.motionPresence).toBe('exiting');
  expect(deferred.binding?.handle).not.toBeNull();
});

it('keeps the element present when its presence is set back to true before its name is defined: no exit', () => {
  const deferred = deferTo(target, 'pending-back');
  void deferred.setPresent(false);
  void deferred.setPresent(true);
  defineMotion('pending-back', fade.spec);
  expect(deferred.binding?.present).toBe(true);
  expect(target.dataset.motionPresence).toBe('present');
  expect(deferred.binding?.handle).toBeNull();
});

it('hides an element that starts absent as soon as its name is defined, without an exit', () => {
  const deferred = deferTo(target, 'pending-absent', { present: false });
  void deferred.setPresent(false);
  defineMotion('pending-absent', fade.spec);
  expect(deferred.binding?.present).toBe(false);
  expect(target.dataset.motionPresence).toBe('exiting');
  expect(target.style.opacity).toBe('0');
  expect(deferred.binding?.handle).toBeNull();
});

it('replays an emphasis asked for before its name is defined, once it is defined', () => {
  const deferred = deferTo(target, 'pending-press');
  deferred.play();
  defineMotion('pending-press', press.spec);
  expect(deferred.binding?.kind).toBe('emphasis');
  expect(deferred.binding?.handle).not.toBeNull();
});

it('replays a reveal through play() of a bound deferred motion, as the reveal binding does', async () => {
  // In view at bind: the reveal leaves the element in place, and plays only when it is replayed.
  const deferred = deferTo(target, reveal);
  expect(deferred.binding?.kind).toBe('view');
  expect(deferred.binding?.handle).toBeNull();
  deferred.play();
  expect(deferred.binding?.handle).not.toBeNull();
  await nextFrame();
  expect(target.getAnimations()).toHaveLength(1);
});

it('replays a reveal asked for before its name is defined, once it is defined', () => {
  const deferred = deferTo(target, 'pending-reveal');
  deferred.play();
  defineMotion('pending-reveal', reveal);
  expect(deferred.binding?.kind).toBe('view');
  expect(deferred.binding?.handle).not.toBeNull();
});

it('a replay asked before the first in-view report of a repeating reveal out of view ends visible', async () => {
  target.style.marginTop = '200vh';
  const binding = bindTo(target, { ...reveal, repeat: 'always' });
  binding.play();
  await nextFrame();
  await Promise.all(target.getAnimations().map(animation => animation.finished));
  await nextFrame();
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(target.style.opacity).toBe('');
});

it('treats setPresent and play as no-ops on a motion of another kind, bound or deferred', () => {
  const layout = deferTo(target, reflow);
  const presence = deferTo(target, fade);
  expect(layout.binding?.kind).toBe('layout');
  expect(presence.binding?.kind).toBe('presence');
  expect(() => layout.play()).not.toThrow();
  expect(() => presence.play()).not.toThrow();
  expect(() => layout.setPresent(false)).not.toThrow();
  expect(presence.binding?.present).toBe(true);
});

it('a destroyed binding is inert: its setPresent and its play do nothing', async () => {
  const first = bindTo(target, fade, { settled: true });
  const second = bindTo(target, slide, { settled: true });
  expect(getMotions(target)).toEqual([second]);
  expect(await first.setPresent(false)).toBe('finished');
  expect(first.present).toBe(true);
  expect(target.getAnimations()).toHaveLength(0);
  expect(target.dataset.motionPresence).toBe('present');
  expect(target.hasAttribute('inert')).toBe(false);

  const pressing = bindTo(target, press);
  bindTo(target, shake);
  pressing.play();
  expect(target.getAnimations()).toHaveLength(0);
});

it('binds one motion of each kind from a list: the first listed name of a kind, the others ignored and reported once', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const motions = listTo(target, ['fade', 'slide', 'press', 'shake'], { settled: true, development: true });
  expect(motions.map(each => each.binding?.kind)).toEqual(['presence', undefined, 'emphasis', undefined]);
  expect(getMotions(target)).toEqual([motions[0].binding, motions[2].binding]);
  for (const each of motions) void each.setPresent(false);
  expect(target.getAnimations()).toHaveLength(1);
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('"slide" ignored');
  expect(String(error.mock.calls[0]?.[0])).toContain('"fade"');
});

it('replays only the first listed emphasis of a list', () => {
  const motions = listTo(target, ['press', 'shake']);
  for (const each of motions) each.play();
  expect(target.getAnimations()).toHaveLength(1);
  const frames = (target.getAnimations()[0].effect as KeyframeEffect).getKeyframes();
  expect(frames.some(frame => frame.translate != null)).toBe(false);
});

it('keeps the first listed name of a kind whatever the order of definition: a name defined later takes its kind over', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const motions = listTo(target, ['list-late-presence', 'fade'], { settled: true, development: true });
  expect(getMotion(target, 'presence')).toBe(motions[1].binding);
  defineMotion('list-late-presence', slide.spec);
  expect(motions[1].binding).toBeUndefined();
  expect(getMotions(target)).toEqual([motions[0].binding]);
  expect(motions[0].binding?.kind).toBe('presence');
  expect(String(error.mock.calls.at(-1)?.[0])).toContain('"fade" ignored');
  expect(String(error.mock.calls.at(-1)?.[0])).toContain('"list-late-presence"');
});
