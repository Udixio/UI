/**
 * TRIAL (review 5, Q3): an element with no box (`display: contents`) delegates its motion to its first element child, or to
 * the child it marks `data-motion-box`. This is what lets a framework animate a component without a wrapper box: an Angular
 * host is already `display: contents`, and React's `<Motion as={Component}>` renders one around the component.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getMotion, getMotions, hasNoBox, motion, motionBox, motionsWhenDefined, type DeferredMotion, type MotionBinding } from './bind.js';
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

/** An element with no box by a stylesheet, not by its own style: undeclared unless `declare` sets data-motion-box="child". */
function sheetBoxless(html: string, declare = false): HTMLElement {
  const el = document.createElement('span');
  el.className = 'sheet-contents';
  if (declare) el.setAttribute('data-motion-box', 'child');
  el.innerHTML = html;
  root.append(el);
  return el;
}

let sheet: HTMLStyleElement;

beforeEach(() => {
  sheet = document.createElement('style');
  sheet.textContent = '.sheet-contents { display: contents; }';
  document.head.append(sheet);
  root = document.createElement('div');
  document.body.append(root);
  host = boxless('<button type="button">Save</button>');
  bindings = [];
  deferreds = [];
});

afterEach(() => {
  sheet.remove();
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

it('an appear on an element with no box plays its entry on the child, and marks the element present (step C: the host carries the state)', async () => {
  const card = boxless('<article>card</article>');
  const article = card.querySelector('article')!;
  const binding = motion(card, fade);
  bindings.push(binding);
  expect(article.getAnimations().length).toBeGreaterThan(0);
  expect(card.dataset.motionPresence).toBe('entering');
  expect(await binding.setPresent(true)).toBe('finished');
  expect(card.dataset.motionPresence).toBe('present');
  expect(article.hasAttribute('data-motion-presence')).toBe(false);
});

it('a host with no box that the server marked present binds its box settled: hydration plays no entry', () => {
  const card = boxless('<article>card</article>');
  card.setAttribute('data-motion-presence', 'present');
  const article = card.querySelector('article')!;
  bindings.push(motion(card, fade));
  expect(article.getAnimations()).toHaveLength(0);
  expect(card.dataset.motionPresence).toBe('present');
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
  // Settled: the new root plays no entry, and the element keeps its state.
  expect(link.getAnimations()).toHaveLength(0);
  expect(host.dataset.motionPresence).toBe('present');
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

it('the three signals of an element with no box: its own style, the bind option, data-motion-box="child" on it', () => {
  // Its own style says display: contents (React's wrapper, an Angular host today).
  expect(hasNoBox(host)).toBe(true);
  expect(motionBox(host)).toBe(host.querySelector('button'));
  // The bind option: an adapter that knows its host has no box.
  const declared = sheetBoxless('<button type="button">Go</button>');
  expect(hasNoBox(declared, true)).toBe(true);
  bindings.push(motion(declared, press, { boxless: true }));
  expect(getMotion(declared.querySelector('button')!, 'emphasis')).toBe(bindings[0]);
  // The attribute, for HTML and third-party wrappers.
  const marked = sheetBoxless('<a href="#x">x</a>', true);
  expect(hasNoBox(marked)).toBe(true);
  expect(motionBox(marked)).toBe(marked.querySelector('a'));
});

it('the own-style signal is display: contents itself, not a mention of contents elsewhere in the style', () => {
  const other = document.createElement('div');
  other.setAttribute('style', '--note: contents; display: block');
  other.innerHTML = '<i></i>';
  root.append(other);
  expect(hasNoBox(other)).toBe(false);
  const set = document.createElement('div');
  set.style.display = 'contents';
  expect(hasNoBox(set)).toBe(true);
});

it('data-motion-box: "child" on an element says its box is a child; on a child, any other value says "this is the box"', () => {
  const chain = sheetBoxless('<i></i><div data-motion-box="child" class="sheet-contents"><b></b><em data-motion-box></em></div>', true);
  expect(motionBox(chain)).toBe(chain.querySelector('em'));
  // An empty value on the element itself does not declare it: the element is its own box.
  const div = document.createElement('div');
  div.setAttribute('data-motion-box', '');
  div.innerHTML = '<i></i>';
  root.append(div);
  expect(hasNoBox(div)).toBe(false);
  expect(motionBox(div)).toBe(div);
});

it('an element with no box by a stylesheet only, not declared, is its own box: development says to declare it, once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const undeclared = sheetBoxless('<button type="button">Go</button>');
  undeclared.id = 'wrap';
  expect(hasNoBox(undeclared)).toBe(false);
  expect(motionBox(undeclared)).toBe(undeclared);
  motionBox(undeclared);
  bindings.push(motion(undeclared, press));
  expect(getMotion(undeclared.querySelector('button')!, 'emphasis')).toBeUndefined();
  const reports = warn.mock.calls.filter(([message]) => String(message).includes('declare it'));
  expect(reports).toHaveLength(1);
  expect(reports[0][0]).toContain('<span#wrap.sheet-contents> has no box (display: contents): declare it so its motion goes to its box');
  expect(reports[0][1]).toBe(undeclared);
});

it('no "declare it" warning for a declared element, an element with a box, or with the development checks off', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  motionBox(sheetBoxless('<b></b>', true));
  motionBox(host);
  const div = document.createElement('div');
  root.append(div);
  motionBox(div);
  vi.stubGlobal('__MOTION_CHECKS__', false);
  try {
    motionBox(sheetBoxless('<b></b>'));
  } finally {
    vi.unstubAllGlobals();
  }
  expect(warn).not.toHaveBeenCalled();
});

it('production finds the box without reading the computed style: an element with a box, and the three signals', async () => {
  vi.stubGlobal('__MOTION_CHECKS__', false);
  const read = vi.spyOn(window, 'getComputedStyle');
  try {
    const div = document.createElement('div');
    root.append(div);
    bindings.push(motion(div, press));
    bindings.push(motion(host, press));
    bindings.push(motion(sheetBoxless('<b></b>'), press, { boxless: true }));
    bindings.push(motion(sheetBoxless('<b></b>', true), press));
    // Emphasis only: a presence reads its own style for other reasons (whether motion is off), as before the box rule.
    deferreds.push(...motionsWhenDefined(sheetBoxless('<b></b>', true), ['press'], { settled: true }));
    defineMotion('box-production-press', press.spec);
    const scanned = sheetBoxless('<b></b>', true);
    scanned.dataset.motion = 'box-production-press';
    const disconnect = connectMotion({ root });
    try {
      await tick();
      scanned.firstElementChild!.replaceWith(document.createElement('i'));
      await tick();
      expect(getMotion(scanned.querySelector('i')!, 'emphasis')).toBeDefined();
    } finally {
      disconnect();
    }
    expect(read).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});

it('a list declared with no box by the option follows a new root, and so does an element declared by the attribute', async () => {
  const optioned = sheetBoxless('<button type="button">Go</button>');
  const motions = motionsWhenDefined(optioned, ['press'], { settled: true, boxless: true });
  deferreds.push(...motions);
  const link = document.createElement('a');
  optioned.firstElementChild!.replaceWith(link);
  await tick();
  expect(getMotion(link, 'emphasis')).toBe(motions[0].binding);
  const attributed = sheetBoxless('<button type="button">Go</button>', true);
  const listed = motionsWhenDefined(attributed, ['press'], { settled: true });
  deferreds.push(...listed);
  const next = document.createElement('a');
  attributed.firstElementChild!.replaceWith(next);
  await tick();
  expect(getMotion(next, 'emphasis')).toBe(listed[0].binding);
});

it('a host declared by the attribute that the server marked present binds its box settled', () => {
  const card = sheetBoxless('<article>card</article>', true);
  card.setAttribute('data-motion-presence', 'present');
  const article = card.querySelector('article')!;
  bindings.push(motion(card, fade));
  expect(article.getAnimations()).toHaveLength(0);
  expect(card.dataset.motionPresence).toBe('present');
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
