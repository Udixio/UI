import { expect, it } from 'vitest';
import { createMotionPolicy } from './runtime-policy.js';

it('reads a safe default without browser globals during SSR', () => {
  expect(createMotionPolicy().reduced).toBe(false);
});
