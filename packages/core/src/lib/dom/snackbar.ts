import {
  animateStyle,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
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
  /** The animated surface. Its resting height reflects `open` on connect. */
  panel: HTMLElement;
  open: boolean;
  /** The motion of the height; `spring.fast.spatial` by default. */
  timing?: SpringRef | CurveTiming;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
}

export interface SnackbarTransitionController {
  /** Animates the panel height between its open and closed resting states. */
  setOpen(open: boolean): void;
  destroy(): void;
}

/** The panel is a small, fast surface: it moves on the fast spatial spring. */
const DEFAULT_TIMING: SpringRef = 'spring.fast.spatial';

/**
 * Shared height mount transition used by every framework adapter, on
 * `@udixio/motion`, so React, Angular and Svelte never choreograph it
 * separately. `aria-hidden`/`inert` stay owned by the adapter, which applies
 * them declaratively with render; this controller only owns the height value.
 * It applies the initial `open` state immediately without animating (there is
 * no meaningful "from" state on connect); every subsequent `setOpen` call
 * animates from the height the panel shows, so an interrupted change does not
 * jump.
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

  panel.style.height = open ? 'auto' : '0px';

  return {
    setOpen(nextOpen) {
      if (destroyed || nextOpen === isOpen) return;
      isOpen = nextOpen;

      if (reducedMotion() || motionPolicy.reduced) {
        motion?.cancel();
        motion = undefined;
        panel.style.height = nextOpen ? 'auto' : '0px';
        return;
      }

      motion = animateStyle(
        panel,
        { height: nextOpen ? 'auto' : '0px' },
        { timing },
      );
    },
    destroy() {
      destroyed = true;
      motion?.cancel();
      motion = undefined;
      panel.style.height = '';
    },
  };
}
