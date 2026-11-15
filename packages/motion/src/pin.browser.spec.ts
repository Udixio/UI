import { afterEach, beforeEach, expect, it } from 'vitest';
import { pinOutOfFlow } from './pin.js';

let host: HTMLElement;

/** Each edge and size of the box agrees with the expected one, within half a pixel. */
function expectSameBox(actual: DOMRect, expected: DOMRect): void {
  for (const key of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `${key} measured ${actual[key]}, expected ${expected[key]}`).toBeLessThanOrEqual(0.5);
  }
}

/** The three boxes of a relative column: 40px high, with 8px below each one. */
function boxes(): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>('.box')];
}

beforeEach(() => {
  host = document.createElement('div');
  host.innerHTML = `
    <style>.col { position: relative; } .box { height: 40px; margin-bottom: 8px; }</style>
    <div class="col"><div class="box"></div><div class="box"></div><div class="box"></div></div>
  `;
  document.body.append(host);
});

afterEach(() => {
  host.remove();
});

it('takes an element out of the flow where it stands: it does not move, and the next one takes its place', () => {
  const [first, second] = boxes();
  const before = first.getBoundingClientRect();
  const restore = pinOutOfFlow(first);
  expectSameBox(first.getBoundingClientRect(), before);
  expect(first.style.getPropertyValue('position')).toBe('absolute');
  expect(Math.abs(second.getBoundingClientRect().top - before.top), 'second box top').toBeLessThanOrEqual(0.5);
  restore();
});

it('leaves no inline style behind when the element had none, and returns it to the flow', () => {
  const [first] = boxes();
  const before = first.getBoundingClientRect();
  const restore = pinOutOfFlow(first);
  restore();
  expect(first.getAttribute('style') ?? '').toBe('');
  expectSameBox(first.getBoundingClientRect(), before);
});

it('restores the inline width and margin the element already had, exactly', () => {
  const [first] = boxes();
  first.style.width = '120px';
  first.style.margin = '4px';
  const original = first.getAttribute('style');
  const before = first.getBoundingClientRect();
  const restore = pinOutOfFlow(first);
  expect(first.style.getPropertyValue('margin')).toBe('0px');
  restore();
  expect(first.getAttribute('style')).toBe(original);
  expect(first.style.getPropertyValue('width')).toBe('120px');
  expect(first.style.getPropertyValue('margin')).toBe('4px');
  expectSameBox(first.getBoundingClientRect(), before);
});

it('restores the priority of an inline value it replaces', () => {
  const [first] = boxes();
  first.style.setProperty('width', '120px', 'important');
  const restore = pinOutOfFlow(first);
  restore();
  expect(first.style.getPropertyValue('width')).toBe('120px');
  expect(first.style.getPropertyPriority('width')).toBe('important');
});

it('calling the restore twice is harmless: a later inline value is not overwritten', () => {
  const [first] = boxes();
  first.style.width = '120px';
  const restore = pinOutOfFlow(first);
  restore();
  first.style.width = '80px';
  restore();
  expect(first.style.getPropertyValue('width')).toBe('80px');
  expect(first.style.getPropertyValue('position')).toBe('');
});
