/**
 * Shared jsdom polyfills for the React test suite.
 *
 * jsdom ships no `ResizeObserver`, which several shared DOM controllers
 * construct -- `anchor-positioner`, `custom-scroll`, `tabs` and
 * `text-field-autosize`. Any component reaching one of them needs it, and the
 * reach is easy to miss: `Snackbar` gets there through `IconButton` and
 * `Tooltip`. Declaring it once here keeps a new spec from failing on a
 * dependency it never mentions.
 *
 * An environment that provides a real implementation keeps it.
 */
const noop = (): void => undefined;

class NoopResizeObserver implements ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
}

Object.assign(globalThis, {
  ResizeObserver: globalThis.ResizeObserver ?? NoopResizeObserver,
});
