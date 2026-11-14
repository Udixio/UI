import { expect, it } from 'vitest';
import { cssProvider } from './css.js';
it('imports without a DOM and rejects an unusable target synchronously', () => {
  expect(() => cssProvider.animate({ target: undefined as never, keyframes: [{ opacity: 0 }, { opacity: 1 }], timing: { duration: 1, easing: 'linear' } })).toThrow();
  expect(cssProvider.activeCount()).toBe(0);
});
