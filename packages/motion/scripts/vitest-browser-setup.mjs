// The browser project runs the sources as a development build would: a browser has no `process`, so the build-time checks
// (guarded by `typeof process`) would read as production and these specs would stop covering them.
globalThis.process ??= { env: { NODE_ENV: 'development' } };
