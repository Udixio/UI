import { motionPolicy } from '@udixio/motion/policy';
import type { MotionHandle } from '@udixio/motion/animate';

/** Owns a single indeterminate loop and its shared policy subscription. */
export function createIndeterminatePolicyController(options: {
  reducedMotion?: () => boolean;
  staticFrame: () => void;
  start: (animations: MotionHandle[]) => void;
  restore: () => void;
}): () => void {
  let animations: MotionHandle[] = [];
  let unsubscribe: (() => void) | undefined;
  let destroyed = false;
  let mode: boolean | undefined;
  const stop = () => {
    const current = animations;
    animations = [];
    const errors: unknown[] = [];
    for (const animation of current) {
      try {
        // cancel() removes the motion's effect at once, so no frame is committed after it.
        animation.cancel();
      } catch (error) {
        errors.push(error);
        // A handle that could not be cancelled stays known, to be retried on the next transition or cleanup.
        animations.push(animation);
      }
    }
    if (errors.length)
      throw new AggregateError(errors, 'Failed to stop progress animations');
  };
  const apply = () => {
    if (destroyed) return;
    const additionalReduction = !!options.reducedMotion?.();
    const reduced = motionPolicy.reduced || additionalReduction;
    if (mode === reduced) return;
    let stopError: unknown;
    let stopFailed = false;
    try { stop(); } catch (error) { stopFailed = true; stopError = error; }
    options.staticFrame();
    mode = reduced ? true : undefined;
    if (stopFailed) throw stopError;
    mode = reduced;
    if (!reduced) {
      try {
        options.start(animations);
      } catch (error) {
        let rollbackError: unknown;
        let rollbackFailed = false;
        try { stop(); } catch (failure) { rollbackFailed = true; rollbackError = failure; }
        try { options.staticFrame(); } finally { mode = undefined; }
        if (rollbackFailed) throw new AggregateError([error, rollbackError], 'Failed to start and stop progress animations');
        throw error;
      }
    }
  };
  motionPolicy.retain();
  try {
    unsubscribe = motionPolicy.subscribe(apply);
    apply();
  } catch (error) {
    destroyed = true;
    try {
      try {
        stop();
      } finally {
        try {
          options.restore();
        } finally {
          try {
            unsubscribe?.();
          } finally {
            motionPolicy.release();
          }
        }
      }
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Failed to start progress animations and clean up');
    }
    throw error;
  }
  return () => {
    if (destroyed) return;
    destroyed = true;
    try {
      stop();
    } finally {
      try {
        options.restore();
      } finally {
        try {
          unsubscribe?.();
        } finally {
          motionPolicy.release();
        }
      }
    }
  };
}
