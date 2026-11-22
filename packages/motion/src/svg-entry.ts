// The public entry `@udixio/motion/svg`: the morph of a path, which the main entry does not hold. Its anime.js import is
// external, as the provider's is: animejs is a dependency of this package, installed with it, not inlined in the bundle.
export { morph } from './morph.js';
export type { MorphOptions } from './morph.js';
