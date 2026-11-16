import { afterEach, expect, it } from 'vitest';
import { motion, type MotionBinding } from './bind.js';
import { continuousModule, loadContinuous } from './feature-loader.js';
import { parallax, rotate } from './presets.js';

// This file runs with the continuous module cold, and it has one test: the module loads inside it, so every check that
// needs the module cold must come before the load.

const nativeViewTimeline = typeof Reflect.get(globalThis, 'ViewTimeline') === 'function';

let host: HTMLElement | undefined;
const bindings: MotionBinding[] = [];

function element(): HTMLElement {
  if (!host) {
    host = document.createElement('div');
    document.body.append(host);
  }
  const item = document.createElement('div');
  host.append(item);
  return item;
}

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  bindings.length = 0;
  host?.remove();
  host = undefined;
});

it('a loop or a scrub bound before its module loads waits for it: a pause holds, a destroy cancels, a refused call throws at once', async () => {
  expect(continuousModule()).toBeUndefined();
  const looping = element();
  const paused = element();
  const destroyed = element();
  const scrubbed = element();
  const loop = motion(looping, rotate);
  const pausedLoop = motion(paused, rotate);
  bindings.push(loop, pausedLoop);
  pausedLoop.pause();
  const gone = motion(destroyed, rotate);
  gone.destroy();
  const scrub = motion(scrubbed, parallax);
  bindings.push(scrub);
  expect(looping.getAnimations()).toHaveLength(0);
  expect(loop.handle).toBeNull();
  expect(() => scrub.pause()).toThrow(/pause applies to a loop motion/);
  expect(() => scrub.setPresent(false)).toThrow(/setPresent does not apply to a scrub motion/);
  await loadContinuous();
  expect(looping.getAnimations()).toHaveLength(1);
  expect(loop.handle).not.toBeNull();
  expect(paused.getAnimations()[0].playState).toBe('paused');
  expect(destroyed.getAnimations()).toHaveLength(0);
  expect(gone.handle).toBeNull();
  // Firefox has no view timeline: there the scrub stays in its stylesheet state, as the scrub spec expects.
  expect(scrubbed.getAnimations()).toHaveLength(nativeViewTimeline ? 1 : 0);
});
