import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { MotionHandle } from './contract.js';
import { connectMotion } from './connect.js';
import { defineSequence, getSequence, sequence, type SequenceBinding } from './sequence.js';

/** A hero: the title enters, the subtitle starts 50 ms later, the actions cascade once the subtitle has ended. */
const hero = defineSequence('seq-hero', {
  steps: {
    title: { keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }] },
    subtitle: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
    actions: { keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], stagger: 'tight' },
  },
});

const atTitle = defineSequence('seq-at-title', {
  steps: {
    title: { keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }] },
    subtitle: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: 'title' },
    actions: { keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], stagger: 'tight' },
  },
});

const revealHero = defineSequence('seq-reveal', {
  verb: 'reveal',
  steps: {
    title: { keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }] },
    subtitle: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
    actions: { keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }], stagger: 'tight' },
  },
});

const outer = defineSequence('seq-outer', {
  steps: { card: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } },
});

defineSequence('seq-inner', {
  steps: { card: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } },
});

type Hero = { root: HTMLElement; title: HTMLElement; subtitle: HTMLElement; actions: HTMLElement[] };

let page: HTMLElement;
let bindings: SequenceBinding[];
let disconnect: (() => void) | undefined;

beforeEach(() => {
  page = document.createElement('div');
  document.body.append(page);
  bindings = [];
  window.scrollTo(0, 0);
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  disconnect?.();
  disconnect = undefined;
  page.remove();
  window.scrollTo(0, 0);
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

/** Bind a sequence and remember the binding so that cleanup destroys it. */
function bindTo(root: HTMLElement, source: Parameters<typeof sequence>[1], options?: Parameters<typeof sequence>[2]): SequenceBinding {
  const binding = sequence(root, source, options);
  bindings.push(binding);
  return binding;
}

function step(name: string, width: number): HTMLElement {
  const element = document.createElement('div');
  element.dataset.motionStep = name;
  element.style.width = `${width}px`;
  element.style.height = '20px';
  return element;
}

/** A root with a title, a subtitle and three actions in a row, appended to `parent`. */
function heroPage(name = 'seq-hero', parent: Element = page): Hero {
  const root = document.createElement('section');
  root.dataset.motion = name;
  const title = step('title', 200);
  const subtitle = step('subtitle', 160);
  const row = document.createElement('div');
  row.style.display = 'flex';
  const actions = [0, 1, 2].map(() => step('actions', 40));
  row.append(...actions);
  root.append(title, subtitle, row);
  parent.append(root);
  return { root, title, subtitle, actions };
}

const spacer = () => {
  const element = document.createElement('div');
  element.style.height = '200vh';
  return element;
};

const tick = () => Promise.resolve();
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const twoFrames = async () => {
  await nextFrame();
  await nextFrame();
};

/** Scroll the document so that the element is at the top of the viewport. */
function scrollToTop(element: Element): void {
  window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY);
}

/** The delay of an element: its animations share one, so the largest is the delay. */
const delayOf = (element: Element): number => Math.max(...element.getAnimations().map(animation => Number(animation.effect?.getTiming().delay ?? 0)));
/** The duration of an element's longest animation, in milliseconds. */
const durationOf = (element: Element): number => Math.max(...element.getAnimations().map(animation => Number(animation.effect?.getTiming().duration)));

it('starts the title at 0, the subtitle 50 ms later, and the actions when everything before them has ended, in a 20 ms cascade', () => {
  const { root, title, subtitle, actions } = heroPage();
  bindTo(root, hero);
  // The title outlasts the subtitle: the actions wait for the latest end of the steps before them.
  const timelineEnd = Math.max(durationOf(title), 50 + durationOf(subtitle));
  expect(delayOf(title)).toBe(0);
  expect(delayOf(subtitle)).toBeCloseTo(50, 0);
  actions.forEach((action, rank) => expect(delayOf(action)).toBeCloseTo(timelineEnd + rank * 20, 0));
});

it('starts a step with at naming an earlier step together with that step', () => {
  const { root, subtitle } = heroPage('seq-at-title');
  bindTo(root, atTitle);
  expect(delayOf(subtitle)).toBe(0);
});

it('reads the stagger steps of the root: --udx-motion-stagger-normal sets the delay of the subtitle', () => {
  const { root, subtitle } = heroPage();
  root.style.setProperty('--udx-motion-stagger-normal', '80ms');
  bindTo(root, hero);
  expect(delayOf(subtitle)).toBeCloseTo(80, 0);
});

it('resolves one finished for the whole sequence, with every element in its final frame', async () => {
  const { root, title, subtitle, actions } = heroPage();
  const handle = bindTo(root, hero).handle as MotionHandle;
  await expect(handle.finished).resolves.toBe('finished');
  for (const element of [title, subtitle, ...actions]) {
    expect(element.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(element).opacity).toBe('1');
  }
});

it('seek(actionsStart - 1): title and subtitle at their final opacity, actions at their first; seek(duration): every element at its final opacity', () => {
  const { root, title, subtitle, actions } = heroPage();
  const handle = bindTo(root, hero).handle as MotionHandle;
  const opacity = (element: Element) => getComputedStyle(element).opacity;
  handle.seek(delayOf(actions[0]) - 1);
  expect({ title: opacity(title), subtitle: opacity(subtitle), actions: actions.map(opacity) }).toEqual({
    title: '1',
    subtitle: '1',
    actions: ['0', '0', '0'],
  });
  handle.seek(handle.duration);
  expect([title, subtitle, ...actions].map(opacity)).toEqual(['1', '1', '1', '1', '1']);
});

it('seek(t) places every element at the moment t of the global timeline, also past the duration of a delayed element', () => {
  const { root, title, subtitle, actions } = heroPage();
  const handle = bindTo(root, hero).handle as MotionHandle;
  const elements: Array<[string, HTMLElement]> = [['title', title], ['subtitle', subtitle], ['actions[0]', actions[0]], ['actions[1]', actions[1]], ['actions[2]', actions[2]]];
  // Past the longest duration of any element, so that a delay followed by its duration is still ahead of t.
  const t = Math.max(...elements.map(([, element]) => durationOf(element))) + 1;
  handle.seek(t);
  // The moment each animation reaches: its local time (global time minus its delay), held within its active duration.
  const within = (time: number, duration: number) => Math.min(Math.max(time, 0), duration);
  const rows = elements.flatMap(([name, element]) =>
    element.getAnimations().map(animation => {
      const timing = animation.effect?.getTiming();
      const delay = Number(timing?.delay ?? 0);
      const duration = Number(timing?.duration);
      return { name, measured: within(Number(animation.currentTime) - delay, duration), expected: within(t - delay, duration) };
    }),
  );
  expect(rows.map(row => [row.name, Math.round(row.measured)])).toEqual(rows.map(row => [row.name, Math.round(row.expected)]));
});

it('seek past the end of the timeline leaves every element in its final frame', () => {
  const { root, title, subtitle, actions } = heroPage();
  const handle = bindTo(root, hero).handle as MotionHandle;
  handle.seek(10_000);
  const opacities = [title, subtitle, ...actions].map(element => [element.dataset.motionStep, getComputedStyle(element).opacity]);
  expect(opacities).toEqual(opacities.map(([name]) => [name, '1']));
});

it('cancel() mid-way: no element keeps an animation, and finished resolves cancelled', async () => {
  const { root, title, subtitle, actions } = heroPage();
  const handle = bindTo(root, hero).handle as MotionHandle;
  await nextFrame();
  expect(title.getAnimations().length).toBeGreaterThan(0);
  handle.cancel();
  await expect(handle.finished).resolves.toBe('cancelled');
  for (const element of [title, subtitle, ...actions]) expect(element.getAnimations()).toHaveLength(0);
});

it('removing the root of a connected page cancels the sequence: finished resolves cancelled', async () => {
  disconnect = connectMotion({ root: page });
  const holder = document.createElement('div');
  const { root, title, subtitle, actions } = heroPage('seq-hero', holder);
  page.append(root);
  await tick();
  const handle = getSequence(root)?.handle as MotionHandle;
  expect(handle).toBeDefined();
  await nextFrame();
  expect(title.getAnimations().length).toBeGreaterThan(0);
  root.remove();
  await tick();
  await expect(handle.finished).resolves.toBe('cancelled');
  for (const element of [title, subtitle, ...actions]) expect(element.getAnimations()).toHaveLength(0);
  expect(getSequence(root)).toBeUndefined();
});

it('reveal: out of view, every element waits in its first frame; scrolled into view, it plays once', async () => {
  page.append(spacer());
  const { root, title, subtitle, actions } = heroPage('seq-reveal');
  page.append(spacer());
  const all = [title, subtitle, ...actions];
  bindTo(root, revealHero);
  await twoFrames();
  for (const element of all) expect(element.style.opacity).toBe('0');
  expect(all.every(element => element.getAnimations().length === 0)).toBe(true);

  scrollToTop(root);
  await twoFrames();
  expect(title.getAnimations().length).toBeGreaterThan(0);
  await Promise.all(all.flatMap(element => element.getAnimations().map(animation => animation.finished)));
  for (const element of all) expect(getComputedStyle(element).opacity).toBe('1');

  window.scrollTo(0, 0);
  await twoFrames();
  scrollToTop(root);
  await twoFrames();
  expect(all.every(element => element.getAnimations().length === 0)).toBe(true);
});

it('settled: the content present at bind does not play; play() plays it, and replaces the running sequence', async () => {
  const { root, title, subtitle, actions } = heroPage();
  const binding = bindTo(root, hero, { settled: true });
  const all = [title, subtitle, ...actions];
  expect(all.every(element => element.getAnimations().length === 0)).toBe(true);
  expect(binding.handle).toBeNull();

  binding.play();
  expect(title.getAnimations().length).toBeGreaterThan(0);
  const first = binding.handle as MotionHandle;
  binding.play();
  expect(binding.handle).not.toBe(first);
  await expect(first.finished).resolves.toBe('cancelled');
});

it('reduced motion turned on while a sequence runs: the sequence jumps to its end', async () => {
  const { root, title, subtitle, actions } = heroPage();
  bindTo(root, hero);
  await twoFrames();
  const all = [title, subtitle, ...actions];
  expect(all.some(element => element.getAnimations().length > 0)).toBe(true);

  document.documentElement.dataset.motionPolicy = 'reduce';
  await twoFrames();
  for (const element of all) {
    expect(element.getAnimations()).toHaveLength(0);
    expect(getComputedStyle(element).opacity).toBe('1');
  }
});

it('under reduced motion, every element starts at once: no delay', () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const { root, title, subtitle, actions } = heroPage();
  bindTo(root, hero);
  for (const element of [title, subtitle, ...actions]) expect(delayOf(element)).toBe(0);
});

it('a nested sequence owns its own steps: the outer sequence plays only the steps outside it', () => {
  const outerRoot = document.createElement('div');
  outerRoot.dataset.motion = 'seq-outer';
  const card = step('card', 40);
  const innerRoot = document.createElement('div');
  innerRoot.dataset.motion = 'seq-inner';
  const innerCard = step('card', 40);
  innerRoot.append(innerCard);
  outerRoot.append(card, innerRoot);
  page.append(outerRoot);
  bindTo(outerRoot, outer);
  expect(card.getAnimations().length).toBeGreaterThan(0);
  expect(innerCard.getAnimations()).toHaveLength(0);
});

it('the scanner binds data-motion on an inserted root, and destroys the sequence with the root', async () => {
  disconnect = connectMotion({ root: page });
  const holder = document.createElement('div');
  const { root, title } = heroPage('seq-hero', holder);
  page.append(root);
  await tick();
  expect(getSequence(root)).toBeDefined();
  expect(title.getAnimations().length).toBeGreaterThan(0);
  root.remove();
  await tick();
  expect(getSequence(root)).toBeUndefined();
});

it('a data-motion name not yet defined waits for its sequence, then binds it settled', async () => {
  disconnect = connectMotion({ root: page });
  const holder = document.createElement('div');
  const { root, title } = heroPage('seq-late-html', holder);
  page.append(root);
  await tick();
  expect(getSequence(root)).toBeUndefined();

  defineSequence('seq-late-html', { steps: { title: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } } });
  expect(getSequence(root)).toBeDefined();
  expect(title.getAnimations()).toHaveLength(0);
  getSequence(root)?.play();
  expect(title.getAnimations().length).toBeGreaterThan(0);
});
