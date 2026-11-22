import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { motion, type MotionBinding, type MotionSource } from './bind.js';
import { defineMotion } from './define-motion.js';
import { loadContinuous } from './feature-loader.js';

// The definitions of this file: a presence and an emphasis, a reveal and a loop, each with a second definition of its kind
// to name in `--udx-motion`, and an emphasis to name where a presence is bound (another kind).
defineMotion('tier-fade', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
defineMotion('tier-rise', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
});
defineMotion('tier-pulse', { verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }] });
defineMotion('tier-shake', { verb: 'emphasize', keyframes: [{ rotate: 0 }, { rotate: 4 }, { rotate: 0 }] });
defineMotion('tier-reveal', {
  verb: 'reveal',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
});
defineMotion('tier-reveal-fade', { verb: 'reveal', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
defineMotion('tier-breathe', { verb: 'loop', keyframes: [{ scale: 1 }, { scale: 1.1 }, { scale: 1 }], pause: 'control' });
defineMotion('tier-wobble', { verb: 'loop', keyframes: [{ rotate: -3 }, { rotate: 3 }, { rotate: -3 }], pause: 'control' });

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
/** The fields the WAAPI animations on an element write, in sorted order. */
const CONTROL_KEYS = new Set(['offset', 'computedOffset', 'easing', 'composite']);
function animatedFields(el: HTMLElement): string[] {
  const fields = el.getAnimations().flatMap(animation =>
    (animation.effect instanceof KeyframeEffect ? animation.effect.getKeyframes() : []).flatMap(frame =>
      Object.keys(frame).filter(key => !CONTROL_KEYS.has(key)),
    ),
  );
  return [...new Set(fields)].sort();
}

let box: HTMLElement;
let bindings: MotionBinding[];
let viewport: { width: number; height: number };

beforeEach(async () => {
  await loadContinuous();
  box = document.createElement('div');
  document.body.append(box);
  bindings = [];
  viewport = { width: window.innerWidth, height: window.innerHeight };
  window.scrollTo(0, 0);
});

afterEach(async () => {
  for (const binding of bindings) binding.destroy();
  box.remove();
  vi.restoreAllMocks();
  await page.viewport(viewport.width, viewport.height);
});

/** Bind a motion, and remember the binding so that cleanup destroys it. */
function bindTo(target: HTMLElement, source: MotionSource, options: Parameters<typeof motion>[2] = {}): MotionBinding {
  const binding = motion(target, source, options);
  bindings.push(binding);
  return binding;
}

function element(classes: string[] = []): HTMLElement {
  const el = document.createElement('div');
  el.classList.add(...classes);
  box.append(el);
  return el;
}

it('plays the definition the element names in --udx-motion in place of the bound one, and leaves no field of the bound one behind', async () => {
  const target = element();
  // Bound absent without a name: tier-rise writes its exited frame, translate included, inline.
  const binding = bindTo(target, 'tier-rise', { present: false, development: true });
  expect(target.style.translate).not.toBe('');
  // The name comes after: the fade plays, and must not leave the translate of tier-rise behind.
  target.style.setProperty('--udx-motion', 'tier-fade');
  const entering = binding.setPresent(true);
  expect(animatedFields(target)).toEqual(['opacity']);
  expect(await entering).toBe('finished');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(getComputedStyle(target).translate).toBe('none');
  expect(target.style.translate).toBe('');
});

it('reads --udx-motion at each trigger: a media query change between two triggers switches the definition', async () => {
  const style = document.createElement('style');
  style.textContent = '@media (min-width: 50rem) { .tier-wide { --udx-motion: tier-fade; } }';
  document.head.append(style);
  try {
    await page.viewport(400, 700);
    const target = element(['tier-wide']);
    const binding = bindTo(target, 'tier-rise', { present: false, development: true });
    expect(await binding.setPresent(true)).toBe('finished');
    await page.viewport(1000, 700);
    await nextFrame();
    expect(getComputedStyle(target).getPropertyValue('--udx-motion').trim()).toBe('tier-fade');
    const leaving = binding.setPresent(false);
    expect(animatedFields(target)).toEqual(['opacity']);
    expect(await leaving).toBe('finished');
  } finally {
    style.remove();
  }
});

it('ignores a name of another kind, plays the bound definition, and warns once in development', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const target = element();
  target.style.setProperty('--udx-motion', 'tier-pulse');
  const binding = bindTo(target, 'tier-rise', { present: false, development: true });
  expect(await binding.setPresent(true)).toBe('finished');
  expect(await binding.setPresent(false)).toBe('finished');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('tier-pulse');
});

it('ignores an unknown name, plays the bound definition, and warns once in development', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const target = element();
  target.style.setProperty('--udx-motion', 'tier-missing');
  const binding = bindTo(target, 'tier-fade', { present: false, development: true });
  expect(await binding.setPresent(true)).toBe('finished');
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0]?.[0])).toContain('tier-missing');
});

it('keeps none as the switch that turns the motion off, whatever definition the element is bound to', async () => {
  const target = element();
  target.style.setProperty('--udx-motion', 'none');
  const binding = bindTo(target, 'tier-rise', { present: false, development: true });
  expect(await binding.setPresent(true)).toBe('finished');
  expect(target.getAnimations()).toHaveLength(0);
  expect(getComputedStyle(target).opacity).toBe('1');
  expect(getComputedStyle(target).translate).toBe('none');
});

it('plays the named emphasis of its kind when the emphasis is replayed', () => {
  const target = element();
  target.style.setProperty('--udx-motion', 'tier-shake');
  const binding = bindTo(target, 'tier-pulse', { development: true });
  binding.play();
  expect(animatedFields(target)).toEqual(['rotate']);
});

it('plays the named reveal of its kind when the reveal is replayed', async () => {
  const target = element();
  target.style.setProperty('--udx-motion', 'tier-reveal-fade');
  const binding = bindTo(target, 'tier-reveal', { development: true });
  const handle = binding.play()!;
  expect(animatedFields(target)).toEqual(['opacity']);
  expect(await handle.finished).toBe('finished');
  expect(getComputedStyle(target).opacity).toBe('1');
});

it('starts a loop with the definition its element names, and plays the bound one again when the name is removed', () => {
  const target = element();
  target.style.setProperty('--udx-motion', 'tier-wobble');
  const binding = bindTo(target, 'tier-breathe', { development: true });
  expect(animatedFields(target)).toEqual(['rotate']);
  target.style.removeProperty('--udx-motion');
  binding.play();
  expect(animatedFields(target)).toEqual(['scale']);
});

it('destroys the inline fields an override wrote, the ones of the bound definition and of the named one', async () => {
  const target = element();
  target.style.setProperty('--udx-motion', 'tier-rise');
  const binding = bindTo(target, 'tier-fade', { present: true, settled: true, development: true });
  expect(await binding.setPresent(false)).toBe('finished');
  // The exit of tier-rise ends at its first frame, which is not neutral: its translate stays inline.
  expect(target.style.translate).not.toBe('');
  binding.destroy();
  bindings.splice(bindings.indexOf(binding), 1);
  expect(target.style.translate).toBe('');
  expect(target.style.opacity).toBe('');
});
