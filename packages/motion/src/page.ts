// The public entry `@udixio/motion/page`: the page transitions, which the main entry does not hold. Its imports are the
// shared runtime and the reduced-motion check only, so the entry adds no code to the main one.
export { navigate } from './navigate.js';
export type { NavigationDirection } from './navigate.js';
