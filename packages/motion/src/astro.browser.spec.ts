import { afterEach, expect, it } from 'vitest';
import { connectAstroTransitions } from './astro.js';

const ATTRIBUTE = 'data-motion-direction';
let disconnect: (() => void) | undefined;

afterEach(() => {
  disconnect?.();
  disconnect = undefined;
  document.documentElement.removeAttribute(ATTRIBUTE);
  document.documentElement.removeAttribute('data-motion-policy');
});

/** An Astro transition event: a plain DOM event carrying the fields Astro sets on it. */
function astroEvent(type: string, fields: Record<string, unknown> = {}): Event {
  return Object.assign(new Event(type, { cancelable: true }), fields);
}

/** The document that Astro parses for the page it swaps in. */
const newPage = () => document.implementation.createHTMLDocument('');

const direction = () => document.documentElement.getAttribute(ATTRIBUTE);

it('gives the page the direction of a navigation when the navigation is prepared', () => {
  disconnect = connectAstroTransitions();
  document.dispatchEvent(astroEvent('astro:before-preparation', { direction: 'back' }));
  expect(direction()).toBe('back');
  document.dispatchEvent(astroEvent('astro:before-preparation', { direction: 'forward' }));
  expect(direction()).toBe('forward');
  document.dispatchEvent(astroEvent('astro:before-preparation'));
  expect(direction()).toBe('forward');
});

it('copies the direction onto the document that the swap brings in', () => {
  disconnect = connectAstroTransitions();
  const newDocument = newPage();
  document.dispatchEvent(astroEvent('astro:before-preparation', { direction: 'back' }));
  document.dispatchEvent(astroEvent('astro:before-swap', {
    direction: 'back', newDocument, viewTransition: { finished: new Promise(() => {}) },
  }));
  expect(newDocument.documentElement.getAttribute(ATTRIBUTE)).toBe('back');
});

it('removes the direction once the transition of the swap has finished', async () => {
  disconnect = connectAstroTransitions();
  let finish!: () => void;
  const finished = new Promise<void>(resolve => { finish = resolve; });
  document.dispatchEvent(astroEvent('astro:before-preparation', { direction: 'forward' }));
  document.dispatchEvent(astroEvent('astro:before-swap', {
    direction: 'forward', newDocument: newPage(), viewTransition: { finished },
  }));
  expect(direction()).toBe('forward');
  finish();
  await finished;
  expect(direction()).toBeNull();
});

it('leaves the page alone under the reduced-motion policy', () => {
  disconnect = connectAstroTransitions();
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  const newDocument = newPage();
  document.dispatchEvent(astroEvent('astro:before-preparation', { direction: 'back' }));
  document.dispatchEvent(astroEvent('astro:before-swap', {
    direction: 'back', newDocument, viewTransition: { finished: new Promise(() => {}) },
  }));
  expect(direction()).toBeNull();
  expect(newDocument.documentElement.hasAttribute(ATTRIBUTE)).toBe(false);
});

it('copies nothing onto a swap that no navigation prepared', () => {
  disconnect = connectAstroTransitions();
  const newDocument = newPage();
  document.dispatchEvent(astroEvent('astro:before-swap', {
    direction: 'back', newDocument, viewTransition: { finished: new Promise(() => {}) },
  }));
  expect(newDocument.documentElement.hasAttribute(ATTRIBUTE)).toBe(false);
});

it('stops listening once disconnected', () => {
  const stop = connectAstroTransitions();
  stop();
  document.dispatchEvent(astroEvent('astro:before-preparation', { direction: 'back' }));
  expect(direction()).toBeNull();
});
