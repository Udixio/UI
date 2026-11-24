import {
  animateStyle,
  composeHandles,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
  reserveMotion,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

/** The slide into a new month rides the default spatial spring: a grid of 42 cells must not jitter with a fast overshoot. */
const DEFAULT_MONTH_TIMING: SpringRef = 'spring.default.spatial';
/** The fade into the new month keeps the default effects spring, whatever the slide's timing. */
const MONTH_FADE_TIMING: SpringRef = 'spring.default.effects';

/** The options of `createMonthTransitionController`: the calendar grid, its motion and its distance. */
export interface MonthTransitionControllerOptions {
  container: HTMLElement;
  /** The motion of the slide into the new month; `spring.default.spatial` by default. */
  timing?: SpringRef | CurveTiming;
  /** How far, in px, the new month comes from. */
  distance?: number;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
}

/** A month-change transition for a calendar grid; `play(direction)` on each month change, `destroy()` on unmount. */
export interface MonthTransitionController {
  /**
   * Plays the enter transition for a newly displayed month. `direction` > 0
   * slides in from the right (next month), < 0 from the left (previous
   * month), `0` skips the animation.
   */
  play(direction: number): void;
  destroy(): void;
}

/**
 * Shared month-change transition used by every framework adapter. React and
 * Angular each re-render the calendar grid's own content when the month
 * changes; this controller only animates the already-updated container into
 * place from the direction of navigation, so it needs no dual-tree
 * crossfade or DOM snapshot to stay framework-agnostic.
 */
export function createMonthTransitionController({
  container,
  timing = DEFAULT_MONTH_TIMING,
  distance = 24,
  reducedMotion = () => false,
}: MonthTransitionControllerOptions): MonthTransitionController {
  let motion: MotionHandle | undefined;
  // The grid plays its slide at each change of month, as an emphasis on interaction: it holds its emphasis.
  const release = reserveMotion(container, 'emphasis', 'DatePicker');

  /** Ends a running change, if any, and leaves the grid at rest with no inline offset. */
  const settle = () => {
    if (!motion) return;
    motion.cancel();
    motion = undefined;
    container.style.translate = '';
    container.style.opacity = '';
  };

  return {
    play(direction: number) {
      if (direction === 0 || motionPolicy.reduced || reducedMotion()) {
        settle();
        return;
      }

      // An interrupted change continues from the position and opacity the grid
      // shows; a fresh one starts from the offset of its direction.
      const interrupted = motion !== undefined;
      const offset = direction > 0 ? distance : -distance;
      const slide = animateStyle(
        container,
        [{ translate: `${offset}px 0` }, { translate: '0 0' }],
        { timing, carry: interrupted },
      );
      const fade = animateStyle(container, [{ opacity: 0 }, { opacity: 1 }], {
        timing: MONTH_FADE_TIMING,
        carry: interrupted,
      });
      const handle = composeHandles([slide, fade]);
      motion = handle;

      void handle.finished.then((result) => {
        if (motion !== handle) return;
        motion = undefined;
        if (result !== 'finished') return;
        container.style.translate = '';
        container.style.opacity = '';
      });
    },
    destroy() {
      motion?.cancel();
      motion = undefined;
      release();
    },
  };
}
