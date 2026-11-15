import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, getMotions, motion, motionWhenDefined, type DeferredMotion, type MotionBinding } from './bind.js';
import { defineMotion, type MotionSpec } from './define-motion.js';
import { fade, press, reflow, slide } from './presets.js';
import { waapiProvider } from './providers/waapi.js';

const disappear: MotionSpec = { verb: 'disappear', keyframes: [{ opacity: 1 }, { opacity: 0 }] };
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
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

it('plays a fade on bind and marks the element present when it ends', async () => {
  const binding = bindTo(target, fade);
  expect(target.dataset.presence).toBe('entering');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.dataset.presence).toBe('present');
  expect(target.style.opacity).toBe('1');
  expect(waapiProvider.activeCount()).toBe(0);
});

it('leaves a settled element in place without animating', () => {
  target.style.opacity = '0.5';
  const binding = bindTo(target, fade, { settled: true });
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.style.opacity).toBe('0.5');
  expect(target.dataset.presence).toBe('present');
  expect(binding.handle).toBeNull();
});

it('applies the first frame without animation when not present, then enters from it', async () => {
  const binding = bindTo(target, fade, { present: false });
  expect(binding.present).toBe(false);
  expect(target.style.opacity).toBe('0');
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.presence).toBe('exiting');
  expect(target.hasAttribute('inert')).toBe(true);
  expect(await binding.setPresent(false)).toBe('finished');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.style.opacity).toBe('1');
  expect(target.hasAttribute('inert')).toBe(false);
});

it('interrupts an exit with an entry: inert goes at once and the exit resolves cancelled', async () => {
  const binding = bindTo(target, fade);
  await binding.setPresent(true);
  const exit = binding.setPresent(false);
  expect(target.dataset.presence).toBe('exiting');
  expect(target.hasAttribute('inert')).toBe(true);
  const enter = binding.setPresent(true);
  expect(target.hasAttribute('inert')).toBe(false);
  expect(target.dataset.presence).toBe('entering');
  expect(await exit).toBe('cancelled');
  expect(await enter).toBe('finished');
  expect(target.dataset.presence).toBe('present');
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
  expect(target.style.opacity).toBe('1');
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.presence).toBe('present');
  const exit = binding.setPresent(false);
  expect(waapiProvider.activeCount()).toBe(1);
  expect(await exit).toBe('finished');
  expect(target.style.opacity).toBe('0');
  expect(target.dataset.presence).toBe('exiting');
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
  expect(target.hasAttribute('data-presence')).toBe(false);
  expect(target.hasAttribute('inert')).toBe(false);
});

it('removes an inert it set on destroy but keeps one the author set', () => {
  target.setAttribute('inert', '');
  const binding = bindTo(target, fade, { present: false });
  binding.destroy();
  expect(target.hasAttribute('data-presence')).toBe(false);
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
  expect(target.style.opacity).toBe('1');
  expect(target.hasAttribute('inert')).toBe(false);
  expect(target.dataset.presence).toBe('present');
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

it('writes the exited frame of an absent element even when it is settled', async () => {
  const binding = bindTo(target, fade, { present: false, settled: true });
  expect(target.style.opacity).toBe('0');
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.presence).toBe('exiting');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.style.opacity).toBe('1');
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
  expect(target.dataset.presence).toBe('entering');
  expect(waapiProvider.activeCount()).toBe(1);
});

it('leaves an element untouched while its motion is undefined, then binds it settled once defined', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const deferred = deferTo(target, 'when-defined-later', { development: true });
  expect(deferred.binding).toBeUndefined();
  expect(target.getAttribute('style')).toBeNull();
  expect(target.hasAttribute('data-presence')).toBe(false);
  expect(target.hasAttribute('inert')).toBe(false);
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('"when-defined-later"');

  defineMotion('when-defined-later', fade.spec);
  expect(deferred.binding?.present).toBe(true);
  expect(document.getAnimations()).toHaveLength(0);
  expect(target.dataset.presence).toBe('present');
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
  expect(target.dataset.presence).toBe('entering');
});

it('destroying one kind leaves the other registered and working, and the last destroy empties the element', async () => {
  const presence = bindTo(target, fade);
  await presence.setPresent(true);
  const layout = bindTo(target, reflow);
  layout.destroy();
  expect(getMotions(target)).toHaveLength(1);
  expect(getMotion(target)).toBe(presence);
  expect(await presence.setPresent(false)).toBe('finished');
  expect(target.dataset.presence).toBe('exiting');
  presence.destroy();
  expect(getMotions(target)).toHaveLength(0);
  expect(getMotion(target)).toBeUndefined();
});
