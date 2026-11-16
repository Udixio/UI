import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// jsdom does not declare a global `CSS` object (unlike every real browser),
// and code that feature-detects `CSS.supports` / `CSS.registerProperty` (the
// state layer registers its ripple property) reads the bare `CSS` identifier:
// an undeclared global throws a ReferenceError on read. An empty stub makes
// that detection see "not supported", as an old browser would.
if (typeof (globalThis as { CSS?: unknown }).CSS === 'undefined') {
  (globalThis as { CSS?: unknown }).CSS = {};
}

// jsdom has no ResizeObserver, which the anchor positioner's fallback
// controller instantiates as soon as it mounts. Any component composing a
// Tooltip now drags that in -- a compact Fab does, so a suite that merely
// renders one would otherwise log a ReferenceError from an afterRender hook.
// Individual specs used to stub it one by one; doing it here covers every
// suite and keeps the stub identical across them.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??=
  NoopResizeObserver;
