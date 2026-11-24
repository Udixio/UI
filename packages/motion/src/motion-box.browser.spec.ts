/**
 * TRIAL (review 5, Q3): an element with no box (`display: contents`) delegates its motion to its first element child, or to
 * the child it marks `data-motion-box`. This is what lets a framework animate a component without a wrapper box: an Angular
 * host is already `display: contents`, and React's `<Motion as={Component}>` renders one around the component.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, getMotions, motion, motionBox, motionsWhenDefined, type DeferredMotion, type MotionBinding } from './bind.js';
import { animateStyle } from './animate.js';
import { connectMotion } from './connect.js';
import { defineMotion } from './define-motion.js';
import { fade, press, shake } from './presets.js';
const tick = () => Promise.resolve();

let root: HTMLElement;
let host: HTMLElement;
let bindings: MotionBinding[];
let deferreds: DeferredMotion[];

function boxless(html: string): HTMLElement {
  const el = document.createElement('span');
  el.style.display = 'contents';
  el.innerHTML = html;
  root.append(el);
  return el;
}

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  host = boxless('<button type="button">Save</button>');
  bindings = [];
  deferreds = [];
});

afterEach(() => {
  for (const each of deferreds) each.destroy();
  for (const each of bindings) each.destroy();
  root.remove();
  vi.restoreAllMocks();
});

it('motionBox() is the element itself when it has a box', () => {
  const div = document.createElement('div');
  root.append(div);
  expect(motionBox(div)).toBe(div);
});

it('motionBox() of an element with no box is its first element child, by the same rule again for a child with no box', () => {
  expect(motionBox(host)).toBe(host.querySelector('button'));
  const chain = boxless('<!-- a comment --><div style="display: contents"><a href="#x">x</a></div>');
  expect(motionBox(chain)).toBe(chain.querySelector('a'));
});

it('motionBox() takes the child marked data-motion-box over the first child', () => {
  const marked = boxless('<i aria-hidden="true"></i><div data-motion-box>root</div>');
  expect(motionBox(marked)).toBe(marked.querySelector('[data-motion-box]'));
});

it('the marker counts only on a direct child: a marked grandchild is not the box', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const nested = boxless('<div><span data-motion-box>deep</span></div><p>second</p>');
  expect(motionBox(nested)).toBe(nested.querySelector('div'));
});

it('the marker counts only when the element has no box: an element with a box is its own box, whatever child is marked', () => {
  const div = document.createElement('div');
  div.innerHTML = '<i></i><b data-motion-box></b>';
  root.append(div);
  expect(motionBox(div)).toBe(div);
});

it('the marker on the element itself changes nothing: the rule reads the children of an element with no box', () => {
  const self = boxless('<button type="button">Save</button>');
  self.setAttribute('data-motion-box', '');
  expect(motionBox(self)).toBe(self.querySelector('button'));
});

it('a child with no box in a chain reads its own direct children for the marker', () => {
  const chain = boxless('<div style="display: contents"><i></i><b data-motion-box>box</b></div>');
  expect(motionBox(chain)).toBe(chain.querySelector('b'));
});

it('development warns once per element with no box and several element children, none marked, naming the element', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const several = boxless('<i aria-hidden="true"></i><div>root</div>');
  several.id = 'toolbar';
  expect(motionBox(several)).toBe(several.querySelector('i'));
  motionBox(several);
  bindings.push(motion(several, press));
  expect(warn).toHaveBeenCalledTimes(1);
  const [message, element] = warn.mock.calls[0];
  expect(message).toContain('several children: mark the box with data-motion-box');
  expect(message).toContain('<span#toolbar>');
  expect(element).toBe(several);
  // Another element is reported on its own.
  motionBox(boxless('<i></i><b></b>'));
  expect(warn).toHaveBeenCalledTimes(2);
});

it('no warning for one element child, a marked child, or an element with a box', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  // Text and comments are not children that could be the box.
  motionBox(boxless('text <!-- note --><button type="button">Save</button> more text'));
  motionBox(boxless('<i></i><div data-motion-box>root</div>'));
  const div = document.createElement('div');
  div.innerHTML = '<i></i><b></b>';
  root.append(div);
  motionBox(div);
  motionBox(boxless(''));
  expect(warn).not.toHaveBeenCalled();
});

it('no warning when the development checks are off', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.stubGlobal('__MOTION_CHECKS__', false);
  try {
    motionBox(boxless('<i></i><b></b>'));
  } finally {
    vi.unstubAllGlobals();
  }
  expect(warn).not.toHaveBeenCalled();
});

it('motionBox() of an element with no box and no child is the element itself', () => {
  const empty = boxless('');
  expect(motionBox(empty)).toBe(empty);
});

it('motion() on an element with no box animates its first child: the binding is found from both', () => {
  const button = host.querySelector('button')!;
  const binding = motion(host, press);
  bindings.push(binding);
  binding.play();
  expect(button.getAnimations()).toHaveLength(1);
  expect(host.getAnimations()).toHaveLength(0);
  expect(getMotion(host, 'emphasis')).toBe(binding);
  expect(getMotion(button, 'emphasis')).toBe(binding);
  expect(getMotions(host)).toEqual([binding]);
});

it('an appear on an element with no box plays its entry on the child, and marks the child present', async () => {
  const card = boxless('<article>card</article>');
  const article = card.querySelector('article')!;
  const binding = motion(card, fade);
  bindings.push(binding);
  expect(article.getAnimations().length).toBeGreaterThan(0);
  expect(article.dataset.motionPresence).toBe('entering');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(article.dataset.motionPresence).toBe('present');
  expect(card.hasAttribute('data-motion-presence')).toBe(false);
});

it('a host with no box that the server marked present binds its box settled: hydration plays no entry', () => {
  const card = boxless('<article>card</article>');
  card.setAttribute('data-motion-presence', 'present');
  const article = card.querySelector('article')!;
  bindings.push(motion(card, fade));
  expect(article.getAnimations()).toHaveLength(0);
  expect(article.dataset.motionPresence).toBe('present');
});

it('a list on an element with no box follows its root: a new first child takes the motions, settled, and the old one is released', async () => {
  const first = host.querySelector('button')!;
  const motions = motionsWhenDefined(host, ['fade', 'press'], { settled: true });
  deferreds.push(...motions);
  const before = motions[1].binding;
  // The framework renders another root: a link in place of the button.
  const link = document.createElement('a');
  link.href = '#save';
  link.textContent = 'Save';
  first.replaceWith(link);
  await tick();
  expect(motions[1].binding).not.toBe(before);
  expect(getMotion(link, 'emphasis')).toBe(motions[1].binding);
  expect(getMotion(host, 'emphasis')).toBe(motions[1].binding);
  // Settled: the new root plays no entry.
  expect(link.getAnimations()).toHaveLength(0);
  expect(link.dataset.motionPresence).toBe('present');
  motions[1].play();
  expect(link.getAnimations()).toHaveLength(1);
  expect(getMotion(first, 'emphasis')).toBeUndefined();
});

it('a list on an element with no box and no child yet binds the child it renders later', async () => {
  const empty = boxless('');
  const motions = motionsWhenDefined(empty, ['press'], { settled: true });
  deferreds.push(...motions);
  const button = document.createElement('button');
  empty.append(button);
  await tick();
  expect(getMotion(button, 'emphasis')).toBe(motions[0].binding);
  motions[0].play();
  expect(button.getAnimations()).toHaveLength(1);
});

it('the scanner binds the child that a data-motion element with no box renders after it is scanned', async () => {
  defineMotion('box-late-press', press.spec);
  const el = boxless('');
  el.dataset.motion = 'box-late-press';
  const disconnect = connectMotion({ root });
  try {
    await tick();
    const button = document.createElement('button');
    el.append(button);
    await tick();
    expect(getMotion(button, 'emphasis')).toBeDefined();
  } finally {
    disconnect();
  }
});

it('a list on an element with no box keeps its bindings when a change inside the root is not a new root', async () => {
  const motions = motionsWhenDefined(host, ['press'], { settled: true });
  deferreds.push(...motions);
  const before = motions[0].binding;
  host.querySelector('button')!.textContent = 'Saved';
  host.querySelector('button')!.append(document.createElement('span'));
  await tick();
  expect(motions[0].binding).toBe(before);
});

it('the scanner binds a data-motion element with no box on its first child, and follows a new root', async () => {
  defineMotion('box-press', press.spec);
  const el = boxless('<button type="button">Go</button>');
  el.dataset.motion = 'box-press';
  const disconnect = connectMotion({ root });
  try {
    await tick();
    const button = el.querySelector('button')!;
    el.dataset.motionState = 'pressed';
    await tick();
    expect(button.getAnimations()).toHaveLength(1);
    const next = document.createElement('a');
    next.href = '#go';
    button.replaceWith(next);
    await tick();
    expect(getMotion(next, 'emphasis')).toBeDefined();
    el.dataset.motionState = 'again';
    await tick();
    expect(next.getAnimations()).toHaveLength(1);
  } finally {
    disconnect();
  }
});

it('a component animating another property of its root (animateStyle) and the motion of the root run together', () => {
  const button = host.querySelector('button')!;
  const binding = motion(host, press);
  bindings.push(binding);
  binding.play();
  // The Button's shape feedback: animateStyle on the border radius of its root.
  animateStyle(button, { borderRadius: '12px' }, { timing: 'spring.fast.spatial' });
  const animated = button.getAnimations().map(animation => Object.keys((animation.effect as KeyframeEffect).getKeyframes()[0]));
  expect(animated).toHaveLength(2);
  expect(animated.flat()).toEqual(expect.arrayContaining(['scale', 'borderRadius']));
});

it('a component animating the same property of its root: the later animation is the one seen while both run', () => {
  const button = host.querySelector('button')!;
  const binding = motion(host, shake);
  bindings.push(binding);
  binding.play();
  for (const animation of button.getAnimations()) animation.pause();
  for (const animation of button.getAnimations()) animation.currentTime = 50;
  const shaking = getComputedStyle(button).translate;
  animateStyle(button, { translate: '0px 40px' }, { timing: { duration: 1000, easing: 'linear' } });
  const [, component] = button.getAnimations();
  component.pause();
  component.currentTime = 500;
  // WAAPI composites in start order: the component's later translate replaces the shake's while both run.
  expect(getComputedStyle(button).translate).not.toBe(shaking);
  expect(button.getAnimations()).toHaveLength(2);
});
