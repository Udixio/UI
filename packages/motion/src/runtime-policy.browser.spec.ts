import { afterEach, expect, it, vi } from 'vitest';
import { createMotionPolicy } from './runtime-policy.js';

afterEach(() => {
  document.documentElement.removeAttribute('data-motion-policy');
  vi.restoreAllMocks();
});

it('resolves the site policy and tracks changes to the system preference', () => {
  let systemReduced = false;
  vi.spyOn(window, 'matchMedia').mockImplementation(() => ({ get matches() { return systemReduced; } } as MediaQueryList));
  const policy = createMotionPolicy();
  expect(policy.reduced).toBe(false);
  systemReduced = true;
  expect(policy.reduced).toBe(true);
  document.documentElement.setAttribute('data-motion-policy', 'reduce');
  systemReduced = false;
  expect(policy.reduced).toBe(true);
  document.documentElement.setAttribute('data-motion-policy', 'auto');
  expect(policy.reduced).toBe(false);
});
