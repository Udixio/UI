// The public entry `@udixio/motion/animate`: animating any CSS property over a motion token, and springs for numbers. Its
// imports are the shared runtime, springs and tokens only, so the entry adds no code to the main one.
export { animateStyle } from './animate.js';
export type { AnimateStyleOptions, StyleKeyframe, StyleTiming } from './animate.js';
export { createSpring } from './spring-number.js';
export { cssTiming } from './css-timing.js';
export type { SpringNumber, SpringNumberOptions } from './spring-number.js';
export type { MotionElement, MotionHandle } from './contract.js';
export type { SpringRef } from './motion-spec.js';
export type { CurveTiming } from './tokens.js';
