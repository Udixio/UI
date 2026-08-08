import { animate, type AnimationPlaybackControls } from 'motion';

export interface MonthTransitionControllerOptions {
  container: HTMLElement;
  duration?: number;
  distance?: number;
  reducedMotion?: () => boolean;
}

export interface MonthTransitionController {
  /**
   * Plays the enter transition for a newly displayed month. `direction` > 0
   * slides in from the right (next month), < 0 from the left (previous
   * month), `0` skips the animation.
   */
  play(direction: number): void;
  destroy(): void;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
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
  duration = 0.22,
  distance = 24,
  reducedMotion = systemPrefersReducedMotion,
}: MonthTransitionControllerOptions): MonthTransitionController {
  let animation: AnimationPlaybackControls | undefined;

  return {
    play(direction: number) {
      animation?.stop();
      if (direction === 0 || reducedMotion()) return;
      animation = animate(
        container,
        { x: [direction > 0 ? distance : -distance, 0], opacity: [0, 1] },
        { duration, ease: 'easeOut' },
      );
    },
    destroy() {
      animation?.stop();
    },
  };
}
