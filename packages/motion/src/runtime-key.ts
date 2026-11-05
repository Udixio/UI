/**
 * Key of the motion runtime shared through `globalThis`, one per page.
 *
 * Every copy of `@udixio/motion` on the page (for example one per island)
 * resolves the same symbol through `Symbol.for`, so they reuse a single
 * runtime instead of each installing its own.
 */
export const RUNTIME_KEY: symbol = Symbol.for('udixio.motion@1');
