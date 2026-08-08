import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// jsdom does not declare a global `CSS` object (unlike every real browser),
// and Anime.js's WAAPI module references the bare `CSS` identifier to
// feature-detect `CSS.registerProperty` support -- an undeclared global
// throws a ReferenceError on read, not just `undefined`. An empty stub
// makes that feature-detection see "not supported" and take Anime.js's own
// existing fallback path, matching real unsupported browsers.
if (typeof (globalThis as { CSS?: unknown }).CSS === 'undefined') {
  (globalThis as { CSS?: unknown }).CSS = {};
}
