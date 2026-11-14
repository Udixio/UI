import { expect, it } from 'vitest';
import { animejsProvider } from './animejs.js';

it.each(['cubic-bezier(-1e-999, 0, 1, 1)', 'cubic-bezier(1.0000000000000001, 0, 1, 1)', 'cubic-bezier(0, 1e308, 1, 1)'])('rejects %s without DOM access during SSR', (easing) => {
  const target = new Proxy({} as HTMLElement, { get() { throw new Error('DOM access'); } });
  const count = animejsProvider.activeCount();
  expect(() => animejsProvider.animate({ target, keyframes: [{ opacity: 1 }], timing: { duration: 1000, easing } })).toThrow('Unsupported animejs easing');
  expect(animejsProvider.activeCount()).toBe(count);
});
