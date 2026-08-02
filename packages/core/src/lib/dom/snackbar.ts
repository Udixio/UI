import { animate, type AnimationPlaybackControlsWithThen } from 'motion';
import type { Transition } from 'motion';

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
  transition?: Transition;
  reducedMotion?: () => boolean;
}

export interface SnackbarTransitionController {
  /** Animates the panel height between its open and closed resting states. */
  setOpen(open: boolean): void;
  destroy(): void;
}

const DEFAULT_TRANSITION: Transition = { duration: 0.1 };

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Shared height mount transition used by every framework adapter, with
 * Motion JavaScript so React and Angular never choreograph it separately.
 * `aria-hidden`/`inert` stay owned by the adapter, which applies them
 * declaratively with render; this controller only owns the height value. It
 * applies the initial `open` state immediately without animating (there is
 * no meaningful "from" state on connect); every subsequent `setOpen` call
 * animates.
 */
export function createSnackbarTransitionController({
  panel,
  open,
  transition,
  reducedMotion = systemPrefersReducedMotion,
}: SnackbarTransitionControllerOptions): SnackbarTransitionController {
  const resolvedTransition = { ...DEFAULT_TRANSITION, ...transition };
  let animation: AnimationPlaybackControlsWithThen | undefined;
  let isOpen = open;
  let destroyed = false;

  panel.style.height = open ? 'auto' : '0px';

  return {
    setOpen(nextOpen) {
      if (destroyed || nextOpen === isOpen) return;
      const wasOpen = isOpen;
      isOpen = nextOpen;
      animation?.stop();

      if (reducedMotion()) {
        panel.style.height = nextOpen ? 'auto' : '0px';
        return;
      }

      animation = animate(
        panel,
        { height: [wasOpen ? 'auto' : '0px', nextOpen ? 'auto' : '0px'] },
        resolvedTransition,
      );
      animation.then(() => {
        if (!destroyed && isOpen === nextOpen) {
          panel.style.height = nextOpen ? 'auto' : '0px';
        }
      });
    },
    destroy() {
      destroyed = true;
      animation?.stop();
      panel.style.height = '';
    },
  };
}
