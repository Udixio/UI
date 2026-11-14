/** Shared internal policy for Udixio packages. This entry is not a stable application API. */
import { createMotionPolicy } from './runtime-policy.js';
export type { MotionPolicy } from './runtime-policy.js';
export const motionPolicy = createMotionPolicy();
