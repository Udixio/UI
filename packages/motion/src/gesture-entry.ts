// The public entry `@udixio/motion/gesture`: the gestures, which the main entry does not hold. The main entry loads it with
// `loadGestures`, the first time a page needs a gesture.
export { defineGesture, validateGestureSpec } from './gesture.js';
export type { GestureSpec, GestureRef, GestureKind } from './gesture.js';
export { gesture, getGesture } from './gesture-binding.js';
export type { GestureBinding } from './gesture-binding.js';
export { onGestureDefined, resolveGesture } from './registries.js';
