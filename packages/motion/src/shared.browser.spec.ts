import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { motion, type MotionBinding, type MotionSource } from './bind.js';
import type { MotionHandle } from './contract.js';
import { defineMotion } from './define-motion.js';
import { getMotionRuntime } from './runtime.js';
import { loadLayoutEngine } from './layout-loader.js';
import { reflow } from './presets.js';

// Every test here binds a layout motion and expects it to follow at once: the engine is loaded before the first test.
await loadLayoutEngine();
// The page runtime is created here in development: two live holders of one key are reported, once.
getMotionRuntime({ development: true });

type Options = Parameters<typeof motion>[2];
type Rect = { left: number; top: number; width: number; height: number };

const byId = (id: string) => document.getElementById(id) as HTMLElement;
const rectOf = (element: Element): Rect => {
  const r = element.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

function expectNear(actual: Rect, expected: Rect, tolerance: number): void {
  for (const key of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `${key} measured ${actual[key]}, expected ${expected[key]}`).toBeLessThanOrEqual(tolerance);
  }
}

/** The list holds the thumbnail A (60 x 40, top left); the detail holds the card B (300 x 200, top left). */
const css = `
  .list { position: absolute; left: 0; top: 0; width: 200px; height: 200px; }
  .detail { position: absolute; left: 300px; top: 0; width: 400px; height: 300px; }
  .thumb { width: 60px; height: 40px; }
  .card { width: 300px; height: 200px; }
  .card.round { border-radius: 16px; }
  .child { width: 80px; height: 20px; }
`;

let host: HTMLElement;
let style: HTMLStyleElement;
let bindings: MotionBinding[];

function page(): void {
  style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  host = document.createElement('div');
  host.innerHTML = '<div class="list" id="list"><div class="thumb" id="a"></div></div><div class="detail" id="detail"></div>';
  document.body.append(host);
}

const list = () => byId('list');
const detail = () => byId('detail');

function card(id: string, extra = ''): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  element.className = `card ${extra}`.trim();
  return element;
}

/** Bind a layout motion, sharing the identity `card` unless told otherwise, and remember it so that cleanup destroys it. */
function bindTo(element: HTMLElement, options: Options = { shared: 'card' }, source: MotionSource = reflow): MotionBinding {
  const binding = motion(element, source, options);
  bindings.push(binding);
  return binding;
}

/** The move in flight; the test fails when there is none. */
function moving(binding: MotionBinding): MotionHandle {
  const handle = binding.handle;
  if (!handle) throw new Error('no move in flight');
  return handle;
}

/** The place of the card B at rest: the top left of the detail, 300 x 200. */
const natural = (): Rect => ({ ...rectOf(detail()), width: 300, height: 200 });
const thumbPlace = (): Rect => ({ ...rectOf(list()), width: 60, height: 40 });

function expectNothingInline(element: HTMLElement): void {
  expect(element.style.translate).toBe('');
  expect(element.style.scale).toBe('');
  expect(element.style.borderRadius).toBe('');
  expect(element.getAnimations()).toHaveLength(0);
}

beforeEach(() => {
  bindings = [];
});

afterEach(async () => {
  for (const binding of bindings) binding.destroy();
  host.remove();
  style.remove();
  delete document.documentElement.dataset.motionPolicy;
  window.scrollTo(0, 0);
  vi.restoreAllMocks();
  // The page memory outlives its holders for a window (600 ms): wait it out, so that no test meets the memory of the one before.
  await new Promise(resolve => setTimeout(resolve, 700));
});

it('[Review Focus 1a] a replacement bound after the old element is destroyed starts from its rect and travels to its own', async () => {
  page();
  const a = byId('a');
  const old = bindTo(a);
  const from = rectOf(a);
  const b = card('b');
  old.destroy();
  a.remove();
  detail().append(b);
  const binding = bindTo(b);
  await Promise.resolve();
  expect(binding.handle).not.toBeNull();
  expectNear(rectOf(b), from, 1);
  await moving(binding).finished;
  expectNear(rectOf(b), natural(), 0.5);
  expectNothingInline(b);
});

it('[Review Focus 1b] the same, when the replacement is bound before the old element is destroyed', async () => {
  page();
  const a = byId('a');
  const old = bindTo(a);
  const from = rectOf(a);
  const b = card('b');
  a.remove();
  detail().append(b);
  const binding = bindTo(b);
  old.destroy();
  await Promise.resolve();
  expect(binding.handle).not.toBeNull();
  expectNear(rectOf(b), from, 1);
  await moving(binding).finished;
  expectNear(rectOf(b), natural(), 0.5);
  expectNothingInline(b);
});

it('[Review Focus 2] a hidden element hands its place over to the one shown in its place, and back', async () => {
  page();
  const a = byId('a');
  const aBinding = bindTo(a);
  const b = card('b');
  b.hidden = true;
  detail().append(b);
  const bBinding = bindTo(b);
  expect(bBinding.handle).toBeNull();
  const aRest = rectOf(a);

  a.hidden = true;
  b.hidden = false;
  await Promise.resolve();
  expect(bBinding.handle).not.toBeNull();
  expectNear(rectOf(b), aRest, 1);
  await moving(bBinding).finished;
  expectNear(rectOf(b), natural(), 0.5);
  expectNothingInline(b);

  const bRest = rectOf(b);
  b.hidden = true;
  a.hidden = false;
  await Promise.resolve();
  expect(aBinding.handle).not.toBeNull();
  expectNear(rectOf(a), bRest, 1);
  await moving(aBinding).finished;
  expectNear(rectOf(a), thumbPlace(), 0.5);
  expectNothingInline(a);
});

it('[Review Focus 3] a second live element with the key does not morph, and the report is logged once', async () => {
  page();
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const b = card('b');
  const c = card('c');
  detail().append(b, c);
  bindTo(byId('a'));
  const bBinding = bindTo(b);
  expect(bBinding.handle).toBeNull();
  expect(error).toHaveBeenCalledTimes(1);
  expect(String(error.mock.calls[0][0])).toContain('Two live elements share "card"');

  const cBinding = bindTo(c);
  expect(cBinding.handle).toBeNull();
  expect(error).toHaveBeenCalledTimes(1);
  expect(document.getAnimations()).toHaveLength(0);
});

it('[Review Focus 4] a holder gone 500 ms ago still hands its place over', async () => {
  page();
  const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
  const a = byId('a');
  const old = bindTo(a);
  const from = rectOf(a);
  old.destroy();
  a.remove();
  clock.mockReturnValue(1500);
  const b = card('b');
  detail().append(b);
  const binding = bindTo(b);
  expect(binding.handle).not.toBeNull();
  expectNear(rectOf(b), from, 1);
});

it('[Review Focus 4] a holder gone 700 ms ago does not hand its place over', async () => {
  page();
  const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
  const a = byId('a');
  const old = bindTo(a);
  old.destroy();
  a.remove();
  clock.mockReturnValue(1700);
  const b = card('b');
  detail().append(b);
  const binding = bindTo(b);
  expect(binding.handle).toBeNull();
  expectNear(rectOf(b), natural(), 0.5);
});

it('[Review Focus 5] a definition carries the key, and a per-element option overrides it', async () => {
  page();
  const hero = defineMotion('shared-hero-move', { verb: 'layout', shared: 'hero' });
  const a = byId('a');
  const first = bindTo(a, {}, hero);
  const from = rectOf(a);
  first.destroy();
  a.remove();
  const b = card('b');
  detail().append(b);
  const second = bindTo(b, {}, hero);
  expect(second.handle).not.toBeNull();
  expectNear(rectOf(b), from, 1);
  await moving(second).finished;
  second.destroy();
  b.remove();

  // The holder of `hero` is gone and recent, but this element is keyed `elsewhere`: it has no place to take over.
  const c = card('c');
  detail().append(c);
  const third = bindTo(c, { shared: 'elsewhere' }, hero);
  expect(third.handle).toBeNull();
  expectNear(rectOf(c), natural(), 0.5);
});

it('[Review Focus 6] the morph does not project content: a child has no size of its own and no animation', async () => {
  page();
  const a = byId('a');
  bindTo(a).destroy();
  a.remove();
  const b = card('b');
  b.innerHTML = '<div class="child" id="child"></div>';
  detail().append(b);
  const binding = bindTo(b);
  const handle = moving(binding);
  handle.pause();
  handle.seek(handle.duration * 0.15);
  const sx = rectOf(b).width / 300;
  const child = byId('child');
  const childWidth = rectOf(child).width;
  expect(Math.abs(childWidth - 80 * sx), `child ${childWidth} px, card scale ${sx}`).toBeLessThan(0.5);
  expect(childWidth).toBeLessThan(70);
  expect(child.getAnimations()).toHaveLength(0);
});

it('[Review Focus 6] a rounded card keeps its corners round at each instant of the morph', async () => {
  page();
  const a = byId('a');
  bindTo(a).destroy();
  a.remove();
  const b = card('b', 'round');
  detail().append(b);
  const binding = bindTo(b);
  const handle = moving(binding);
  for (const share of [0.15, 0.5, 0.85]) {
    handle.pause();
    handle.seek(handle.duration * share);
    const rect = rectOf(b);
    const [h, v = h] = getComputedStyle(b).borderTopLeftRadius.split(' ').map(value => parseFloat(value));
    expect(Math.abs(h * (rect.width / 300) - 16), `horizontal radius at ${share * 100} %`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(v * (rect.height / 200) - 16), `vertical radius at ${share * 100} %`).toBeLessThanOrEqual(0.5);
  }
});

it('moves nothing under reduced motion: the replacement is at its own place at once', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  page();
  const a = byId('a');
  bindTo(a).destroy();
  a.remove();
  const b = card('b');
  detail().append(b);
  const binding = bindTo(b);
  expect(binding.handle).toBeNull();
  expect(document.getAnimations()).toHaveLength(0);
  expectNear(rectOf(b), natural(), 0.5);
});

it('moves nothing when --udx-motion is none on the scope', async () => {
  page();
  detail().style.setProperty('--udx-motion', 'none');
  const a = byId('a');
  bindTo(a).destroy();
  a.remove();
  const b = card('b');
  detail().append(b);
  const binding = bindTo(b);
  expect(binding.handle).toBeNull();
  expect(document.getAnimations()).toHaveLength(0);
  expectNear(rectOf(b), natural(), 0.5);
});

it('[Review Focus 5] the memory lives on the page runtime, and recall never returns the holder itself', () => {
  page();
  const a = byId('a');
  const binding = bindTo(a);
  const rect = rectOf(a);
  const runtime = getMotionRuntime();
  a.remove();
  runtime.shared.forget('card', a);
  const box = runtime.shared.recall('card', card('b'), 600);
  expect(box).toBeDefined();
  expectNear(
    { left: box!.left, top: box!.top, width: box!.width, height: box!.height },
    { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: 60, height: 40 },
    0.5,
  );
  expect(runtime.shared.recall('card', a, 600)).toBeUndefined();
  expect(binding.handle).toBeNull();
});

it('[Review Focus 4] the memory of a holder is deleted a window after it went away, and recall then finds nothing', async () => {
  page();
  const a = byId('a');
  const old = bindTo(a);
  const shared = getMotionRuntime().shared;
  old.destroy();
  a.remove();
  // Real timers: the memory is there at once, and gone once the window has passed (about 650 ms). A large maxAge
  // tells a deleted memory apart from one that is merely older than the window.
  expect(shared.recall('card', card('b'), 60_000)).toBeDefined();
  await new Promise(resolve => setTimeout(resolve, 700));
  expect(shared.recall('card', card('b'), 60_000)).toBeUndefined();
  expect(shared.recall('card', card('b'), 600)).toBeUndefined();
});

// ─── A page that scrolls between the departure and the arrival (step 8a-1) ───

/** The table of contents in miniature: two links, and the highlight is a shared element inside the link it is on. */
const scrollingCss = `
  .doc { position: relative; display: flex; align-items: flex-start; width: 600px; height: 3000px; }
  .main { width: 300px; height: 3000px; }
  .aside { position: relative; width: 200px; height: 400px; }
  .aside.sticky { position: sticky; top: 0; }
  .link { position: absolute; left: 0; width: 180px; height: 40px; }
  .highlight { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
  .scroller { position: relative; width: 600px; height: 300px; overflow: auto; }
`;

/** The links sit in an aside that is sticky or not, in the window or in a scroll container; `#l1` is at 100 px, `#l2` at 200 px. */
function scrollingPage(sticky: boolean, inScroller: boolean): void {
  style = document.createElement('style');
  style.textContent = scrollingCss;
  document.head.append(style);
  const doc = `<div class="doc"><div class="main"></div><aside class="aside${sticky ? ' sticky' : ''}"><div class="link" id="l1" style="top: 100px"></div><div class="link" id="l2" style="top: 200px"></div></aside></div>`;
  host = document.createElement('div');
  host.innerHTML = inScroller ? `<div class="scroller" id="scroller">${doc}</div>` : doc;
  document.body.append(host);
}

/** The highlight: a plain element, which is bound once it is inside a link. */
function highlight(id: string): HTMLElement {
  const element = document.createElement('div');
  element.id = id;
  element.className = 'highlight';
  return element;
}

/**
 * The highlight leaves link 1 and joins link 2 in one task, as a re-render does. `between` moves the page after the
 * highlight was seen on link 1 and before it leaves. Its flight starts where link 1 is now, and in the middle it is
 * between the two links (± 1 px): frozen with pause and seek, then played to the end.
 */
async function moveHighlight(key: string, between: () => void): Promise<void> {
  const link1 = byId('l1');
  const link2 = byId('l2');
  const first = highlight(`${key}-first`);
  link1.append(first);
  const old = bindTo(first, { shared: key });
  between();
  const from = rectOf(link1);
  const to = rectOf(link2);
  old.destroy();
  first.remove();
  const second = highlight(`${key}-second`);
  link2.append(second);
  const binding = bindTo(second, { shared: key });
  const handle = moving(binding);
  handle.pause();
  handle.seek(0);
  expectNear(rectOf(second), from, 1);
  handle.seek(handle.duration / 2);
  const middle = rectOf(second).top;
  const span = `links at ${from.top} and ${to.top}`;
  expect(middle, `middle ${middle}, ${span}`).toBeGreaterThanOrEqual(Math.min(from.top, to.top) - 1);
  expect(middle, `middle ${middle}, ${span}`).toBeLessThanOrEqual(Math.max(from.top, to.top) + 1);
  handle.play();
  await handle.finished;
  expectNear(rectOf(second), to, 0.5);
  expectNothingInline(second);
}

it('[Step 8a-1] on a scrolled page, the highlight leaves a sticky link from where that link is now', async () => {
  scrollingPage(true, false);
  window.scrollTo(0, 150);
  await moveHighlight('toc-sticky', () => window.scrollTo(0, 400));
});

it('[Step 8a-1] without scrolling, the highlight leaves a sticky link from where that link is', async () => {
  scrollingPage(true, false);
  window.scrollTo(0, 150);
  await moveHighlight('toc-still', () => {});
});

it('[Step 8a-1] when the links are not sticky, they move with the page and the highlight leaves them from there', async () => {
  scrollingPage(false, false);
  window.scrollTo(0, 150);
  await moveHighlight('toc-static', () => window.scrollTo(0, 400));
});

it('[Step 8a-1] in a scroll container, the highlight leaves a link that the container scrolled from where the link is now', async () => {
  scrollingPage(false, true);
  const scroller = byId('scroller');
  await moveHighlight('toc-scroller', () => {
    scroller.scrollTop = 120;
  });
});

it('[Step 8a-1] in a scroll container, a sticky link does not move, and the highlight leaves it from there', async () => {
  scrollingPage(true, true);
  const scroller = byId('scroller');
  await moveHighlight('toc-scroller-sticky', () => {
    scroller.scrollTop = 120;
  });
});

it('[Step 8a-1] a holder that leaves in mid-flight hands its place over where it is on the screen, not where it rests', async () => {
  page();
  style.textContent += '\n.list.moved { padding-left: 100px; }';
  const a = byId('a');
  const old = bindTo(a);
  // The thumbnail moves inside its list: its layout move starts, and it is frozen a fifth of the way.
  list().classList.add('moved');
  await Promise.resolve();
  const flight = moving(old);
  flight.pause();
  flight.seek(flight.duration * 0.2);
  const onScreen = rectOf(a);
  expect(onScreen.left, `the holder is at ${onScreen.left}, between its rest (0) and its move (100)`).toBeGreaterThan(2);
  expect(onScreen.left).toBeLessThan(98);
  old.destroy();
  a.remove();
  const b = card('b');
  detail().append(b);
  const binding = bindTo(b);
  const handle = moving(binding);
  handle.pause();
  handle.seek(0);
  expectNear(rectOf(b), onScreen, 1);
  handle.play();
  await handle.finished;
  expectNear(rectOf(b), natural(), 0.5);
  expectNothingInline(b);
});
