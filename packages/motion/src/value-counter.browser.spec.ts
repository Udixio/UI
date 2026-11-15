import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defineValue } from './value.js';
import { value, type ValueBinding } from './value-binding.js';

defineValue('vc-visitors', { source: 'state', range: [0, 2000], format: 'integer' });
defineValue('vc-decimal', { source: 'state', range: [0, 2000], format: 'decimal' });
defineValue('vc-share', { source: 'state', range: [0, 1], format: 'percent' });
defineValue('vc-price', { source: 'state', range: [0, 2000], format: 'currency', currency: 'EUR' });
defineValue('vc-live', { source: 'state', range: [0, 1000], format: 'integer' });

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const twoFrames = async () => {
  await nextFrame();
  await nextFrame();
};
const frames = async (count: number) => {
  for (let i = 0; i < count; i++) await nextFrame();
};
/** Frames until `done` holds, at most `cap` of them; returns whether it holds. */
const until = async (done: () => boolean, cap = 240) => {
  for (let i = 0; i < cap && !done(); i++) await nextFrame();
  return done();
};

let page: HTMLElement;
let bindings: ValueBinding[];

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

/** Bind a value on an element, and remember the binding so that cleanup destroys it. */
function bindTo(el: HTMLElement, name: string): ValueBinding {
  const binding = value(el, name);
  bindings.push(binding);
  return binding;
}

/** A 200vh spacer: an element placed after one is out of view at load. */
function spacer(): void {
  const element = document.createElement('div');
  element.style.height = '200vh';
  page.append(element);
}

/** A `data` element with its value attribute and its text, in an optional language. */
function counter(attribute: string, text: string, lang?: string): HTMLElement {
  const wrapper = document.createElement('div');
  if (lang) wrapper.lang = lang;
  const el = document.createElement('data');
  el.setAttribute('value', attribute);
  el.textContent = text;
  wrapper.append(el);
  page.append(wrapper);
  return el;
}

/** Scroll the document so that the element is at the top of the viewport. */
function scrollToTop(el: Element): void {
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
}

/** The number of an en-formatted integer text. */
const numberOf = (text: string | null): number => Number((text ?? '').replace(/,/g, ''));

/** What a counter shows to sight: its aria-hidden span while it has two, else its text. */
const shownOf = (el: Element): string => el.querySelector('[aria-hidden="true"]')?.textContent ?? el.textContent ?? '';

const cssValue = (el: Element, name: string): string => getComputedStyle(el).getPropertyValue(`--udx-motion-value-${name}`).trim();

it('leaves a counter that is in view at load untouched: same text node, no count', async () => {
  const el = counter('1280', '1280', 'en');
  bindTo(el, 'vc-visitors');
  const node = el.firstChild;
  await twoFrames();
  expect(el.firstChild).toBe(node);
  expect(el.textContent).toBe('1280');
  expect(cssValue(el, 'vc-visitors')).toBe('1280');
});

it('starts at the range minimum when out of view, then counts up to its value when it scrolls into view', async () => {
  spacer();
  const el = counter('1280', '1,280', 'en');
  spacer();
  bindTo(el, 'vc-visitors');
  await twoFrames();
  expect(shownOf(el)).toBe('0');
  expect(cssValue(el, 'vc-visitors')).toBe('0');

  const samples = [numberOf(shownOf(el))];
  scrollToTop(el);
  for (let i = 0; i < 240 && shownOf(el) !== '1,280'; i++) {
    await nextFrame();
    samples.push(numberOf(shownOf(el)));
  }
  expect(shownOf(el)).toBe('1,280');
  await twoFrames();
  expect(el.textContent).toBe('1,280');
  // Once the count lands, the content is one text node again: the final number.
  expect(el.childNodes.length).toBe(1);
  expect(el.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  expect(samples.length).toBeGreaterThan(5);
  expect(samples.some(sample => sample > 0 && sample < 1280)).toBe(true);
  for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
  expect(Math.max(...samples)).toBeLessThanOrEqual(1280);
});

it('while it waits out of view, shows 0 to sight and reads the final number from a visually hidden span that takes no width', async () => {
  spacer();
  const el = counter('1280', '1,280', 'en');
  spacer();
  bindTo(el, 'vc-visitors');
  await twoFrames();
  const seen = el.querySelector<HTMLElement>('[aria-hidden="true"]');
  const read = el.querySelector<HTMLElement>('[data-udx-motion-sr]');
  expect(seen?.textContent).toBe('0');
  expect(read?.textContent).toBe('1,280');
  expect(getComputedStyle(read as HTMLElement).position).toBe('absolute');
  expect(el.textContent).toContain('1,280');
  expect(Math.abs(el.getBoundingClientRect().width - (seen as HTMLElement).getBoundingClientRect().width)).toBeLessThanOrEqual(1);
});

it('a change of its value moves the hidden final number while the shown number goes on counting, and lands as one text node', async () => {
  spacer();
  const el = counter('1280', '1,280', 'en');
  spacer();
  bindTo(el, 'vc-visitors');
  await twoFrames();
  scrollToTop(el);
  await frames(3);
  expect(el.childNodes.length).toBe(2);
  el.setAttribute('value', '500');
  await nextFrame();
  expect(el.querySelector('[data-udx-motion-sr]')?.textContent).toBe('500');
  expect(await until(() => shownOf(el) === '500')).toBe(true);
  await twoFrames();
  expect(el.textContent).toBe('500');
  expect(el.childNodes.length).toBe(1);
});

it('formats a decimal in the language of its element, with the digits its value attribute writes', async () => {
  const expected = new Intl.NumberFormat('fr', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(1234.5);
  const zero = new Intl.NumberFormat('fr', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(0);
  spacer();
  const el = counter('1234.5', expected, 'fr');
  spacer();
  bindTo(el, 'vc-decimal');
  await twoFrames();
  expect(shownOf(el)).toBe(zero);
  scrollToTop(el);
  expect(await until(() => shownOf(el) === expected)).toBe(true);
  await twoFrames();
  expect(el.textContent).toBe(expected);
});

it('formats a percent from a fraction with Intl, in the language of its element', async () => {
  const expected = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 }).format(0.42);
  const zero = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 0 }).format(0);
  spacer();
  const el = counter('0.42', expected, 'en');
  spacer();
  bindTo(el, 'vc-share');
  await twoFrames();
  expect(shownOf(el)).toBe(zero);
  scrollToTop(el);
  expect(await until(() => shownOf(el) === expected)).toBe(true);
  await twoFrames();
  expect(el.textContent).toBe(expected);
});

it('formats a currency with its ISO code with Intl, in the language of its element', async () => {
  const expected = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(1234.5);
  const zero = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(0);
  spacer();
  const el = counter('1234.5', expected, 'en');
  spacer();
  bindTo(el, 'vc-price');
  await twoFrames();
  expect(shownOf(el)).toBe(zero);
  scrollToTop(el);
  expect(await until(() => shownOf(el) === expected)).toBe(true);
  await twoFrames();
  expect(el.textContent).toBe(expected);
});

it('keeps the velocity of a count when its value changes, then settles on the new value without a jump', async () => {
  spacer();
  const el = counter('1000', '1,000', 'en');
  spacer();
  bindTo(el, 'vc-live');
  await twoFrames();
  scrollToTop(el);
  const before: number[] = [];
  for (let i = 0; i < 5; i++) {
    await nextFrame();
    before.push(numberOf(shownOf(el)));
  }
  el.setAttribute('value', '500');
  const after: number[] = [];
  for (let i = 0; i < 240 && shownOf(el) !== '500'; i++) {
    await nextFrame();
    after.push(numberOf(shownOf(el)));
  }
  expect(el.textContent).toBe('500');
  // A critically damped count turns at once unless its velocity beats omega * (x - goal): its first sample may fall.
  const path = [before[before.length - 1], ...after];
  for (let i = 1; i < path.length; i++) expect(Math.abs(path[i] - path[i - 1])).toBeLessThan(250);
});

it('under reduced motion, a counter shows its value at once when it enters the view', async () => {
  document.documentElement.dataset.motionPolicy = 'reduce';
  spacer();
  const el = counter('1280', '1,280', 'en');
  spacer();
  bindTo(el, 'vc-visitors');
  await twoFrames();
  scrollToTop(el);
  const texts: string[] = [];
  for (let i = 0; i < 2; i++) {
    await nextFrame();
    texts.push(shownOf(el));
  }
  // The frame after entering the view shows the final text: no count, no intermediate number.
  expect(texts.at(-1)).toBe('1,280');
  for (const text of texts) expect(['0', '1,280']).toContain(text);
  expect(cssValue(el, 'vc-visitors')).toBe('1280');
});

it('destroy shows the final formatted value of a count that has not ended, as one text node, and removes its property', async () => {
  spacer();
  const el = counter('1280', '1,280', 'en');
  spacer();
  const binding = bindTo(el, 'vc-visitors');
  await twoFrames();
  scrollToTop(el);
  await frames(3);
  expect(shownOf(el)).not.toBe('1,280');
  binding.destroy();
  expect(el.textContent).toBe('1,280');
  expect(el.childNodes.length).toBe(1);
  expect(cssValue(el, 'vc-visitors')).toBe('');
});
