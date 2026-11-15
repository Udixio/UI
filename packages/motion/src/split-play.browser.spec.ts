import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, motion, type MotionBinding } from './bind.js';
import { connectMotion } from './connect.js';
import { defineMotion, type MotionSpec } from './define-motion.js';
import { textModule } from './feature-loader.js';
import { getMotionRuntime } from './runtime.js';
import { applySplitFrame, playSplit, revertSplit, splitPieces } from './split-play.js';
import { getSplit } from './text.js';
import './text-entry.js';

// This file loads the text module at its top level: every split of it is made by the module the entry provides.

type Reveal = Extract<MotionSpec, { verb: 'reveal' }>;
type Appear = Extract<MotionSpec, { verb: 'appear' | 'disappear' }>;

const fade = [{ opacity: 0 }, { opacity: 1 }] as const;
const rise = [{ opacity: 0, y: 8 }, { opacity: 1, y: 0 }] as const;

let page: HTMLElement;
let bindings: MotionBinding[];

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/**
 * Frames until `done` holds, at most `cap` of them; returns whether it holds. A view observer reports on its own
 * schedule, so the tests that wait for one wait for its effect rather than for a number of frames.
 */
async function until(done: () => boolean, cap = 240): Promise<boolean> {
  for (let i = 0; i < cap && !done(); i++) await nextFrame();
  return done();
}

beforeEach(() => {
  page = document.createElement('div');
  document.body.append(page);
  bindings = [];
  window.scrollTo(0, 0);
});

afterEach(() => {
  for (const binding of bindings) binding.destroy();
  page.remove();
  window.scrollTo(0, 0);
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

/** Bind a motion on an element, and remember the binding so that cleanup destroys it. */
function bindTo(item: HTMLElement, source: Parameters<typeof motion>[1], options: Parameters<typeof motion>[2] = {}): MotionBinding {
  const binding = motion(item, source, options);
  bindings.push(binding);
  return binding;
}

/** A paragraph below a spacer of 200vh, out of view, with room below it to be scrolled to the top of the viewport. */
function outOfView(html: string, style = ''): HTMLParagraphElement {
  const spacer = () => {
    const element = document.createElement('div');
    element.style.height = '200vh';
    return element;
  };
  const p = document.createElement('p');
  p.innerHTML = html;
  p.style.cssText = `margin:0;${style}`;
  page.append(spacer(), p, spacer());
  return p;
}

/** Scroll the document so that the element is at the top of the viewport. */
function scrollToTop(element: Element): void {
  window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY);
}

/** The pieces of an element, in text order. */
const piecesOf = (element: HTMLElement) => [...element.querySelectorAll<HTMLElement>('[data-udx-piece]')];

/** The start delay of each piece's running animation, in ms. */
const delaysOf = (pieces: HTMLElement[]) => pieces.map(piece => piece.getAnimations()[0]?.effect?.getTiming().delay);

/** Resolve once every animation of the elements has ended. */
async function finishAll(elements: Element[]): Promise<void> {
  await Promise.all(elements.flatMap(element => element.getAnimations().map(animation => animation.finished)));
}

const words: Reveal = { verb: 'reveal', keyframes: [...rise], split: 'words' };

it('the text module is loaded by this file, so the split is available', () => {
  expect(textModule()).toBeDefined();
});

it('holds each word in its first frame and leaves the paragraph itself visible, out of view', async () => {
  const p = outOfView('Alpha beta gamma');
  bindTo(p, words);
  expect(await until(() => piecesOf(p).length > 0)).toBe(true);
  const pieces = piecesOf(p);
  expect(pieces.map(piece => piece.textContent)).toEqual(['Alpha', 'beta', 'gamma']);
  for (const piece of pieces) {
    expect(getComputedStyle(piece).opacity).toBe('0');
    expect(getComputedStyle(piece).translate).toBe('0px 8px');
  }
  expect(p.style.opacity).toBe('');
  expect(getComputedStyle(p).opacity).toBe('1');
  expect(p.getAnimations()).toHaveLength(0);
});

it('cascades the words in text order, one step apart, when it comes into view', async () => {
  const p = outOfView('Alpha beta gamma');
  p.style.setProperty('--udx-motion-stagger-tight', '20ms');
  bindTo(p, words);
  expect(await until(() => piecesOf(p).length > 0)).toBe(true);
  scrollToTop(p);
  expect(await until(() => piecesOf(p).every(piece => piece.getAnimations().length > 0))).toBe(true);
  const pieces = piecesOf(p);
  expect(delaysOf(pieces)).toEqual([0, 20, 40]);
  await finishAll(pieces);
  for (const piece of pieces) {
    expect(getComputedStyle(piece).opacity).toBe('1');
    expect(['none', '0px', '0px 0px', '0px 0px 0px']).toContain(getComputedStyle(piece).translate);
  }
  expect(p.style.opacity).toBe('');
});

it('counts the cascade from the last word with origin last', async () => {
  const p = outOfView('Alpha beta gamma');
  p.style.setProperty('--udx-motion-stagger-tight', '20ms');
  bindTo(p, { ...words, origin: 'last' });
  expect(await until(() => piecesOf(p).length > 0)).toBe(true);
  scrollToTop(p);
  expect(await until(() => piecesOf(p).every(piece => piece.getAnimations().length > 0))).toBe(true);
  expect(delaysOf(piecesOf(p))).toEqual([40, 20, 0]);
  await finishAll(piecesOf(p));
});

it('cuts a paragraph into lines, one piece per line, when the split is by lines', async () => {
  const p = outOfView('aaaaaaaa bbbbbbbb cccccccc', 'width:120px;font:20px/24px monospace');
  bindTo(p, { ...words, split: 'lines' });
  expect(await until(() => piecesOf(p).length > 0)).toBe(true);
  const pieces = piecesOf(p);
  expect(pieces.map(piece => piece.textContent)).toEqual(['aaaaaaaa', 'bbbbbbbb', 'cccccccc']);
  expect(pieces.every(piece => getComputedStyle(piece).display === 'block')).toBe(true);
});

it('a frame the element holds when its text is split moves to the pieces', async () => {
  const p = outOfView('Alpha beta gamma');
  // A first frame written on the element, as a binding does while the text module is not loaded yet.
  p.style.opacity = '0';
  const runtime = getMotionRuntime();
  const handle = playSplit(p, words, { direction: 'forward', carry: false, runtime });
  expect(p.style.opacity).toBe('');
  const pieces = piecesOf(p);
  expect(pieces).toHaveLength(3);
  expect(pieces.every(piece => piece.getAnimations().length === 1)).toBe(true);
  await handle.finished;
  expect(getComputedStyle(p).opacity).toBe('1');
});

it('applies a frame to the pieces, and only to the element when its text is not split', () => {
  const p = outOfView('Alpha beta gamma');
  const runtime = getMotionRuntime();
  applySplitFrame(p, words, runtime, { opacity: 0 });
  expect(piecesOf(p).every(piece => piece.style.opacity === '0')).toBe(true);
  expect(p.style.opacity).toBe('');
  revertSplit(p, words);
  expect(splitPieces(p, words, runtime)).toBeDefined();
  expect(piecesOf(p)).toHaveLength(3);
  // Motion turned off: the frame goes on the element whole, and the pieces of the earlier split hold none.
  p.style.setProperty('--udx-motion', 'none');
  applySplitFrame(p, words, runtime, { opacity: 0 });
  expect(p.style.opacity).toBe('0');
  expect(piecesOf(p).every(piece => piece.style.opacity === '')).toBe(true);
});

it('under reduced motion, a text split earlier plays whole, and its pieces hold no frame', () => {
  const p = outOfView('Alpha beta gamma');
  const runtime = getMotionRuntime();
  applySplitFrame(p, words, runtime, { opacity: 0 });
  expect(piecesOf(p).every(piece => piece.style.opacity === '0')).toBe(true);
  document.documentElement.dataset.motionPolicy = 'reduce';
  // A reveal that is reduced settles at its end: the element takes the last frame, and no piece keeps the first one.
  playSplit(p, words, { direction: 'forward', carry: false, runtime });
  expect(piecesOf(p).every(piece => piece.style.opacity === '')).toBe(true);
  expect(p.getAnimations()).toHaveLength(0);
  expect(p.style.opacity).toBe('1');
});

it('a text holding a link is animated whole, and warns once', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const p = outOfView('Read <a href="#next">this link</a>');
  bindTo(p, words);
  // The first report of the view observer holds the first frame on the element: only then is the element scrolled in.
  expect(await until(() => p.style.opacity === '0')).toBe(true);
  scrollToTop(p);
  expect(await until(() => p.getAnimations().length > 0)).toBe(true);
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  expect(p.innerHTML).toBe('Read <a href="#next">this link</a>');
  expect(p.getAnimations()).toHaveLength(1);
  expect(warn).toHaveBeenCalledTimes(1);
  await finishAll([p]);
  expect(getComputedStyle(p).opacity).toBe('1');
});

it('under reduced motion, the element is animated whole and no split is made', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const p = document.createElement('p');
  p.textContent = 'Hello big world';
  page.append(p);
  const appear: Appear = { verb: 'appear', keyframes: [...fade], split: 'chars' };
  const binding = bindTo(p, appear, { present: false });
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  const entering = binding.setPresent(true);
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  expect(p.getAnimations()).toHaveLength(1);
  expect(await entering).toBe('finished');
  expect(getComputedStyle(p).opacity).toBe('1');
});

it('with motion turned off, a text plays whole at once, without a split', () => {
  const p = document.createElement('p');
  p.textContent = 'Hello big world';
  p.style.setProperty('--udx-motion', 'none');
  page.append(p);
  bindTo(p, { verb: 'appear', keyframes: [...fade], split: 'words' }, { present: false });
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  expect(p.style.opacity).toBe('0');
});

it('the presence binding composes one handle per letter, enters them forwards and exits them backwards', async () => {
  const p = document.createElement('p');
  p.textContent = 'Hi!';
  page.append(p);
  const appear: Appear = { verb: 'appear', keyframes: [...fade], split: 'chars' };
  const binding = bindTo(p, appear, { present: false });
  const pieces = piecesOf(p);
  expect(pieces.map(piece => piece.textContent)).toEqual(['H', 'i', '!']);
  expect(pieces.every(piece => piece.style.opacity === '0')).toBe(true);
  expect(p.style.opacity).toBe('');
  expect(p.dataset.presence).toBe('exiting');

  const enter = binding.setPresent(true);
  expect(p.dataset.presence).toBe('entering');
  expect(pieces.every(piece => piece.getAnimations().length === 1)).toBe(true);
  expect(await enter).toBe('finished');
  expect(p.dataset.presence).toBe('present');
  expect(pieces.every(piece => getComputedStyle(piece).opacity === '1')).toBe(true);

  const exit = binding.setPresent(false);
  expect(pieces.every(piece => piece.getAnimations().length === 1)).toBe(true);
  expect(await exit).toBe('finished');
  expect(p.dataset.presence).toBe('exiting');
  expect(pieces.every(piece => piece.style.opacity === '0')).toBe(true);
});

it('destroying the binding of a split text puts the text back as it was', async () => {
  const p = outOfView('Read <em>this</em> now');
  const before = p.innerHTML;
  const binding = bindTo(p, words);
  expect(await until(() => p.querySelector('[data-udx-split]') !== null)).toBe(true);
  binding.destroy();
  expect(p.innerHTML).toBe(before);
  expect(p.querySelector('[data-udx-split]')).toBeNull();
  expect(getSplit(p)).toBeUndefined();
});

it('plays a split with a delay after the cascade, and keeps the delay of the element', () => {
  const p = outOfView('Alpha beta');
  p.style.setProperty('--udx-motion-stagger-tight', '20ms');
  const handle = playSplit(p, words, { direction: 'forward', carry: false, runtime: getMotionRuntime(), delay: 100 });
  expect(delaysOf(piecesOf(p))).toEqual([100, 120]);
  expect(handle.delay).toBe(100);
});

it('two elements bound with one split definition do not cascade among themselves', async () => {
  const first = outOfView('Alpha beta gamma');
  const second = document.createElement('p');
  second.textContent = 'Delta epsilon';
  second.style.margin = '0';
  first.after(second);
  bindTo(first, words);
  bindTo(second, words);
  expect(await until(() => piecesOf(first).length > 0 && piecesOf(second).length > 0)).toBe(true);
  // Both enter the view together: each element plays its own pieces at once, so the first piece of each has no delay.
  scrollToTop(first);
  expect(await until(() => piecesOf(first).every(piece => piece.getAnimations().length > 0) && piecesOf(second).every(piece => piece.getAnimations().length > 0))).toBe(true);
  expect(piecesOf(first)[0].getAnimations()[0].effect?.getTiming().delay).toBe(0);
  expect(piecesOf(second)[0].getAnimations()[0].effect?.getTiming().delay).toBe(0);
  await finishAll([...piecesOf(first), ...piecesOf(second)]);
});

it('an exit of a split presence binding plays on the pieces, then hides the element through the scanner', async () => {
  defineMotion('split-leave-words', { verb: 'disappear', keyframes: [{ opacity: 1 }, { opacity: 0 }], split: 'words' });
  const root = document.createElement('div');
  page.append(root);
  const el = document.createElement('p');
  el.dataset.motion = 'split-leave-words';
  el.textContent = 'Goodbye big world';
  root.append(el);
  const disconnect = connectMotion({ root });
  try {
    // The scanner binds the element present; hiding it is the removal that the exit ends with.
    expect(getMotion(el, 'presence')?.present).toBe(true);
    el.hidden = true;
    expect(await until(() => piecesOf(el).length === 3)).toBe(true);
    expect(piecesOf(el).every(piece => piece.getAnimations().length === 1)).toBe(true);
    expect(await until(() => getComputedStyle(el).display === 'none', 240)).toBe(true);
    expect(getMotion(el, 'presence')?.present).toBe(false);
    expect(el.dataset.presence).toBe('exiting');
  } finally {
    disconnect();
  }
});

