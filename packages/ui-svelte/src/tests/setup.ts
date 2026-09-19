/**
 * Shared jsdom polyfills and matchers for the Svelte test suite. Mirrors
 * `packages/ui-react/src/tests/setup.ts`: the shared DOM controllers construct
 * `ResizeObserver`, which jsdom does not ship.
 */
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

const noop = (): void => undefined;

class NoopResizeObserver implements ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
}

Object.assign(globalThis, {
  ResizeObserver: globalThis.ResizeObserver ?? NoopResizeObserver,
});
