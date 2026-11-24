import {
  animateStyle,
  composeHandles,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
  reserveMotion,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

export interface SnackbarAutoDismissControllerOptions {
  duration: number;
  onDismiss: () => void;
}

export interface SnackbarAutoDismissController {
  destroy(): void;
}

/**
 * Shared auto-dismiss timing used by every framework adapter: schedules a
 * single dismissal `duration` ms after connecting, and cancels it on destroy
 * so an interrupted or unmounted snackbar never fires a stale dismissal.
 */
export function createSnackbarAutoDismissController({
  duration,
  onDismiss,
}: SnackbarAutoDismissControllerOptions): SnackbarAutoDismissController {
  const timeoutId = setTimeout(onDismiss, duration);

  return {
    destroy() {
      clearTimeout(timeoutId);
    },
  };
}

export interface SnackbarTransitionControllerOptions {
  /** The animated surface. Its resting state reflects `open` on connect. */
  panel: HTMLElement;
  open: boolean;
  /** The motion of the scale, from 0.8 to 1 on the bottom edge; `spring.fast.spatial` by default. The opacity keeps `spring.fast.effects`. */
  timing?: SpringRef | CurveTiming;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
}

export interface SnackbarTransitionController {
  /** Fades and scales the panel between its open and closed states; its height changes only where it cannot be seen. */
  setOpen(open: boolean): void;
  destroy(): void;
}

/** The panel scales from the bottom edge, as a snackbar expands upward: from this scale when closed. */
const CLOSED_SCALE = 0.8;
const CLOSED_TRANSFORM = `scale(${CLOSED_SCALE})`;
const OPEN_TRANSFORM = 'scale(1)';
/** The panel is a small, fast surface: it grows on the fast spatial spring. */
const DEFAULT_TIMING: SpringRef = 'spring.fast.spatial';
/** The opacity fades on the fast effects spring, without overshoot. */
const FADE_TIMING: SpringRef = 'spring.fast.effects';

/**
 * Shared open and close transition used by every framework adapter, on
 * `@udixio/motion`, so React, Angular and Svelte never choreograph it
 * separately. The panel fades on the fast effects spring and scales from 0.8
 * on the fast spatial spring, from the bottom edge. Its height is not
 * animated: a height that springs past its end pushes the content below it,
 * so it becomes `auto` as the panel opens and goes to zero only once the exit
 * has ended, where it is invisible. `aria-hidden`/`inert` stay owned by the
 * adapter, which applies them declaratively with render. An interrupted change
 * continues from the opacity and the scale it shows.
 */
export function createSnackbarTransitionController({
  panel,
  open,
  timing = DEFAULT_TIMING,
  reducedMotion = () => false,
}: SnackbarTransitionControllerOptions): SnackbarTransitionController {
  let motion: MotionHandle | undefined;
  let isOpen = open;
  let destroyed = false;
  // The snackbar shows and hides its panel: it holds its presence, and a presence motion bound on it is ignored.
  const release = reserveMotion(panel, 'presence', 'Snackbar');

  panel.style.transformOrigin = '50% 100%';
  panel.style.height = open ? 'auto' : '0px';
  panel.style.opacity = open ? '1' : '0';
  panel.style.transform = open ? OPEN_TRANSFORM : CLOSED_TRANSFORM;

  const stopMotion = () => {
    motion?.cancel();
    motion = undefined;
  };

  return {
    setOpen(nextOpen) {
      if (destroyed || nextOpen === isOpen) return;
      isOpen = nextOpen;

      if (reducedMotion() || motionPolicy.reduced) {
        stopMotion();
        panel.style.height = nextOpen ? 'auto' : '0px';
        panel.style.opacity = nextOpen ? '1' : '0';
        panel.style.transform = nextOpen ? OPEN_TRANSFORM : CLOSED_TRANSFORM;
        return;
      }

      // Opening takes the content height at once; closing keeps it until the exit has ended. The new fade and scale read
      // the opacity and the scale the panel shows before they replace the running ones, so the change does not jump.
      if (nextOpen) panel.style.height = 'auto';

      const change = composeHandles([
        animateStyle(panel, { opacity: nextOpen ? 1 : 0 }, { timing: FADE_TIMING }),
        animateStyle(
          panel,
          { transform: nextOpen ? OPEN_TRANSFORM : CLOSED_TRANSFORM },
          { timing },
        ),
      ]);
      const previous = motion;
      motion = change;
      previous?.cancel();
      void change.finished.then((result) => {
        if (motion !== change) return;
        motion = undefined;
        if (result === 'finished' && !nextOpen) panel.style.height = '0px';
      });
    },
    destroy() {
      destroyed = true;
      stopMotion();
      release();
      panel.style.height = '';
      panel.style.opacity = '';
      panel.style.transform = '';
      panel.style.transformOrigin = '';
    },
  };
}
