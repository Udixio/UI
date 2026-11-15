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
