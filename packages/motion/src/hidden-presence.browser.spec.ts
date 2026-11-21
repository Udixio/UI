import { afterEach, beforeEach, expect, it } from 'vitest';
import { getMotion, motionWhenDefined } from './bind.js';
import { defineMotion } from './define-motion.js';
import { releaseHiddenHold, setPresentByHidden } from './hidden-presence.js';
import { fade } from './presets.js';

// The path of the framework adapters: an element that stays in the DOM, whose `present` they turn into `hidden`.
defineMotion('hidden-fade', fade.spec);

let root: HTMLElement;

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => {
  root.remove();
});

function make(): HTMLElement {
  const el = document.createElement('div');
  el.textContent = 'Content';
  root.append(el);
  return el;
}

it('hides an element with its exit: displayed until the exit has finished, then hidden and out of the flow', async () => {
  const el = make();
  const motions = [motionWhenDefined(el, 'hidden-fade', { settled: true })];

  const done = setPresentByHidden(el, false, motions);
  expect(el.hidden).toBe(true);
  expect(getComputedStyle(el).display).toBe('block');
  expect(el.hasAttribute('inert')).toBe(true);
  expect(el.dataset.motionPresence).toBe('exiting');

  expect(await done).toBe('finished');
  expect(el.style.display).toBe('');
  expect(getComputedStyle(el).display).toBe('none');
  motions.forEach(each => each.destroy());
});

it('shows a hidden element again with its entry', async () => {
  const el = make();
  el.hidden = true;
  const motions = [motionWhenDefined(el, 'hidden-fade', { present: false })];
  expect(getComputedStyle(el).display).toBe('none');

  const done = setPresentByHidden(el, true, motions);
  expect(el.hidden).toBe(false);
  expect(el.hasAttribute('inert')).toBe(false);
  expect(el.dataset.motionPresence).toBe('entering');
  expect(await done).toBe('finished');
  expect(el.dataset.motionPresence).toBe('present');
  expect(getComputedStyle(el).opacity).toBe('1');
  motions.forEach(each => each.destroy());
});

it('shows an element again during its exit: the held display goes back, and the exit is cancelled', async () => {
  const el = make();
  el.style.display = 'flex';
  const motions = [motionWhenDefined(el, 'hidden-fade', { settled: true })];

  const exit = setPresentByHidden(el, false, motions);
  expect(el.style.getPropertyPriority('display')).toBe('important');
  const entry = setPresentByHidden(el, true, motions);
  expect(el.style.display).toBe('flex');
  expect(el.style.getPropertyPriority('display')).toBe('');
  expect(await exit).toBe('cancelled');
  expect(await entry).toBe('finished');
  expect(getComputedStyle(el).display).toBe('flex');
  motions.forEach(each => each.destroy());
});

it('keeps the value an author gave hidden, as in HTML where the author sets it before the exit', async () => {
  const el = make();
  const motions = [motionWhenDefined(el, 'hidden-fade', { settled: true })];
  el.setAttribute('hidden', 'until-found');

  expect(await setPresentByHidden(el, false, motions)).toBe('finished');
  expect(el.getAttribute('hidden')).toBe('until-found');
  motions.forEach(each => each.destroy());
});

it('hides at once an element with no presence motion bound', async () => {
  const el = make();
  const motions = [motionWhenDefined(el, 'hidden-not-defined-yet')];

  expect(await setPresentByHidden(el, false, motions)).toBe('finished');
  expect(el.hidden).toBe(true);
  expect(el.style.display).toBe('');
  expect(getComputedStyle(el).display).toBe('none');
  expect(getMotion(el)).toBeUndefined();
  motions.forEach(each => each.destroy());
});

it('gives back a held display when asked: the element is then displayed as hidden says', () => {
  const el = make();
  const motions = [motionWhenDefined(el, 'hidden-fade', { settled: true })];

  void setPresentByHidden(el, false, motions);
  releaseHiddenHold(el);
  expect(el.style.display).toBe('');
  expect(getComputedStyle(el).display).toBe('none');
  motions.forEach(each => each.destroy());
});
