import {
  animate,
  type AnimationPlaybackControlsWithThen,
  type Transition,
} from 'motion';

export interface SideSheetControllerOptions {
  /** The side sheet surface. Excluded from the background-inert set and receives initial focus. */
  panel: HTMLElement;
  /** The modal backdrop, if rendered. Excluded from the background-inert set. */
  overlay?: HTMLElement | null;
  /** The element panel/overlay are portaled into. Defaults to `document.body`. */
  container?: Element | null;
  /** Called once when Escape is pressed while the sheet is connected. */
  onDismiss: () => void;
}

export interface SideSheetController {
  destroy(): void;
}

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  '[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Connects the shared modal behavior for `variant="modal"`: it makes every other
 * child of `container` (`document.body` by default) inert, removing it from the
 * tab order and accessibility tree. Adapters that wrap panel/overlay in an extra
 * node before portaling (for example Angular's `display: contents` host) are
 * still handled correctly: exemption is based on containment, not identity, so
 * the wrapper's ancestor chain is excluded rather than only the panel itself. It
 * also locks body scroll, moves focus into the panel, closes on Escape, and
 * restores focus and scroll on destroy. Standard (non-modal) side sheets never
 * connect this controller.
 */
export function createSideSheetController({
  panel,
  overlay,
  container,
  onDismiss,
}: SideSheetControllerOptions): SideSheetController {
  const ownerDocument = panel.ownerDocument;
  const root = container ?? ownerDocument.body;
  const isExempt = (child: Element) =>
    child.contains(panel) || (!!overlay && child.contains(overlay));
  const previouslyFocused = ownerDocument.activeElement as HTMLElement | null;
  const inertedElements: HTMLElement[] = [];
  let destroyed = false;

  for (const child of Array.from(root.children)) {
    if (isExempt(child) || !(child instanceof HTMLElement) || child.inert) {
      continue;
    }
    child.inert = true;
    inertedElements.push(child);
  }

  const previousBodyOverflow = ownerDocument.body.style.overflow;
  ownerDocument.body.style.overflow = 'hidden';

  const focusTarget = panel.matches(FOCUSABLE_SELECTOR)
    ? panel
    : (panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? panel);
  const panelHadTabIndex = panel.hasAttribute('tabindex');
  if (focusTarget === panel && !panelHadTabIndex) {
    panel.setAttribute('tabindex', '-1');
  }
  focusTarget.focus({ preventScroll: true });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (destroyed || event.key !== 'Escape') return;
    event.stopPropagation();
    onDismiss();
  };
  ownerDocument.addEventListener('keydown', handleKeyDown);

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      ownerDocument.removeEventListener('keydown', handleKeyDown);
      for (const element of inertedElements) element.inert = false;
      ownerDocument.body.style.overflow = previousBodyOverflow;
      if (focusTarget === panel && !panelHadTabIndex) {
        panel.removeAttribute('tabindex');
      }
      if (previouslyFocused && ownerDocument.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    },
  };
}

export interface SideSheetTransitionOptions {
  /** The width-animated inner wrapper: the `container` style element (header + content). */
  container: HTMLElement;
  /** The modal backdrop, if rendered. Its opacity animates alongside the container. */
  overlay?: HTMLElement | null;
  transition?: Transition;
  reducedMotion?: () => boolean;
}

export interface SideSheetTransitionController {
  /**
   * Animates to the given open state. Pass `instant` on the first sync after
   * connecting so the initial state applies without animating in from it.
   */
  setOpen(open: boolean, instant?: boolean): void;
  destroy(): void;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const DEFAULT_TRANSITION: Transition = { duration: 0.3 };

/**
 * Connects the shared Motion JavaScript width/opacity choreography for
 * `SideSheet`. Every adapter uses this single controller so React and Angular
 * animate identically; neither implements its own version of this effect.
 * Skips the animation and applies the end state immediately when `instant` is
 * passed to `setOpen` or the user prefers reduced motion.
 */
export function createSideSheetTransitionController({
  container,
  overlay,
  transition = DEFAULT_TRANSITION,
  reducedMotion = systemPrefersReducedMotion,
}: SideSheetTransitionOptions): SideSheetTransitionController {
  let containerAnimation: AnimationPlaybackControlsWithThen | undefined;
  let overlayAnimation: AnimationPlaybackControlsWithThen | undefined;

  return {
    setOpen(open, instant = false) {
      containerAnimation?.stop();
      overlayAnimation?.stop();
      const resolvedTransition: Transition =
        instant || reducedMotion() ? { duration: 0 } : transition;

      containerAnimation = animate(
        container,
        // An explicit "0px" (not the bare number 0) is required: the container's
        // own CSS gives it `width: 100%`, so Motion infers a percentage unit from
        // a unitless target. "0%" resolves against the flex item's containing
        // block, which is indefinite here (a `position: fixed` panel sized by its
        // own content) — per CSS, a percentage against an indefinite containing
        // block computes as `auto`, not zero, leaving the panel visible.
        { width: open ? 'auto' : '0px' },
        resolvedTransition,
      );
      if (open) {
        containerAnimation.then(() => {
          container.style.width = '';
        });
      }

      if (overlay) {
        overlayAnimation = animate(
          overlay,
          { opacity: open ? 1 : 0 },
          resolvedTransition,
        );
      }
    },
    destroy() {
      containerAnimation?.stop();
      overlayAnimation?.stop();
    },
  };
}
