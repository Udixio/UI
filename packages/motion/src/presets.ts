import { defineMotion, type MotionRef } from './define-motion.js';

/** Entering content: fades in. */
export const fade: MotionRef<'fade'> = defineMotion('fade', {
  verb: 'appear',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

/** Entering content: fades in while rising 24px. */
export const slide: MotionRef<'slide'> = defineMotion('slide', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
});

/** Entering content: fades in while growing from 80%. */
export const scale: MotionRef<'scale'> = defineMotion('scale', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1 },
  ],
});

/** Pressed feedback: dips to 96% and returns. */
export const press: MotionRef<'press'> = defineMotion('press', {
  verb: 'emphasize',
  keyframes: [{ scale: 1 }, { scale: 0.96 }, { scale: 1 }],
});
