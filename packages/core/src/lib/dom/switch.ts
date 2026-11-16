import {
  animateStyle,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

/** The thumb moves on the fast spatial spring of its role: quick, and it does not overshoot the track. */
const DEFAULT_TIMING: SpringRef = 'spring.fast.spatial';

export interface SwitchThumbControllerOptions {
  /** The handle container (`.handle-container`) whose `translate` slides between resting offsets. */
  root: HTMLElement;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
  /** The motion of the slide; `spring.fast.spatial` by default. */
  timing?: SpringRef | CurveTiming;
}

export interface SwitchThumbController {
  /** Slides `root`'s `translate` from `from` to `to` (both px, see `getSwitchHandleOffset`). */
  update(from: number, to: number): void;
  destroy(): void;
}

/**
 * Slides a `Switch` thumb between its two resting `translate` offsets (see
 * `getSwitchHandleOffset`) on `@udixio/motion`. Both offsets are known in
 * advance, so nothing is measured and only `root` is touched. A toggle that
 * arrives during a slide continues from the position the thumb shows; a fresh
 * one starts from the offset it is given.
 */
export function createSwitchThumbController({
  root,
  reducedMotion,
  timing = DEFAULT_TIMING,
}: SwitchThumbControllerOptions): SwitchThumbController {
  let motion: MotionHandle | undefined;
  let target: number | undefined;
  let destroyed = false;
  let unsubscribe: (() => void) | undefined;

  const stop = () => {
    motion?.cancel();
    motion = undefined;
  };

  motionPolicy.retain();
  try {
    const applyPolicy = () => {
      const reduced = motionPolicy.reduced;
      root.toggleAttribute('data-udx-switch-motion-reduce', reduced);
      if (reduced && target !== undefined) {
        stop();
        root.style.translate = `${target}px`;
      }
    };
    unsubscribe = motionPolicy.subscribe(applyPolicy);
    // Read once after subscribing, including any changes during installation.
    applyPolicy();
  } catch (error) {
    root.removeAttribute('data-udx-switch-motion-reduce');
    try { unsubscribe?.(); } catch { /* Preserve the installation error. */ }
    try { motionPolicy.release(); } catch { /* Preserve the installation error. */ }
    throw error;
  }

  return {
    update(from, to) {
      if (destroyed) return;
      target = to;
      if (motionPolicy.reduced || reducedMotion?.()) {
        stop();
        root.style.translate = `${to}px`;
        return;
      }
      // A running slide is carried from the translate it shows; otherwise the slide starts at `from`.
      const interrupted = motion !== undefined;
      const handle = animateStyle(
        root,
        [{ translate: `${from}px` }, { translate: `${to}px` }],
        { timing, carry: interrupted },
      );
      motion = handle;
      void handle.finished.then(() => {
        if (motion === handle) motion = undefined;
      });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeAttribute('data-udx-switch-motion-reduce');
      try { unsubscribe?.(); } finally {
        try { stop(); } finally { motionPolicy.release(); }
      }
    },
  };
}
