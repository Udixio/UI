// The development checks flag of the sources (src/build-flags.d.ts). The default build replaces it with the test that reads
// `process` and `NODE_ENV`; vitest does not replace it in the sources, so the same test is defined here. It is read at each use,
// so that a spec that sets `process.env.NODE_ENV` sees its own value.
Object.defineProperty(globalThis, '__MOTION_CHECKS__', {
  configurable: true,
  get: () => typeof process === 'object' && process.env.NODE_ENV !== 'production',
});
