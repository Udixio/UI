import {
  animateStyle,
  composeHandles,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

export interface SearchOutsideDismissControllerOptions {
  /** The Search root that owns the input and its projected results. */
  root: HTMLElement;
  /** Called when a pointer starts outside the Search root. */
  onDismiss: () => void;
}

export interface SearchOutsideDismissController {
  /** Removes the document listener and ignores future outside pointers. */
  destroy(): void;
}

/** Connects the shared outside-pointer dismissal used by Search adapters. */
export function createSearchOutsideDismissController({
  root,
  onDismiss,
}: SearchOutsideDismissControllerOptions): SearchOutsideDismissController {
  const ownerDocument = root.ownerDocument;
  let destroyed = false;

  const handlePointerDown = (event: Event): void => {
    if (destroyed) return;
    const target = event.target;
    if (target && root.contains(target as Node)) return;
    onDismiss();
  };

  ownerDocument.addEventListener('pointerdown', handlePointerDown, true);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
    },
  };
}

export interface SearchResultsTransitionControllerOptions {
  /** The inline results surface that expands below the search field. */
  element: HTMLElement;
  /** Whether the results surface should be visible when the controller connects. */
  open: boolean;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
  reducedMotion?: () => boolean;
  /**
   * The motion of the results' opening height; `spring.default.spatial` by default. Closing uses the default effects
   * spring, so the height settles on zero without overshooting it. The opacity has its own effects spring.
   */
  timing?: SpringRef | CurveTiming;
}

export interface SearchResultsTransitionController {
  /** Animates the results surface to the requested expanded state. */
  setOpen(open: boolean): void;
  /** Stops the current transition and restores the element's original inline styles. */
  destroy(): void;
}

/** The results surface moves on the default spatial spring of its role: a contained reveal, not a slide. */
const DEFAULT_TIMING: SpringRef = 'spring.default.spatial';
/** The opacity fades on the default effects spring, whatever the height's timing. */
const OPACITY_TIMING: SpringRef = 'spring.default.effects';
/** Closing settles the height on zero with the default effects spring: a spatial spring overshoots past zero and is clipped. */
const CLOSE_HEIGHT_TIMING: SpringRef = 'spring.default.effects';

/**
 * Connects the shared reveal used by Search in every framework, on
 * `@udixio/motion`.
 *
 * The inline results surface grows from the field with a short opacity/height
 * transition. There is deliberately no large slide, spring, or per-item
 * stagger: Search suggestions are part of the same contained surface, so a
 * restrained reveal keeps the interaction quiet and Material-like. The first
 * state is applied immediately; subsequent state changes animate and can be
 * interrupted safely.
 */
export function createSearchResultsTransitionController({
  element,
  open,
  reducedMotion = () => false,
  timing = DEFAULT_TIMING,
}: SearchResultsTransitionControllerOptions): SearchResultsTransitionController {
  const initialState = {
    hidden: element.hidden,
    height: element.style.height,
    opacity: element.style.opacity,
  };
  let motion: MotionHandle | undefined;
  let currentOpen = open;
  let destroyed = false;

  const applyInstantState = (nextOpen: boolean): void => {
    element.hidden = !nextOpen;
    element.style.height = nextOpen ? 'auto' : '0px';
    element.style.opacity = nextOpen ? '1' : '0';
  };

  applyInstantState(open);

  return {
    setOpen(nextOpen) {
      if (destroyed || nextOpen === currentOpen) return;
      currentOpen = nextOpen;

      // A hidden element has no size to measure, so it is shown before the
      // motion reads `auto`. The adapter's aria-hidden/inert state follows in
      // its own render cycle, and the surface is hidden again when it closes.
      element.hidden = false;

      // Without a layout box (the surface is in a subtree that is not rendered) there is nothing to see or to measure:
      // the new state is applied at once, so that a page of hidden instances starts no animation.
      if (reducedMotion() || motionPolicy.reduced || element.getClientRects().length === 0) {
        motion?.cancel();
        motion = undefined;
        applyInstantState(nextOpen);
        return;
      }

      // A change that is still running is carried from the height and the
      // opacity the surface shows; a fresh one starts from the state it leaves.
      const interrupted = motion !== undefined;
      const handle = composeHandles([
        animateStyle(
          element,
          [
            { height: nextOpen ? '0px' : 'auto' },
            { height: nextOpen ? 'auto' : '0px' },
          ],
          { timing: nextOpen ? timing : CLOSE_HEIGHT_TIMING, carry: interrupted },
        ),
        animateStyle(
          element,
          [{ opacity: nextOpen ? 0 : 1 }, { opacity: nextOpen ? 1 : 0 }],
          { timing: OPACITY_TIMING, carry: interrupted },
        ),
      ]);
      motion = handle;
      void handle.finished.then((result) => {
        if (motion === handle) motion = undefined;
        // A reversal that cancelled this change, or a destroyed controller,
        // must not hide the surface.
        if (result !== 'finished' || destroyed || currentOpen !== nextOpen) return;
        element.hidden = !nextOpen;
      });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      motion?.cancel();
      motion = undefined;
      element.hidden = initialState.hidden;
      element.style.height = initialState.height;
      element.style.opacity = initialState.opacity;
    },
  };
}
