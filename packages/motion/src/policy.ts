/**
 * The public entry `@udixio/motion/policy`: the reduced-motion policy of the page. Motion is reduced when
 * `<html data-motion-policy="reduce">` is set, or else when the system asks for it (`prefers-reduced-motion: reduce`);
 * `auto`, an absent attribute and an unknown value follow the system. On the server it is never reduced.
 */
import { createMotionPolicy } from './runtime-policy.js';
export type { MotionPolicy } from './runtime-policy.js';
export { createMotionPolicy };

/**
 * The page's policy, shared by every consumer of this copy of the package. `motionPolicy.reduced` reads the current state
 * at any time. To follow its changes, prefer `watchMotionPolicy`; `retain`, `subscribe` and `release` are the store's
 * lease, for code that manages it by hand.
 */
export const motionPolicy = createMotionPolicy();

/**
 * Call `onChange(reduced)` with the current policy at once, then each time it changes: the document attribute and the
 * system preference are both followed. Returns a function that stops watching; once the last watcher (and lease) is gone,
 * the policy removes its listeners. If the first call throws, nothing is left watching and the error is thrown.
 * @param onChange - Called with `true` when motion is reduced, at once and on each change.
 * @returns A function that stops watching.
 */
export function watchMotionPolicy(onChange: (reduced: boolean) => void): () => void {
  motionPolicy.retain();
  let stop: (() => void) | undefined;
  try {
    stop = motionPolicy.subscribe(() => onChange(motionPolicy.reduced));
    onChange(motionPolicy.reduced);
  } catch (error) {
    stop?.();
    motionPolicy.release();
    throw error;
  }
  return () => {
    if (!stop) return;
    stop();
    stop = undefined;
    motionPolicy.release();
  };
}
