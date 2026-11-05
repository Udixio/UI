import { expect, it } from 'vitest';
import { readVisualState } from './visual-state.js';

it('reads individual transforms and opacity', () => {
  const el = document.createElement('div');
  el.style.cssText = 'translate: 10px 20px; scale: 2; rotate: 90deg; opacity: 0.5';
  document.body.append(el);
  const state = readVisualState(el);
  expect(state.x).toBeCloseTo(10); expect(state.y).toBeCloseTo(20);
  expect(state.scaleX).toBeCloseTo(2); expect(state.scaleY).toBeCloseTo(2);
  expect(state.rotate).toBeCloseTo(90); expect(state.opacity).toBeCloseTo(0.5);
  el.remove();
});

it('reads an identity transform', () => {
  const el = document.createElement('div'); document.body.append(el);
  expect(readVisualState(el)).toEqual({ opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotate: 0 });
  el.remove();
});

it('composes individual properties with transform', () => {
  const el = document.createElement('div');
  el.style.cssText = 'translate: 10px 20px; transform: translate(5px, 6px) scale(2)';
  document.body.append(el);
  const state = readVisualState(el);
  expect(state.x).toBeCloseTo(15); expect(state.y).toBeCloseTo(26);
  expect(state.scaleX).toBeCloseTo(2); expect(state.scaleY).toBeCloseTo(2);
  el.remove();
});

it('resolves percentage translations against the border box', () => {
  const el = document.createElement('div');
  el.style.cssText = 'box-sizing: content-box; width: 180px; height: 80px; padding: 10px; translate: 50% 25%';
  document.body.append(el);
  const state = readVisualState(el);
  expect(state.x).toBeCloseTo(100); expect(state.y).toBeCloseTo(25);
  el.remove();
});

it.each(['z 90deg', '0 0 1 90deg'])('reads an axis rotation: %s', (rotation) => {
  const el = document.createElement('div');
  el.style.rotate = rotation;
  document.body.append(el);
  expect(readVisualState(el).rotate).toBeCloseTo(90);
  el.remove();
});

it('uses the HTML content box for fill-box', () => {
  const el = document.createElement('div');
  el.style.cssText = 'width: 100px; height: 80px; padding: 10px; transform-box: fill-box; translate: 50% 50%';
  document.body.append(el);
  const state = readVisualState(el);
  expect(state.x).toBeCloseTo(50); expect(state.y).toBeCloseTo(40);
  el.remove();
});

it('uses the CSS layout box for a root SVG', () => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '0 0 100 100');
  el.style.cssText = 'width: 200px; height: 120px; translate: 50% 50%';
  document.body.append(el);
  const state = readVisualState(el);
  expect(state.x).toBeCloseTo(100); expect(state.y).toBeCloseTo(60);
  el.remove();
});

it('rejects SVG stroke-box translations whose reference box cannot be measured', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '100'); rect.setAttribute('height', '50'); rect.setAttribute('stroke', 'black'); rect.setAttribute('stroke-width', '10');
  rect.style.cssText = 'transform-box: stroke-box; translate: 50% 50%';
  svg.append(rect); document.body.append(svg);
  expect(() => readVisualState(rect)).toThrow(/stroke-box/);
  svg.remove();
});

it.each([['x 60deg', 0, 1, 0.5], ['y 60deg', 0, 0.5, 1], ['1 1 1 120deg', 90, 1, 0]] as const)(
  'decomposes the projected matrix for %s', (rotation, angle, scaleX, scaleY) => {
    const el = document.createElement('div'); el.style.rotate = rotation; document.body.append(el);
    const state = readVisualState(el);
    expect(state.rotate).toBeCloseTo(angle); expect(state.scaleX).toBeCloseTo(scaleX); expect(state.scaleY).toBeCloseTo(scaleY);
    el.remove();
  },
);
