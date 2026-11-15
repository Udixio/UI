// The public entry `@udixio/motion/scroll`: the scroll to an element or a position over a spring, which the main entry does
// not hold. Its imports are the shared runtime and spring only, so the entry adds no code to the main one.
export { scrollDestination, scrollTo } from './scroll-to.js';
export type { ScrollHandle, ScrollPosition, ScrollToOptions } from './scroll-to.js';
