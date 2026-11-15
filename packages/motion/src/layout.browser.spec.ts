import { afterEach, beforeEach, expect, it } from 'vitest';
import { getMotion, motion, motionWhenDefined, type DeferredMotion, type MotionBinding } from './bind.js';
import type { MotionHandle } from './contract.js';
import { reflow } from './presets.js';
import { defineMotion } from './define-motion.js';
import { springOffset, springVelocity } from './spring.js';
import { springParams } from './tokens.js';

type Rect = { left: number; top: number; width: number; height: number };

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const byId = (id: string) => document.getElementById(id) as HTMLElement;

/** The box of `element` relative to `origin`, so that the page position and scrolling do not matter. */
function local(element: HTMLElement, origin: HTMLElement): Rect {
  const r = element.getBoundingClientRect();
  const o = origin.getBoundingClientRect();
  return { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height };
}

function expectNear(actual: Rect, expected: Rect, tolerance: number): void {
  for (const key of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `${key} measured ${actual[key]}, expected ${expected[key]}`).toBeLessThanOrEqual(tolerance);
  }
}

/** Scale as [x, y], whatever the browser's serialization of a one-value scale. */
function scaleOf(element: HTMLElement): number[] {
  const [x = '1', y = x] = getComputedStyle(element).scale.split(' ');
  return [parseFloat(x), parseFloat(y)];
}

/** A row of 50px boxes: `.row.end` packs them to the right edge; `.box.wide` doubles a box's width. */
const css = (width = 300) => `
  .row { display: flex; flex: none; justify-content: flex-start; width: ${width}px; height: 40px; }
  .row.end { justify-content: flex-end; }
  .row.start { justify-content: flex-start; }
  .box { flex: none; width: 50px; height: 40px; }
  .box.wide { width: 100px; }
  .box.author { translate: 16px 0; scale: 0.95; }
`;

let host: HTMLElement;
let style: HTMLStyleElement;
let bindings: MotionBinding[];
let deferreds: DeferredMotion[];

/** Build the test markup in a host with its own stylesheet. */
function page(stylesheet: string, markup: string): void {
  style = document.createElement('style');
  style.textContent = stylesheet;
  document.head.append(style);
  host = document.createElement('div');
  host.innerHTML = markup;
  document.body.append(host);
}

/** Bind a layout motion and remember the binding so that cleanup destroys it. */
function bindTo(element: HTMLElement): MotionBinding {
  const binding = motion(element, reflow);
  bindings.push(binding);
  return binding;
}

/** The move in flight; the test fails when there is none. */
function moving(binding: MotionBinding): MotionHandle {
  const handle = binding.handle;
  if (!handle) throw new Error('no move in flight');
  return handle;
}

beforeEach(() => {
  bindings = [];
  deferreds = [];
});

afterEach(() => {
  for (const deferred of deferreds) deferred.destroy();
  for (const binding of bindings) binding.destroy();
  host.remove();
  style.remove();
  delete document.documentElement.dataset.motionPolicy;
});

it('starts from where the element was and ends in its new place with nothing inline', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  const before = local(box, row);
  row.classList.add('end');
  await Promise.resolve();
  expect(binding.handle).not.toBeNull();
  expectNear(local(box, row), before, 1);
  await moving(binding).finished;
  expectNear(local(box, row), { left: 250, top: 0, width: 50, height: 40 }, 0.5);
  expect(box.style.translate).toBe('');
  expect(box.style.scale).toBe('');
  expect(box.getAnimations()).toHaveLength(0);
});

it('writes no presence attribute, and rejects setPresent with a TypeError', () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const binding = bindTo(byId('box'));
  expect(binding.verb).toBe('layout');
  expect(byId('box').dataset.presence).toBeUndefined();
  expect(byId('box').hasAttribute('inert')).toBe(false);
  expect(() => binding.setPresent(false)).toThrow(TypeError);
});

it('binds the reflow preset by reference and by name', () => {
  page(css(), '<div class="row"><div class="box" id="a"></div></div><div class="row"><div class="box" id="b"></div></div>');
  deferreds.push(motionWhenDefined(byId('a'), 'reflow'));
  bindings.push(motion(byId('b'), reflow));
  expect(deferreds[0].binding?.verb).toBe('layout');
  expect(getMotion(byId('b'))?.verb).toBe('layout');
});

it('moves three followed children to their new order, each to its exact place', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="a"></div><div class="box" id="b"></div><div class="box" id="c"></div></div>');
  const row = byId('row');
  for (const id of ['a', 'b', 'c']) bindTo(byId(id));
  row.append(row.firstElementChild as HTMLElement);
  await Promise.resolve();
  expect(document.getAnimations()).toHaveLength(3);
  await Promise.all(['a', 'b', 'c'].map(id => moving(getMotion(byId(id))!).finished));
  expectNear(local(byId('a'), row), { left: 100, top: 0, width: 50, height: 40 }, 0.5);
  expectNear(local(byId('b'), row), { left: 0, top: 0, width: 50, height: 40 }, 0.5);
  expectNear(local(byId('c'), row), { left: 50, top: 0, width: 50, height: 40 }, 0.5);
});

it('animates a size change as a scale and ends at the natural width with nothing inline', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  const before = local(box, row);
  box.classList.add('wide');
  await Promise.resolve();
  expectNear(local(box, row), before, 1);
  expect(scaleOf(box)[0]).toBeCloseTo(0.5, 2);
  await moving(binding).finished;
  expectNear(local(box, row), { left: 0, top: 0, width: 100, height: 40 }, 0.5);
  expect(box.style.scale).toBe('');
});

it('[Review Focus 1] a second change mid-course starts from the visual position, without a jump', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  const first = moving(binding);
  first.pause();
  first.seek(first.duration * 0.15);
  const mid = local(box, row);
  expect(mid.left).toBeGreaterThan(50);
  expect(mid.left).toBeLessThan(200);
  row.classList.remove('end');
  await Promise.resolve();
  expectNear(local(box, row), mid, 2);
  await moving(binding).finished;
  expectNear(local(box, row), { left: 0, top: 0, width: 50, height: 40 }, 0.5);
  expect(box.style.translate).toBe('');
  expect(box.style.scale).toBe('');
});

it('[Review Focus 2] a change after a scroll starts from the scrolled position', async () => {
  page(
    css() + `
      .scroller { width: 300px; height: 100px; overflow: auto; overflow-anchor: none; }
      .column { display: flex; flex-direction: column; justify-content: flex-start; height: 300px; }
      .column.end { justify-content: flex-end; }
    `,
    '<div class="scroller" id="scroller" data-motion-scope><div class="column" id="column"><div class="box" id="box"></div></div></div>',
  );
  const scroller = byId('scroller');
  const column = byId('column');
  const box = byId('box');
  const binding = bindTo(box);
  scroller.scrollTop = 40;
  await nextFrame();
  await nextFrame();
  const before = local(box, scroller);
  expect(before.top).toBeCloseTo(-40, 0);
  column.classList.add('end');
  await Promise.resolve();
  expectNear(local(box, scroller), before, 1);
  await moving(binding).finished;
  expectNear(local(box, scroller), { left: 0, top: 220, width: 50, height: 40 }, 0.5);
});

it('[Review Focus 3] a hidden element moves nothing, when it is hidden and when it is shown again', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const box = byId('box');
  const binding = bindTo(box);
  box.hidden = true;
  await Promise.resolve();
  expect(binding.handle).toBeNull();
  box.hidden = false;
  await Promise.resolve();
  expect(binding.handle).toBeNull();
  expect(document.getAnimations()).toHaveLength(0);
});

it('[Review Focus 4] an author transform is the rest state, read back as the start of the move', async () => {
  page(css(), '<div class="row" id="row"><div class="box author" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  const translateBefore = getComputedStyle(box).translate;
  const scaleBefore = getComputedStyle(box).scale;
  const before = local(box, row);
  row.classList.add('end');
  await Promise.resolve();
  expectNear(local(box, row), before, 1);
  await moving(binding).finished;
  expect(getComputedStyle(box).translate).toBe(translateBefore);
  expect(getComputedStyle(box).scale).toBe(scaleBefore);
  expect(box.style.translate).toBe('');
  expect(box.style.scale).toBe('');
  expectNear(local(box, row), { left: 267.25, top: 1, width: 47.5, height: 38 }, 0.5);
});

it('[Review Focus 5] a width change seen only by the ResizeObserver refreshes the cache without animating', async () => {
  page(css(300), '<div class="row end" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  style.textContent = css(200);
  await nextFrame();
  await nextFrame();
  expect(binding.handle).toBeNull();
  expectNear(local(box, row), { left: 150, top: 0, width: 50, height: 40 }, 0.5);
  const before = local(box, row);
  row.classList.replace('end', 'start');
  await Promise.resolve();
  expectNear(local(box, row), before, 1);
  await moving(binding).finished;
  expectNear(local(box, row), { left: 0, top: 0, width: 50, height: 40 }, 0.5);
});

it('a resize followed immediately by a change starts from the resized position', async () => {
  page(css(300), '<div class="row end" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  // Wait for the observer's callback itself, not for a frame: rAF callbacks run before the ResizeObserver
  // delivery, so one frame cannot prove that the cache was refreshed. The engine's observer is older, so it runs first.
  const resized = new Promise<void>(resolve => {
    const observer = new ResizeObserver(() => {
      observer.disconnect();
      resolve();
    });
    observer.observe(row);
  });
  style.textContent = css(200);
  await resized;
  await Promise.resolve();
  expect(binding.handle).toBeNull();
  const before = local(box, row);
  expectNear(before, { left: 150, top: 0, width: 50, height: 40 }, 0.5);
  row.classList.replace('end', 'start');
  await Promise.resolve();
  expect(binding.handle).not.toBeNull();
  expectNear(local(box, row), before, 1);
  await moving(binding).finished;
  expectNear(local(box, row), { left: 0, top: 0, width: 50, height: 40 }, 0.5);
});

it('moves nothing under reduced motion: the element is at its new place at once', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  expect(binding.handle).toBeNull();
  expect(document.getAnimations()).toHaveLength(0);
  expectNear(local(box, row), { left: 250, top: 0, width: 50, height: 40 }, 0.5);
});

it('moves nothing when --udx-motion is none on the scope', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  row.style.setProperty('--udx-motion', 'none');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  expect(binding.handle).toBeNull();
  expect(document.getAnimations()).toHaveLength(0);
  expectNear(local(box, row), { left: 250, top: 0, width: 50, height: 40 }, 0.5);
});

it('follows a change on a neighbour of its row when the scope is an ancestor', async () => {
  page(
    css() + '.scope { display: flex; } .other { flex: none; width: 0; height: 40px; } .other.grow { width: 100px; }',
    '<div class="scope" id="scope" data-motion-scope><div class="other" id="other"></div><div class="row" id="row"><div class="box" id="box"></div></div></div>',
  );
  const scope = byId('scope');
  const box = byId('box');
  const binding = bindTo(box);
  const before = local(box, scope);
  byId('other').classList.add('grow');
  await Promise.resolve();
  expect(binding.handle).not.toBeNull();
  expectNear(local(box, scope), before, 1);
  await moving(binding).finished;
  expectNear(local(box, scope), { left: 100, top: 0, width: 50, height: 40 }, 0.5);
});

it('destroy() in flight cancels the move and leaves nothing inline; a later change starts nothing', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  const handle = moving(binding);
  binding.destroy();
  await expect(handle.finished).resolves.toBe('cancelled');
  expect(box.getAnimations()).toHaveLength(0);
  expect(box.style.translate).toBe('');
  expect(box.style.scale).toBe('');
  expect(getMotion(box)).toBeUndefined();
  row.classList.remove('end');
  await Promise.resolve();
  expect(document.getAnimations()).toHaveLength(0);
});

it('play() after an unobserved change flies the element from its last measured place', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  box.style.marginLeft = '40px';
  const handle = binding.play();
  expect(handle.duration).toBeGreaterThan(0);
  expect(binding.handle).toBe(handle);
  expect(box.getAnimations()).toHaveLength(1);
  expectNear(local(box, row), { left: 0, top: 0, width: 50, height: 40 }, 1);
  await handle.finished;
  expectNear(local(box, row), { left: 40, top: 0, width: 50, height: 40 }, 0.5);
});

it('an unrelated mutation does not restart a move in flight', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  const first = moving(binding);
  row.dataset.x = '1';
  await Promise.resolve();
  expect(binding.handle).toBe(first);
  await expect(first.finished).resolves.toBe('finished');
  expectNear(local(box, row), { left: 250, top: 0, width: 50, height: 40 }, 0.5);
  expect(box.style.translate).toBe('');
  expect(box.style.scale).toBe('');
});

it('only the element whose destination changed is restarted', async () => {
  page(
    css() + '.row.tall { height: 100px; } .box.lower { align-self: flex-end; }',
    '<div class="row tall" id="row"><div class="box" id="a"></div><div class="box" id="b"></div></div>',
  );
  const row = byId('row');
  const a = byId('a');
  const b = byId('b');
  const bindingA = bindTo(a);
  const bindingB = bindTo(b);
  row.classList.add('end');
  await Promise.resolve();
  const aFirst = moving(bindingA);
  const bFirst = moving(bindingB);
  b.classList.add('lower');
  await Promise.resolve();
  expect(bindingA.handle).toBe(aFirst);
  expect(a.getAnimations()).toHaveLength(1);
  expect(bindingB.handle).not.toBeNull();
  expect(bindingB.handle).not.toBe(bFirst);
  await Promise.all([aFirst.finished, moving(bindingB).finished]);
  expectNear(local(a, row), { left: 200, top: 0, width: 50, height: 40 }, 0.5);
  expectNear(local(b, row), { left: 250, top: 60, width: 50, height: 40 }, 0.5);
});

/** The spring of the default layout move, and the two layout motions of the keyframe tests. */
const spring = springParams('spring.default.spatial', 'expressive');
const restarting = defineMotion('restart-reflow', { verb: 'layout', interrupt: 'restart' });
const curved = defineMotion('curved-reflow', { verb: 'layout', timing: { duration: 'duration.medium2', easing: 'easing.standard' } });

/** Keyframes of the move running on `element`. */
function keyframeCount(element: HTMLElement): number {
  return (element.getAnimations()[0].effect as KeyframeEffect).getKeyframes().length;
}

/** Chord of a move over 16 ms, in px/s: its displacement from a seek to its first instant, divided by 16 ms. */
function chordOf16ms(element: HTMLElement, origin: HTMLElement, handle: MotionHandle): number {
  handle.pause();
  handle.seek(0);
  const left0 = local(element, origin).left;
  handle.seek(16);
  return (local(element, origin).left - left0) / 0.016;
}

/** Chord over 16 ms of the continuous spring that starts `offset` from its target with `velocity`, in px/s. */
function springChord16ms(offset: number, velocity: number): number {
  return (springOffset(spring, offset, velocity, 0.016) - springOffset(spring, offset, velocity, 0)) / 0.016;
}

it('an interrupted move restarts with the velocity it had', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  const first = moving(binding);
  first.pause();
  first.seek(first.duration * 0.15);
  const velocity = springVelocity(spring, -250, 0, (0.15 * first.duration) / 1000);
  const offset = local(box, row).left; // distance to the new rest (left 0) at the interruption
  row.classList.remove('end');
  await Promise.resolve();
  // The chord is compared with the continuous spring's chord, not with the instantaneous velocity, because the spring's acceleration (about 1e5 px/s²) changes the velocity by more than the tolerance within 16 ms.
  const measured = chordOf16ms(box, row, moving(binding));
  const expected = springChord16ms(offset, velocity);
  expect(Math.abs(measured - expected), `chord measured ${measured} px/s, expected ${expected} px/s`).toBeLessThanOrEqual(0.05 * Math.abs(expected));
  const fromRest = springChord16ms(offset, 0);
  expect(Math.abs(measured - fromRest), `chord measured ${measured} px/s, from rest ${fromRest} px/s`).toBeGreaterThan(500);
});

it('[Review Focus 1] interrupted while overshooting: continuous position, carried chord, exact arrival', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  const first = moving(binding);
  first.pause();
  first.seek(first.duration * 0.6);
  const mid = local(box, row);
  expect(mid.left).toBeGreaterThan(250);
  const velocity = springVelocity(spring, -250, 0, (0.6 * first.duration) / 1000);
  row.classList.remove('end');
  await Promise.resolve();
  expectNear(local(box, row), mid, 2);
  const second = moving(binding);
  const measured = chordOf16ms(box, row, second);
  const expected = springChord16ms(mid.left, velocity);
  expect(Math.abs(measured - expected), `chord measured ${measured} px/s, expected ${expected} px/s`).toBeLessThanOrEqual(0.05 * Math.abs(expected));
  second.play();
  await second.finished;
  expectNear(local(box, row), { left: 0, top: 0, width: 50, height: 40 }, 0.5);
  expect(box.style.translate).toBe('');
  expect(box.style.scale).toBe('');
});

it('a move from rest keeps two keyframes, and a carried move has at least nine', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = bindTo(box);
  row.classList.add('end');
  await Promise.resolve();
  expect(keyframeCount(box)).toBe(2);
  const first = moving(binding);
  first.pause();
  first.seek(first.duration * 0.15);
  row.classList.remove('end');
  await Promise.resolve();
  expect(keyframeCount(box)).toBeGreaterThanOrEqual(9);
});

it('a move of an element defined with interrupt restart starts from rest, with two keyframes', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = motion(box, restarting);
  bindings.push(binding);
  row.classList.add('end');
  await Promise.resolve();
  const first = moving(binding);
  first.pause();
  first.seek(first.duration * 0.15);
  row.classList.remove('end');
  await Promise.resolve();
  expect(keyframeCount(box)).toBe(2);
});

it('an interrupted curve move starts from rest, with two keyframes', async () => {
  page(css(), '<div class="row" id="row"><div class="box" id="box"></div></div>');
  const row = byId('row');
  const box = byId('box');
  const binding = motion(box, curved);
  bindings.push(binding);
  row.classList.add('end');
  await Promise.resolve();
  const first = moving(binding);
  first.pause();
  first.seek(first.duration * 0.15);
  row.classList.remove('end');
  await Promise.resolve();
  expect(keyframeCount(box)).toBe(2);
});

/** A card of 200 px that grows to 400 px, with children of fixed size that keep their own shape. */
const cardCss = `
  .card { display: flex; align-items: center; width: 200px; height: 60px; padding: 0 20px; box-sizing: border-box; }
  .card.wide { width: 400px; }
  .child { flex: none; width: 80px; height: 20px; }
  .child.centred { margin: 0 auto; }
  .child.right { margin-left: auto; }
  .title { flex: 1; margin: 0; }
  .inner { flex: 1; display: flex; }
  .tiny { flex: none; width: 30px; height: 10px; margin-left: auto; }
  .label { flex: none; margin-left: auto; }
`;

/** The shares of a move at which its content is checked. */
const SHARES = [0.15, 0.3, 0.6];

/** Pause the move of `root` and of every element under it, and set all of them to `ms` of their own time. */
function seekAll(handle: MotionHandle, root: HTMLElement, ms: number): void {
  handle.pause();
  handle.seek(ms);
  for (const element of [root, ...root.querySelectorAll<HTMLElement>('*')]) {
    for (const animation of element.getAnimations()) {
      animation.pause();
      animation.currentTime = ms;
    }
  }
}

/** The element is `width` by `height` as measured on screen, within half a pixel. */
function expectSize(element: HTMLElement, width: number, height: number): void {
  const r = element.getBoundingClientRect();
  expect(Math.abs(r.width - width), `width measured ${r.width}, expected ${width}`).toBeLessThanOrEqual(0.5);
  expect(Math.abs(r.height - height), `height measured ${r.height}, expected ${height}`).toBeLessThanOrEqual(0.5);
}

it('a child keeps its size while its card resizes, and the card shows an intermediate width', async () => {
  page(cardCss, '<div class="card" id="card"><div class="child" id="child"></div></div>');
  const card = byId('card');
  const child = byId('child');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const handle = moving(binding);
  for (const share of SHARES) {
    seekAll(handle, card, share * handle.duration);
    const width = card.getBoundingClientRect().width;
    expect(width, `card width ${width} at ${share * 100} %`).toBeGreaterThan(200);
    expectSize(child, 80, 20);
  }
});

it('[Review Focus 2] a centred child stays centred, and a child at the right keeps 20 px to the right edge', async () => {
  page(
    cardCss,
    '<div class="card" id="card-a"><div class="child centred" id="centred"></div></div><div class="card" id="card-b"><div class="child right" id="right"></div></div>',
  );
  const a = byId('card-a');
  const b = byId('card-b');
  const bindingA = bindTo(a);
  const bindingB = bindTo(b);
  a.classList.add('wide');
  b.classList.add('wide');
  await Promise.resolve();
  const handleA = moving(bindingA);
  const handleB = moving(bindingB);
  for (const share of SHARES) {
    seekAll(handleA, a, share * handleA.duration);
    seekAll(handleB, b, share * handleB.duration);
    const card = a.getBoundingClientRect();
    const centred = byId('centred').getBoundingClientRect();
    const offset = centred.left + centred.width / 2 - (card.left + card.width / 2);
    expect(Math.abs(offset), `centre offset ${offset} px at ${share * 100} %`).toBeLessThanOrEqual(1);
    const cardB = b.getBoundingClientRect();
    const right = byId('right').getBoundingClientRect();
    const gap = cardB.right - right.right;
    expect(Math.abs(gap - 20), `right gap ${gap} px at ${share * 100} %`).toBeLessThanOrEqual(1);
  }
});

it('a block title with text keeps its final width, and its start edge stays 20 px from the left', async () => {
  page(cardCss, '<div class="card" id="card"><h3 class="title" id="title">Title</h3></div>');
  const card = byId('card');
  const title = byId('title');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const handle = moving(binding);
  for (const share of SHARES) {
    seekAll(handle, card, share * handle.duration);
    const r = title.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    expect(Math.abs(r.width - 360), `title width ${r.width} px at ${share * 100} %`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(r.left - c.left - 20), `title edge ${r.left - c.left} px at ${share * 100} %`).toBeLessThanOrEqual(1);
  }
});

it('the innermost child of a nested box keeps its size', async () => {
  page(cardCss, '<div class="card" id="card"><div class="inner" id="inner"><div class="tiny" id="tiny"></div></div></div>');
  const card = byId('card');
  const tiny = byId('tiny');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const handle = moving(binding);
  for (const share of SHARES) {
    seekAll(handle, card, share * handle.duration);
    expectSize(tiny, 30, 10);
  }
});

it('[Review Focus 5] a text change seen without a move is in the cache before the next move', async () => {
  page(cardCss, '<div class="card" id="card"><span class="label" id="label">Short</span></div>');
  const card = byId('card');
  const label = byId('label');
  const binding = bindTo(card);
  (label.firstChild as Text).data = 'A much longer label';
  await Promise.resolve();
  expect(binding.handle).toBeNull();
  const before = local(label, card);
  card.classList.add('wide');
  await Promise.resolve();
  const handle = moving(binding);
  const finalLeft = 380 - before.width; // right-aligned in a 400 px card with 20 px padding
  for (const share of SHARES) {
    seekAll(handle, card, share * handle.duration);
    const q = (card.getBoundingClientRect().width - 200) / 200;
    const expected = before.left + (finalLeft - before.left) * q;
    const actual = local(label, card).left;
    expect(Math.abs(actual - expected), `left ${actual} px, interpolation ${expected} px at ${share * 100} %`).toBeLessThanOrEqual(1);
  }
});

it('once finished, nothing under the card keeps an inline transform or an animation', async () => {
  page(cardCss, '<div class="card" id="card"><div class="child" id="child"></div><h3 class="title">Title</h3><div class="inner"><div class="tiny"></div></div></div>');
  const card = byId('card');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  expect(byId('child').getAnimations()).toHaveLength(1);
  await moving(binding).finished;
  for (const element of [card, ...card.querySelectorAll<HTMLElement>('*')]) {
    expect(element.style.translate).toBe('');
    expect(element.style.scale).toBe('');
    expect(element.getAnimations()).toHaveLength(0);
  }
});

it('a card that only moves animates none of its children', async () => {
  page(css() + cardCss, '<div class="row" id="row"><div class="card" id="card"><div class="child" id="child"></div></div></div>');
  const row = byId('row');
  const card = byId('card');
  const binding = bindTo(card);
  row.classList.add('end');
  await Promise.resolve();
  expect(binding.handle).not.toBeNull();
  expect(byId('child').getAnimations()).toHaveLength(0);
  await moving(binding).finished;
});

it('a card of 30 children animates at most 24 of them', async () => {
  const children = Array.from({ length: 30 }, () => '<div class="child"></div>').join('');
  page(cardCss, `<div class="card" id="card">${children}</div>`);
  const card = byId('card');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const animated = Array.from(card.querySelectorAll<HTMLElement>('*')).filter(element => element.getAnimations().length > 0);
  expect(animated.length, `${animated.length} children animated`).toBeGreaterThan(0);
  expect(animated.length, `${animated.length} children animated`).toBeLessThanOrEqual(24);
  await moving(binding).finished;
});

/** On screen, the distance from the right edge of `child` to the right edge of `card`. */
const rightGap = (card: HTMLElement, child: HTMLElement): number => card.getBoundingClientRect().right - child.getBoundingClientRect().right;

/** A card that grows, with a right-aligned child that must stay 20 px from its visual right edge. */
const syncPage = (): void => page(cardCss, '<div class="card" id="card"><div class="child right" id="child"></div></div>');

it('a card at rest scale one half keeps its right-aligned child at the same distance on screen', async () => {
  page(`${cardCss} .card.scaled { scale: 0.5; }`, '<div class="card scaled" id="card"><div class="child right" id="child"></div></div>');
  const card = byId('card');
  const child = byId('child');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const handle = moving(binding);
  for (const share of SHARES) {
    seekAll(handle, card, share * handle.duration);
    const gap = rightGap(card, child);
    expect(Math.abs(gap - 10), `gap ${gap} px at ${share * 100} %`).toBeLessThanOrEqual(1);
    expectSize(child, 40, 10);
  }
});

it('[sync] a right-aligned child stays 20 px from the visual right edge of its card, on a move from rest', async () => {
  syncPage();
  const card = byId('card');
  const child = byId('child');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const handle = moving(binding);
  for (const share of SHARES) {
    seekAll(handle, card, share * handle.duration);
    const gap = rightGap(card, child);
    expect(Math.abs(gap - 20), `gap ${gap} px at ${share * 100} %`).toBeLessThanOrEqual(1);
  }
});

it('[sync] a right-aligned child stays 20 px from the visual right edge of its card, on a CurveTiming move', async () => {
  syncPage();
  const card = byId('card');
  const child = byId('child');
  const binding = motion(card, curved);
  bindings.push(binding);
  card.classList.add('wide');
  await Promise.resolve();
  const handle = moving(binding);
  for (const share of SHARES) {
    seekAll(handle, card, share * handle.duration);
    const gap = rightGap(card, child);
    expect(Math.abs(gap - 20), `gap ${gap} px at ${share * 100} %`).toBeLessThanOrEqual(1);
  }
});

it('[sync] a right-aligned child stays 20 px from the visual right edge of its card, on a carried move', async () => {
  syncPage();
  const card = byId('card');
  const child = byId('child');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const first = moving(binding);
  seekAll(first, card, 0.15 * first.duration);
  card.classList.remove('wide');
  await Promise.resolve();
  const second = moving(binding);
  for (const share of SHARES) {
    seekAll(second, card, share * second.duration);
    const gap = rightGap(card, child);
    expect(Math.abs(gap - 20), `gap ${gap} px at ${share * 100} %`).toBeLessThanOrEqual(1);
  }
});

it('[Review Focus 4] an interrupted move hands its content over without a jump, and arrives exact', async () => {
  page(cardCss, '<div class="card" id="card"><h3 class="title" id="title">Title</h3><div class="inner" id="inner"><div class="tiny" id="tiny"></div></div><div class="child right" id="child"></div></div>');
  const card = byId('card');
  const nodes = ['title', 'inner', 'tiny', 'child'].map(byId);
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const first = moving(binding);
  seekAll(first, card, 0.15 * first.duration);
  const before = nodes.map(node => node.getBoundingClientRect());
  card.classList.remove('wide');
  await Promise.resolve();
  const after = nodes.map(node => node.getBoundingClientRect());
  // A text node takes its destination width at once, by design: its glyphs are never stretched, so only its box changes.
  nodes.forEach((node, i) => {
    const keys = node.id === 'title' ? (['left', 'top', 'height'] as const) : (['left', 'top', 'width', 'height'] as const);
    for (const key of keys) {
      expect(Math.abs(after[i][key] - before[i][key]), `${node.id} ${key}: ${after[i][key]} after, ${before[i][key]} before`).toBeLessThanOrEqual(2);
    }
  });
  await moving(binding).finished;
  const child = byId('child');
  expectSize(child, 80, 20);
  expect(Math.abs(rightGap(card, child) - 20), `gap ${rightGap(card, child)} px at the end`).toBeLessThanOrEqual(0.5);
  for (const element of [card, ...card.querySelectorAll<HTMLElement>('*')]) {
    expect(element.style.translate).toBe('');
    expect(element.style.scale).toBe('');
    expect(element.getAnimations()).toHaveLength(0);
  }
});

it('a carried move that returns to the size the card looks like keeps its content undistorted', async () => {
  page(cardCss, '<div class="card" id="card"><div class="child" id="child"></div></div>');
  const card = byId('card');
  const child = byId('child');
  const binding = bindTo(card);
  card.classList.add('wide');
  await Promise.resolve();
  const first = moving(binding);
  seekAll(first, card, 0.15 * first.duration);
  const width = card.getBoundingClientRect().width;
  // The observer ignores style attributes: the new size is set by a class, whose rule is added to the page first.
  style.textContent += `.card.match { width: ${width}px; }`;
  card.classList.remove('wide');
  card.classList.add('match');
  await Promise.resolve();
  const second = moving(binding);
  for (const ms of [0, 50, 100]) {
    seekAll(second, card, ms);
    expectSize(child, 80, 20);
  }
});
