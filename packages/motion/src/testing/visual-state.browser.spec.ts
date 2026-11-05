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
