// The public entry `@udixio/motion/animate`: animating any CSS property over a motion token, springs for numbers, and the
// stagger steps of a cascade. Its imports are the shared runtime, springs, tokens and stagger only, so the entry adds no
// code to the main one.
export { animateStyle } from './animate.js';
export type { AnimateStyleOptions, StyleKeyframe } from './animate.js';
export { composeHandles } from './compose.js';
export { staggerCap, staggerDelay, staggerStep } from './stagger.js';
export { createSpring } from './spring-number.js';
export { cssTiming } from './css-timing.js';
export type { SpringNumber, SpringNumberOptions } from './spring-number.js';
export type { MotionElement, MotionHandle } from './contract.js';
export type { SpringRef } from './motion-spec.js';
export type { CurveTiming, Timing } from './tokens.js';
