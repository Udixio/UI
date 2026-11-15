import { afterEach, beforeEach, expect, it } from 'vitest';
import { navigate } from './navigate.js';

const ATTRIBUTE = 'data-motion-direction';

/** Every transition the page started during the test, in start order. */
let transitions: ViewTransition[] = [];
let style: HTMLLinkElement;

/** Load `/motion.css` into the test page, as the other browser specs do. */
async function loadMotionStylesheet() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/motion.css';
  await new Promise<void>((resolve, reject) => {
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('stylesheet failed to load'));
    document.head.append(link);
  });
  return link;
}

/** Record each transition the page starts, without changing it. Returns the arguments of the calls. */
function watchTransitions(): unknown[] {
  const native = document.startViewTransition;
  const calls: unknown[] = [];
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value(argument: ViewTransitionUpdateCallback | StartViewTransitionOptions) {
      calls.push(argument);
      const transition = native.call(document, argument);
      transitions.push(transition);
      return transition;
    },
  });
  return calls;
}

const direction = () => document.documentElement.getAttribute(ATTRIBUTE);

beforeEach(async () => {
  style = await loadMotionStylesheet();
});

afterEach(async () => {
  // Let every transition of the test settle, so that none runs into the next test.
  await Promise.allSettled(transitions.map(transition => transition.finished));
  transitions = [];
  Reflect.deleteProperty(document, 'startViewTransition');
  document.documentElement.removeAttribute(ATTRIBUTE);
  document.documentElement.removeAttribute('data-motion-policy');
  document.documentElement.style.removeProperty('--udx-motion');
  style.remove();
});

it('sets the direction for the whole transition and removes it once the transition has finished', async () => {
  watchTransitions();
  let seen: string | null = null;
  await navigate(() => { seen = direction(); }, { direction: 'back' });
  expect(seen).toBe('back');
  const [transition] = transitions;
  expect(transition).toBeDefined();
  // The update has been applied and the transition is still running: the direction is still set.
  expect(direction()).toBe('back');
  await transition.finished.catch(() => {});
  expect(direction()).toBeNull();
});

it('uses the forward direction when none is given', async () => {
  watchTransitions();
  let seen: string | null = null;
  await navigate(() => { seen = direction(); });
  expect(seen).toBe('forward');
});

it('starts the transition with the direction as its type', async () => {
  const calls = watchTransitions();
  await navigate(() => {}, { direction: 'back' });
  expect(calls[0]).toEqual({ update: expect.any(Function), types: ['udx-back'] });
  // Set-like in every engine that has types: read it as a list so that a failure shows what is there.
  expect(Array.from(transitions[0].types ?? [])).toEqual(['udx-back']);
});

it('waits for an asynchronous update before it resolves', async () => {
  watchTransitions();
  let applied = false;
  await navigate(async () => {
    await new Promise(resolve => setTimeout(resolve, 20));
    applied = true;
  }, { direction: 'forward' });
  expect(applied).toBe(true);
});

it('runs the update without a transition under the reduced-motion policy', async () => {
  const calls = watchTransitions();
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  let updates = 0;
  await navigate(() => { updates++; }, { direction: 'back' });
  expect(updates).toBe(1);
  expect(calls).toHaveLength(0);
  expect(direction()).toBeNull();
});

it('runs the update without a transition when motion is turned off with --udx-motion', async () => {
  const calls = watchTransitions();
  document.documentElement.style.setProperty('--udx-motion', 'none');
  let updates = 0;
  await navigate(() => { updates++; }, { direction: 'forward' });
  expect(updates).toBe(1);
  expect(calls).toHaveLength(0);
  expect(direction()).toBeNull();
});

it('runs the update without a transition where the browser has no view transitions', async () => {
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: undefined });
  let updates = 0;
  await navigate(() => { updates++; }, { direction: 'forward' });
  expect(updates).toBe(1);
  expect(direction()).toBeNull();
});

it('falls back to the function form when the browser refuses the options object', async () => {
  const native = document.startViewTransition;
  const forms: string[] = [];
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value(argument: ViewTransitionUpdateCallback | StartViewTransitionOptions) {
      forms.push(typeof argument);
      if (typeof argument !== 'function') throw new TypeError('the options object is refused');
      const transition = native.call(document, argument);
      transitions.push(transition);
      return transition;
    },
  });
  let updates = 0;
  await navigate(() => { updates++; }, { direction: 'forward' });
  expect(forms).toEqual(['object', 'function']);
  expect(updates).toBe(1);
});

it('lets two navigations in a row both resolve, and keeps the direction of the newest', async () => {
  const unhandled: unknown[] = [];
  const onUnhandled = (event: PromiseRejectionEvent) => { unhandled.push(event.reason); };
  window.addEventListener('unhandledrejection', onUnhandled);
  watchTransitions();
  let updates = 0;
  try {
    const first = navigate(() => { updates++; }, { direction: 'back' });
    const second = navigate(() => { updates++; }, { direction: 'forward' });
    await Promise.all([first, second]);
    expect(updates).toBe(2);
    // The first transition was skipped: it must not clear the direction of the second one.
    expect(direction()).toBe('forward');
    await Promise.allSettled(transitions.map(transition => transition.finished));
    // Lets a rejection that nothing handled reach the page's unhandledrejection event.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(unhandled).toEqual([]);
    expect(direction()).toBeNull();
  } finally {
    window.removeEventListener('unhandledrejection', onUnhandled);
  }
});

it('rejects with the error of an update that throws, and removes the direction', async () => {
  watchTransitions();
  const failure = new Error('the page did not load');
  await expect(navigate(() => { throw failure; }, { direction: 'forward' })).rejects.toBe(failure);
  expect(direction()).toBeNull();
});
