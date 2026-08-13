import { animate, type JSAnimation } from 'animejs';
import type { TooltipTransition } from '../interfaces/tooltip.interface.js';

export interface TooltipTransitionOptions {
  /** The tooltip surface element (the panel that fades/scales in and out). */
  element: HTMLElement;
  transition?: TooltipTransition;
  reducedMotion?: () => boolean;
}

export interface TooltipTransitionController {
  /**
   * Animates to the given open state. Pass `instant` on the first sync after
   * connecting so the initial state applies without animating in from it.
   */
  setOpen(open: boolean, instant?: boolean): void;
  destroy(): void;
}

const TOOLTIP_CLAIM_EVENT = 'udx:tooltip:claim';

/** Claims the single visible tooltip slot for one document. */
export function claimTooltipVisibility(
  ownerDocument: Document,
  tooltipId: string,
): void {
  const EventConstructor = ownerDocument.defaultView?.CustomEvent;
  if (!EventConstructor) return;
  ownerDocument.dispatchEvent(
    new EventConstructor<string>(TOOLTIP_CLAIM_EVENT, { detail: tooltipId }),
  );
}

/** Notifies a tooltip when another tooltip claims the visible slot. */
export function listenForTooltipVisibilityClaims(
  ownerDocument: Document,
  tooltipId: string,
  onClaimedByPeer: () => void,
): () => void {
  const handleClaim = (event: Event) => {
    if ((event as CustomEvent<string>).detail !== tooltipId) {
      onClaimedByPeer();
    }
  };
  ownerDocument.addEventListener(TOOLTIP_CLAIM_EVENT, handleClaim);
  return () =>
    ownerDocument.removeEventListener(TOOLTIP_CLAIM_EVENT, handleClaim);
}

function isWithin(root: HTMLElement, node: EventTarget | null): boolean {
  return node instanceof Node && root.contains(node);
}

/**
 * Connects bubbling-safe pointer enter/leave detection to `element`. Native
 * `mouseenter`/`mouseleave` are dispatched only on the element whose own box
 * the pointer crosses and never bubble, so a listener bound to an ancestor
 * that renders `display: contents` -- every interactive Udixio component
 * (`Button`, `IconButton`, `Chip`, ...) hosts itself that way -- would never
 * fire. `mouseover`/`mouseout` do bubble along the DOM tree regardless of
 * which ancestors generate a box, so filtering them by `relatedTarget`
 * (whether the pointer came from, or is going to, a node already inside
 * `element`) reproduces enter/leave semantics safely through any such
 * ancestor. This is the same technique React uses internally to synthesize
 * its own bubbling-safe `onMouseEnter`/`onMouseLeave`.
 */
export function addPointerEnterLeaveListener(
  element: HTMLElement,
  handlers: { onEnter: () => void; onLeave: () => void },
): () => void {
  const handleOver = (event: MouseEvent) => {
    if (isWithin(element, event.relatedTarget)) return;
    handlers.onEnter();
  };
  const handleOut = (event: MouseEvent) => {
    if (isWithin(element, event.relatedTarget)) return;
    handlers.onLeave();
  };
  element.addEventListener('mouseover', handleOver);
  element.addEventListener('mouseout', handleOut);
  return () => {
    element.removeEventListener('mouseover', handleOver);
    element.removeEventListener('mouseout', handleOut);
  };
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const DEFAULT_TRANSITION: Required<TooltipTransition> = {
  duration: 300,
  ease: 'outCubic',
};

const CLOSED_HEIGHT = 16;

/**
 * Connects the shared Anime.js opacity/height choreography for `Tooltip`.
 * Every adapter uses this single controller so React and Angular animate
 * identically; neither implements its own version of this effect and no
 * `motion/react` is involved. The tooltip surface stays mounted at all
 * times -- the adapter toggles `inert`/`aria-hidden` alongside this
 * animation instead of mounting/unmounting the surface -- so there is no
 * exit-then-unmount handshake to coordinate.
 */
export function createTooltipTransitionController({
  element,
  transition = DEFAULT_TRANSITION,
  reducedMotion = systemPrefersReducedMotion,
}: TooltipTransitionOptions): TooltipTransitionController {
  let current: JSAnimation | undefined;

  return {
    setOpen(open, instant = false) {
      current?.pause();
      const skipAnimation = instant || reducedMotion();
      const openHeight = Math.max(element.scrollHeight, CLOSED_HEIGHT);
      element.style.overflow = 'hidden';
      current = animate(element, {
        opacity: open ? 1 : 0,
        height: open ? `${openHeight}px` : `${CLOSED_HEIGHT}px`,
        duration: skipAnimation
          ? 0
          : (transition.duration ?? DEFAULT_TRANSITION.duration),
        ease: transition.ease ?? DEFAULT_TRANSITION.ease,
        onComplete: () => {
          if (open) {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
          }
        },
      });
    },
    destroy() {
      current?.pause();
    },
  };
}
