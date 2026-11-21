import { afterEach, expect, it } from 'vitest';
import { isMotionDevelopment } from './development.js';

const initial = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = initial;
});

it('says the development checks are on where NODE_ENV is not production, and off in production', () => {
  process.env.NODE_ENV = 'development';
  expect(isMotionDevelopment()).toBe(true);
  process.env.NODE_ENV = 'production';
  expect(isMotionDevelopment()).toBe(false);
});
