import { expect, it } from 'vitest';

it('imports without a browser document or global registration', async () => {
  expect(typeof document).toBe('undefined');
  const module = await import('./shared-registry.js');
  expect(typeof module.createSharedRegistry).toBe('function');
});
