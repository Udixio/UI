// The public entry `@udixio/motion/text`: the text splitting and the split of a definition, which the main entry does not
// hold. The main entry loads it with `loadText`, the first time a split definition is bound; evaluating it hands the
// functions a binding calls to the main entry.
import { provideText } from './feature-loader.js';
import { applySplitFrame, playSplit, revertSplit } from './split-play.js';

provideText({ playSplit, applySplitFrame, revertSplit });
export { applySplitFrame, playSplit, revertSplit, splitPieces, textRanks } from './split-play.js';
export { getSplit, splitText } from './text.js';
export type { SplitBy, TextSplit } from './text.js';
