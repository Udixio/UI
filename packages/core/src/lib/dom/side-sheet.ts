import { collapseTimingOf } from './component-motion.js';
import {
  animateStyle,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';

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
  /**
   * The side sheet panel: the element that carries the sheet's classes and the author's `className`. Its inline width is the
   * closed size, so it overrides any width class the author gives the panel. It is hidden once its exit has finished.
   */
  container: HTMLElement;
  /** The modal backdrop, if rendered. Its opacity fades alongside the container. */
  overlay?: HTMLElement | null;
  /** The motion of the panel's width; `spring.default.spatial` by default. The backdrop fades on `spring.default.effects`. */
  timing?: SpringRef | CurveTiming;
  /** An extra reduced-motion switch, read at each change; the document policy always applies. */
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

/** The container's width follows the spatial spring of its role: a large surface that moves as a whole. */
const DEFAULT_TIMING: SpringRef = 'spring.default.spatial';
/** The backdrop fades on the effects spring, which does not overshoot. */
const OVERLAY_TIMING: SpringRef = 'spring.default.effects';

/**
 * Connects the shared width/opacity choreography for `SideSheet`, on
 * `@udixio/motion`. Every adapter uses this single controller so React, Angular
 * and Svelte animate identically; neither implements its own version of this
 * effect. Applies the end state at once when `instant` is passed to `setOpen`,
 * or when the document or the `reducedMotion` option asks for reduced motion.
 */
export function createSideSheetTransitionController({
  container,
  overlay,
  timing = DEFAULT_TIMING,
  reducedMotion = () => false,
}: SideSheetTransitionOptions): SideSheetTransitionController {
  let containerMotion: MotionHandle | undefined;
  let overlayMotion: MotionHandle | undefined;

  /** Ends the running motions; the end state is then written inline by the caller. */
  const stopMotions = () => {
    containerMotion?.cancel();
    containerMotion = undefined;
    overlayMotion?.cancel();
    overlayMotion = undefined;
  };

  return {
    setOpen(open, instant = false) {
      if (instant || reducedMotion() || motionPolicy.reduced) {
        stopMotions();
        // An open sheet keeps no inline width, minimum width or visibility, so its classes set its size and show it.
        container.style.width = open ? '' : '0px';
        container.style.minWidth = open ? '' : '0px';
        container.style.visibility = open ? '' : 'hidden';
        if (overlay) overlay.style.opacity = open ? '1' : '0';
        return;
      }

      // An opening panel is shown before its motion starts. A minimum width from the author's classes would hold a closing
      // panel open, so it is released only while the panel is closed.
      if (open) container.style.visibility = '';
      container.style.minWidth = open ? '' : '0px';
      // animateStyle reads the computed width before it replaces a running motion, so a change mid-way does not jump.
      // An explicit "0px" (not the bare number 0) is required: the container's
      // own CSS gives it `width: 100%`, so a unitless target would take a
      // percentage unit. "0%" resolves against the flex item's containing
      // block, which is indefinite here (a `position: fixed` panel sized by its
      // own content) — per CSS, a percentage against an indefinite containing
      // block computes as `auto`, not zero, leaving the panel visible.
      const motion = animateStyle(
        container,
        { width: open ? 'auto' : '0px' },
        // A width that closes to 0 does not use an underdamped spring: it would reach 0 at full speed and stop dead.
        { timing: open ? timing : collapseTimingOf(timing) },
      );
      containerMotion = motion;
      if (!open) {
        // The panel stays visible through its exit, and is hidden once the exit has run to its end. A reopening cancels the
        // exit, which then leaves the panel shown.
        void motion.finished.then((result) => {
          if (result === 'finished' && containerMotion === motion)
            container.style.visibility = 'hidden';
        });
      }
      if (overlay) {
        overlayMotion = animateStyle(
          overlay,
          { opacity: open ? 1 : 0 },
          { timing: OVERLAY_TIMING },
        );
      }
    },
    destroy() {
      stopMotions();
    },
  };
}
