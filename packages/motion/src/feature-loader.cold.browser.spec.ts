import { afterEach, beforeEach, expect, it } from 'vitest';
import { connectMotion } from './connect.js';
import { sequencesModule, valuesModule } from './feature-loader.js';
import { resolveValue } from './registries.js';

// This file runs with the values and the sequences cold: nothing here imports them at its top level, and its tests run
// in order. The first test checks that a page meeting neither loads either module. The second checks that the scanner
// loads the values module when it meets a data-motion-value: the test imports the entry only after that check.

let root: HTMLElement;
let disconnect: (() => void) | undefined;

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** Frames until `done` holds, at most `cap` of them; returns whether it holds. */
async function until(done: () => boolean, cap = 240): Promise<boolean> {
  for (let i = 0; i < cap && !done(); i++) await nextFrame();
  return done();
}

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  disconnect?.();
  disconnect = undefined;
  root.remove();
});

it('[Cold 1] a page that meets no value and no sequence loads neither module', async () => {
  const el = document.createElement('div');
  el.dataset.motion = 'cold-unknown';
  root.append(el);
  disconnect = connectMotion({ root });
  await until(() => false, 3);
  expect(valuesModule()).toBeUndefined();
  expect(sequencesModule()).toBeUndefined();
});

it('[Cold 2] a data-motion-value makes the scanner load the values module, and binds the value once it is defined', async () => {
  const el = document.createElement('div');
  el.dataset.motionValue = 'cold-tilt';
  root.append(el);
  disconnect = connectMotion({ root });
  // Nothing has loaded the module yet: the scanner's own import does it, and this test has not imported it.
  expect(valuesModule()).toBeUndefined();
  expect(await until(() => valuesModule() !== undefined)).toBe(true);

  const { defineValue } = await import('./value-entry.js');
  expect(resolveValue('cold-tilt')).toBeUndefined();
  defineValue('cold-tilt', { source: 'state', range: [0, 100], spring: 'none' });
  expect(await until(() => el.style.getPropertyValue('--udx-motion-value-cold-tilt') !== '', 5)).toBe(true);
  expect(el.style.getPropertyValue('--udx-motion-value-cold-tilt')).toBe('0');
});

it('[Cold 3] a data-motion root inserted after connect plays its sequence, once the sequence is defined', async () => {
  disconnect = connectMotion({ root });
  // The test imports the entry before the root exists: a name is known to the scanner only once it is defined, so the
  // sequences module is loaded by this import, not by the scanner. The check below only shows it is available then.
  const { defineSequence } = await import('./sequence-entry.js');
  defineSequence('cold-hero', { steps: { title: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } } });
  const hero = document.createElement('section');
  hero.dataset.motion = 'cold-hero';
  const title = document.createElement('div');
  title.dataset.motionStep = 'title';
  hero.append(title);
  root.append(hero);
  expect(await until(() => title.getAnimations().length > 0, 5)).toBe(true);
  expect(sequencesModule()).toBeDefined();
});
