// The public entry `@udixio/motion/continuous`: the scroll-linked scrub and the endless loop, which the main entry does
// not hold. The main entry loads it with `loadContinuous`, the first time a scrub or a loop is bound; evaluating it hands
// the functions that bind them to the main entry.
import { provideContinuous } from './feature-loader.js';
import { createLoopBinding, createScrubBinding } from './continuous.js';

provideContinuous({ createScrubBinding, createLoopBinding });
export { startScrub, supportsViewTimeline, rangeOf } from './scroll.js';
export type { ScrollRangeToken } from './scroll.js';
