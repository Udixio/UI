import { expect, it } from 'vitest';
import { createMotionPolicy } from './runtime-policy.js';

it('keeps SSR acquisitions isolated and lifecycle operations safe', () => {
  const first = createMotionPolicy();
  const second = createMotionPolicy();
  first.retain();
  first.retain();
  expect(first.reduced).toBe(false);
  expect(second.reduced).toBe(false);
  const unsubscribe = first.subscribe(() => { throw new Error('unexpected'); });
  unsubscribe();
  unsubscribe();
  first.release();
  first.release();
  first.release();
  expect(first.reduced).toBe(false);
});
