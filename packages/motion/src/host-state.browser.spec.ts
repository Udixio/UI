/**
 * Step C of the box rule: on a host declared with no box, the host carries the state and the box carries the pixels. `hidden`,
 * `data-motion-presence` and `inert` go on the host, the element the author wrote and the only one the server renders; the
 * animated styles, the gesture listeners, `touch-action` and the keyboard alternative's `tabindex` go on its box. And `hidden`
 * hides the host: the runtime ends an exit with `display: none` held inline on an element with no box, since `hidden` does not
 * win over a `display: contents` the author gave.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, motion, motionsWhenDefined, type DeferredMotion, type MotionBinding } from './bind.js';
import { connectMotion } from './connect.js';
import { defineMotion } from './define-motion.js';
import { defineGesture } from './gesture.js';
import { gesture, getGesture, type GestureBinding } from './gesture-binding.js';
import { releaseHiddenHold, setPresentByHidden } from './hidden-presence.js';
import { fade, slide } from './presets.js';

defineMotion('host-state-fade', fade.spec);
defineGesture('host-state-drag', { type: 'drag', bounds: 'none', alternative: 'arrows' });
defineGesture('host-state-swipe', { type: 'swipe', alternative: 'action' });
defineGesture('host-state-row', { type: 'reorder', alternative: 'grab' });

const tick = () => Promise.resolve();
const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

let root: HTMLElement;
let sheet: HTMLStyleElement;
let bindings: MotionBinding[];
let deferreds: DeferredMotion[];
let gestures: GestureBinding[];

beforeEach(() => {
  sheet = document.createElement('style');
  // `.sheet-contents` does not yield to [hidden], as a plain author rule; `.yielding` does, as Udixio hosts do.
  sheet.textContent = '.sheet-contents { display: contents; } .yielding:not([hidden]) { display: contents; }';
  document.head.append(sheet);
  root = document.createElement('div');
  document.body.append(root);
  bindings = [];
  deferreds = [];
  gestures = [];
});

afterEach(() => {
  for (const each of gestures) each.destroy();
  for (const each of deferreds) each.destroy();
  for (const each of bindings) each.destroy();
  root.remove();
  sheet.remove();
  delete document.documentElement.dataset.motionPolicy;
  vi.restoreAllMocks();
});

type Declaration = 'style' | 'option' | 'attribute';

/** A host declared with no box by `how`, around one box: an <article> of 200 × 80 px. */
function declaredHost(how: Declaration, className = ''): { host: HTMLElement; box: HTMLElement } {
  const host = document.createElement('span');
  if (how === 'style') host.style.display = 'contents';
  else host.className = className || 'sheet-contents';
  if (how === 'attribute') host.setAttribute('data-motion-box', 'child');
  host.innerHTML = '<article style="display:block;width:200px;height:80px">Weekly report</article>';
  root.append(host);
  return { host, box: host.querySelector('article')! };
}

/** Whether the box is drawn: it has a size on the page. */
const drawn = (box: Element): boolean => box.getBoundingClientRect().height > 0;

for (const how of ['style', 'option', 'attribute'] as const) {
  it(`declared by its ${how}: an entry marks the host, not the box, and animates the box, not the host`, async () => {
    const { host, box } = declaredHost(how);
    const binding = motion(host, fade, { boxless: how === 'option' });
    bindings.push(binding);
    expect(host.dataset.motionPresence).toBe('entering');
    expect(box.hasAttribute('data-motion-presence')).toBe(false);
    expect(box.getAnimations().length).toBeGreaterThan(0);
    expect(host.getAnimations()).toHaveLength(0);
    expect(await binding.setPresent(true)).toBe('finished');
    expect(host.dataset.motionPresence).toBe('present');
    expect(box.hasAttribute('data-motion-presence')).toBe(false);
  });

  it(`declared by its ${how}: an exit makes the host inert and exiting, and moves the box`, async () => {
    const { host, box } = declaredHost(how);
    const binding = motion(host, fade, { boxless: how === 'option', settled: true });
    bindings.push(binding);
    const leaving = binding.setPresent(false);
    expect(host.dataset.motionPresence).toBe('exiting');
    expect(host.hasAttribute('inert')).toBe(true);
    expect(box.hasAttribute('inert')).toBe(false);
    expect(box.hasAttribute('data-motion-presence')).toBe(false);
    // inert on a host with no box reaches what it contains.
    box.tabIndex = -1;
    box.focus();
    expect(document.activeElement).not.toBe(box);
    expect(box.getAnimations().length).toBeGreaterThan(0);
    expect(host.getAnimations()).toHaveLength(0);
    expect(await leaving).toBe('finished');
    expect(getComputedStyle(box).opacity).toBe('0');
    // Destroyed, the binding gives the host back: no presence mark, no inert, no inline style on the box.
    binding.destroy();
    expect(host.hasAttribute('data-motion-presence')).toBe(false);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(box.style.opacity).toBe('');
  });
}

it('a host absent from the start is marked absent and inert, and its box waits in its exited frame', () => {
  const { host, box } = declaredHost('attribute');
  bindings.push(motion(host, fade, { present: false }));
  expect(host.dataset.motionPresence).toBe('exiting');
  expect(host.hasAttribute('inert')).toBe(true);
  expect(box.hasAttribute('inert')).toBe(false);
  expect(box.style.opacity).toBe('0');
});

it('a host the server marked present binds its box settled, and keeps the mark on itself', () => {
  const { host, box } = declaredHost('attribute');
  host.setAttribute('data-motion-presence', 'present');
  bindings.push(motion(host, fade));
  expect(box.getAnimations()).toHaveLength(0);
  expect(host.dataset.motionPresence).toBe('present');
  expect(box.hasAttribute('data-motion-presence')).toBe(false);
});

it('focus inside the box keeps the host focusable until it leaves, and restoreFocus moves it out before the host is inert', async () => {
  const { host, box } = declaredHost('attribute');
  box.innerHTML = '<button type="button">Inside</button>';
  const outside = document.createElement('button');
  root.append(outside);
  const binding = motion(host, fade, { settled: true, restoreFocus: outside });
  bindings.push(binding);
  box.querySelector('button')!.focus();
  const leaving = binding.setPresent(false);
  expect(document.activeElement).toBe(outside);
  expect(host.hasAttribute('inert')).toBe(true);
  await leaving;
});

it('a root swap keeps the state on the host: an absent host stays exiting and inert, and its new box waits in its exited frame', async () => {
  const { host, box } = declaredHost('attribute');
  const motions = motionsWhenDefined(host, ['host-state-fade'], { present: false });
  deferreds.push(...motions);
  const next = document.createElement('section');
  next.textContent = 'New root';
  box.replaceWith(next);
  await tick();
  expect(getMotion(next, 'presence')).toBe(motions[0].binding);
  expect(host.dataset.motionPresence).toBe('exiting');
  expect(host.hasAttribute('inert')).toBe(true);
  expect(next.hasAttribute('data-motion-presence')).toBe(false);
  expect(next.style.opacity).toBe('0');
});

// hidden: the host carries it, and it hides the host.

it('hidden by a rule that yields to [hidden], a host absent from the server HTML is not drawn before any script runs', () => {
  const { host, box } = declaredHost('attribute', 'yielding');
  host.hidden = true;
  expect(getComputedStyle(host).display).toBe('none');
  expect(drawn(box)).toBe(false);
});

for (const [label, how, className] of [
  ['its own style (display: contents inline)', 'style', ''],
  ['a stylesheet rule that does not yield to [hidden]', 'attribute', 'sheet-contents'],
  ['a stylesheet rule that yields to [hidden]', 'attribute', 'yielding'],
] as const) {
  it(`hidden on a host with no box by ${label}: drawn while its exit plays, then not drawn, and drawn again with its entry`, async () => {
    const { host, box } = declaredHost(how, className);
    const inline = host.style.getPropertyValue('display');
    const motions = [motionWhenBound(host)];
    const leaving = setPresentByHidden(host, false, motions);
    expect(host.hidden).toBe(true);
    expect(host.dataset.motionPresence).toBe('exiting');
    expect(box.hasAttribute('hidden')).toBe(false);
    expect(drawn(box)).toBe(true);
    expect(getComputedStyle(host).display).toBe('contents');
    expect(await leaving).toBe('finished');
    // The exit has ended: the host is display: none, whatever its own display says.
    expect(getComputedStyle(host).display).toBe('none');
    expect(drawn(box)).toBe(false);

    const entering = setPresentByHidden(host, true, motions);
    expect(host.hidden).toBe(false);
    // Its own display is given back as it was.
    expect(host.style.getPropertyValue('display')).toBe(inline);
    expect(getComputedStyle(host).display).toBe('contents');
    expect(drawn(box)).toBe(true);
    expect(host.dataset.motionPresence).toBe('entering');
    expect(box.getAnimations().length).toBeGreaterThan(0);
    expect(await entering).toBe('finished');
    expect(host.dataset.motionPresence).toBe('present');
  });
}

it('an element with a box ends its exit as before: no inline display, hidden by [hidden]', async () => {
  const el = document.createElement('div');
  el.textContent = 'Content';
  root.append(el);
  const motions = [motionWhenBound(el)];
  expect(await setPresentByHidden(el, false, motions)).toBe('finished');
  expect(el.style.display).toBe('');
  expect(getComputedStyle(el).display).toBe('none');
});

it('releaseHiddenHold gives a hidden host with no box its own display back', async () => {
  const { host } = declaredHost('style');
  const motions = [motionWhenBound(host)];
  await setPresentByHidden(host, false, motions);
  expect(host.style.display).toBe('none');
  releaseHiddenHold(host);
  expect(host.style.display).toBe('contents');
});

it('under reduced motion, a host with no box fades its box out and is then not drawn; shown again, its state is on the host', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  const { host, box } = declaredHost('attribute');
  const motions = [motionWhenBound(host, slide.spec)];
  expect(await setPresentByHidden(host, false, motions)).toBe('finished');
  expect(drawn(box)).toBe(false);
  expect(host.hasAttribute('inert')).toBe(true);
  expect(box.style.translate).toBe('');
  expect(await setPresentByHidden(host, true, motions)).toBe('finished');
  expect(drawn(box)).toBe(true);
  expect(host.dataset.motionPresence).toBe('present');
  expect(host.hasAttribute('inert')).toBe(false);
  expect(box.hasAttribute('data-motion-presence')).toBe(false);
  expect(getComputedStyle(box).opacity).toBe('1');
});

it('the scanner follows hidden on a declared data-motion host: the state on the host, the pixels on its box', async () => {
  const { host, box } = declaredHost('attribute');
  host.setAttribute('data-motion', 'host-state-fade');
  const disconnect = connectMotion({ root });
  try {
    host.hidden = true;
    await tick();
    expect(host.dataset.motionPresence).toBe('exiting');
    expect(host.hasAttribute('inert')).toBe(true);
    expect(box.getAnimations().length).toBeGreaterThan(0);
    await vi.waitFor(() => expect(drawn(box)).toBe(false), { timeout: 3000 });
    host.hidden = false;
    await tick();
    expect(drawn(box)).toBe(true);
    expect(host.dataset.motionPresence).toBe('entering');
  } finally {
    disconnect();
  }
});

// Gestures: the listeners, touch-action, tabindex and the moves on the box; a swiped host is hidden from assistive technology.

/** Bind a gesture, and remember it for cleanup. */
function bindGesture(host: HTMLElement, name: string, boxless = false): GestureBinding {
  const binding = gesture(host, name, { boxless });
  gestures.push(binding);
  return binding;
}

function key(el: Element, name: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
}

for (const how of ['style', 'option', 'attribute'] as const) {
  it(`declared by its ${how}: a drag puts its listeners, touch-action and tabindex on the box, and moves the box`, () => {
    const { host, box } = declaredHost(how);
    const binding = bindGesture(host, 'host-state-drag', how === 'option');
    expect(getGesture(host)).toBe(binding);
    expect(getGesture(box)).toBe(binding);
    expect(box.style.touchAction).toBe('none');
    expect(box.getAttribute('tabindex')).toBe('0');
    expect(host.hasAttribute('tabindex')).toBe(false);
    expect(host.style.touchAction).toBe('');
    box.focus();
    expect(document.activeElement).toBe(box);
    key(box, 'ArrowRight');
    expect(binding.offset.x).toBe(16);
    expect(box.style.translate).toMatch(/^16px( 0px)?$/);
    expect(host.style.translate).toBe('');
    binding.destroy();
    expect(box.hasAttribute('tabindex')).toBe(false);
    expect(box.style.touchAction).toBe('');
    expect(box.style.translate).toBe('');
    expect(getGesture(host)).toBeUndefined();
    expect(getGesture(box)).toBeUndefined();
  });
}

it('a pointer drag on the box of a declared host moves the box, and its events reach the host', async () => {
  const { host, box } = declaredHost('attribute');
  const binding = bindGesture(host, 'host-state-drag');
  const ends: unknown[] = [];
  host.addEventListener('motion-dragend', event => ends.push((event as CustomEvent).detail));
  document.documentElement.dataset.motionPolicy = 'reduce';
  const { left, top } = box.getBoundingClientRect();
  const pointer = (type: string, x: number) =>
    box.dispatchEvent(new PointerEvent(type, { pointerId: 1, isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: top + 10, bubbles: true }));
  pointer('pointerdown', left + 10);
  pointer('pointermove', left + 40);
  expect(box.style.translate).toMatch(/^30px( 0px)?$/);
  pointer('pointerup', left + 40);
  expect(ends).toHaveLength(1);
  expect(binding.offset.x).toBeGreaterThanOrEqual(30);
});

it('a swipe of a declared host flies its box out and hides the host from assistive technology', async () => {
  const { host, box } = declaredHost('attribute');
  const binding = bindGesture(host, 'host-state-swipe');
  document.documentElement.dataset.motionPolicy = 'reduce';
  const swipes: unknown[] = [];
  host.addEventListener('motion-swipe', event => swipes.push((event as CustomEvent).detail));
  box.focus();
  key(box, 'Delete');
  expect(swipes).toEqual([{ direction: 'end' }]);
  await nextFrame();
  expect(host.getAttribute('aria-hidden')).toBe('true');
  expect(box.hasAttribute('aria-hidden')).toBe(false);
  expect(getComputedStyle(box).opacity).toBe('0');
  expect(binding.offset.x).toBeGreaterThan(200);
  binding.reset();
  expect(host.hasAttribute('aria-hidden')).toBe(false);
});

it('a reorder of declared hosts moves the hosts in their list, measured by their boxes, and keeps focus on the box', () => {
  const list = document.createElement('div');
  list.style.cssText = 'display:flex;flex-direction:column;width:200px';
  root.append(list);
  const hosts = Array.from({ length: 3 }, (_, index) => {
    const host = document.createElement('span');
    host.className = 'sheet-contents';
    host.setAttribute('data-motion-box', 'child');
    host.innerHTML = `<div style="height:40px">Item ${index + 1}</div>`;
    list.append(host);
    bindGesture(host, 'host-state-row');
    return host;
  });
  const order = () => Array.from(list.children).map(child => child.textContent);
  const second = hosts[1].firstElementChild as HTMLElement;
  second.focus();
  key(second, ' ');
  key(second, 'ArrowDown');
  expect(order()).toEqual(['Item 1', 'Item 3', 'Item 2']);
  expect(list.children[2]).toBe(hosts[1]);
  expect(document.activeElement).toBe(second);
  key(second, ' ');
  expect(document.querySelector('[data-udx-motion-live]')?.textContent).toBe('Dropped. Position 3 of 3.');
});

/** The presence of a fade (or of `spec`) on `el`, bound settled, as the adapters' list. */
function motionWhenBound(el: HTMLElement, spec = fade.spec): DeferredMotion {
  const [each] = motionsWhenDefined(el, [spec], { settled: true });
  deferreds.push(each);
  return each;
}

it('destroying an emphasis of an element keeps the mark of its presence motion', () => {
  const { host } = declaredHost('attribute');
  const presence = motion(host, fade, { settled: true });
  bindings.push(presence);
  const emphasis = motion(host, { verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 1.05 }, { scale: 1 }] });
  emphasis.destroy();
  expect(host.dataset.motionPresence).toBe('present');
});
