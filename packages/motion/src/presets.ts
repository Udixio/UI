import { defineMotion, type LegacySpec, type MotionRef, type VerblessSpec } from './define-motion.js';

/** Entering content: fades in. */
export const fade: MotionRef<'fade', LegacySpec> = defineMotion('fade', {
  verb: 'appear',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

/** Entering content: fades in while rising 24px. */
export const slide: MotionRef<'slide', LegacySpec> = defineMotion('slide', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
});

/** A list entering together: each item fades in while rising 24px, one step after the previous one. */
export const cascade: MotionRef<'cascade', LegacySpec> = defineMotion('cascade', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  stagger: 'normal',
});

/** Entering content: fades in while growing from 80%. */
export const scale: MotionRef<'scale', LegacySpec> = defineMotion('scale', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1 },
  ],
});

/** Entering content: fades in while growing from 80%. */
export const grow: MotionRef<'grow', VerblessSpec> = defineMotion('grow', {
  keyframes: [
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1 },
  ],
});

/** Entering a path or a basic shape: its stroke is drawn from nothing to the whole shape. */
export const draw: MotionRef<'draw', LegacySpec> = defineMotion('draw', {
  verb: 'appear',
  keyframes: [{ draw: 0 }, { draw: 1 }],
});

/** Pressed feedback: dips to 96% and returns. */
export const press: MotionRef<'press', LegacySpec> = defineMotion('press', {
  verb: 'emphasize',
  keyframes: [{ scale: 1 }, { scale: 0.96 }, { scale: 1 }],
});

/** Pressed feedback: dips to 96% while the press holds. */
export const dip: MotionRef<'dip', VerblessSpec> = defineMotion('dip', { keyframes: { scale: 0.96 } });

/** Layout: the element moves to its new place and size when the layout changes. */
export const reflow: MotionRef<'reflow', LegacySpec> = defineMotion('reflow', { verb: 'layout' });

/** Entering the viewport: fades in while rising 24px. */
export const rise: MotionRef<'rise', LegacySpec> = defineMotion('rise', {
  verb: 'reveal',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  stagger: 'normal',
});

/** Scrolling: drifts from 48px below its place to 48px above it, across the viewport. */
export const parallax: MotionRef<'parallax', LegacySpec> = defineMotion('parallax', {
  verb: 'scrub',
  keyframes: [{ y: 48 }, { y: -48 }],
  range: 'cross',
});

/** Looping: turns a full turn in one second; the user can pause it (WCAG 2.2.2). */
export const rotate: MotionRef<'rotate', LegacySpec> = defineMotion('rotate', {
  verb: 'loop',
  keyframes: [{ rotate: 0 }, { rotate: 360 }],
  timing: { duration: 'duration.extraLong4', easing: 'easing.linear' },
  pause: 'control',
});

/** Looping: swells to 104% and back in one second; the user can pause it (WCAG 2.2.2). */
export const breathe: MotionRef<'breathe', LegacySpec> = defineMotion('breathe', {
  verb: 'loop',
  keyframes: [{ scale: 1 }, { scale: 1.04 }, { scale: 1 }],
  timing: { duration: 'duration.extraLong4', easing: 'easing.standard' },
  pause: 'control',
});

/** Looping: one dim flash per second, under the three flashes a second of WCAG 2.3.1; the user can pause it. */
export const blink: MotionRef<'blink', LegacySpec> = defineMotion('blink', {
  verb: 'loop',
  keyframes: [{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }],
  timing: { duration: 'duration.extraLong4', easing: 'easing.standard' },
  pause: 'control',
});

/** Emphasis: shakes sideways by 6px, then settles, to signal a refused action. */
export const shake: MotionRef<'shake', LegacySpec> = defineMotion('shake', {
  verb: 'emphasize',
  keyframes: [{ x: 0 }, { x: -6 }, { x: 6 }, { x: -4 }, { x: 4 }, { x: 0 }],
  // A linear 400 ms curve: each of the five segments takes 80 ms, so the 6 px peaks are reached.
  timing: { duration: 'duration.medium4', easing: 'easing.linear' },
});
