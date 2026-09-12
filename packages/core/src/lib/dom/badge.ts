import { animate, type JSAnimation } from 'animejs';
import type { BadgeTransition } from '../interfaces/badge.interface.js';
import { resolveBoxElement } from './anchor-positioner.js';

export interface BadgeAnchorOptions {
  /**
   * The element the badge marks. May host itself with `display: contents`;
   * the badge is placed inside the first element that generates a box.
   */
  host: HTMLElement;
  /** The badge element, already built by the adapter. */
  badge: HTMLElement;
  /**
   * The resolved `container` classes, read on every `update()` and kept in
   * sync on the box: the caller's `container` overrides land on the element
   * the badge marks, since that element is the container in this shape.
   */
  className?: () => string;
}

export interface BadgeAnchorController {
  /** The box-generating element the badge is currently placed inside. */
  readonly anchor: HTMLElement;
  /**
   * Puts the badge back when the anchor re-rendered its own content, or when
   * the host now resolves to a different box than the one first attached to.
   * Cheap when nothing changed; adapters call it after every render.
   */
  update(): void;
  destroy(): void;
}

/**
 * Attaches a badge to an element the consumer owns, the way Angular Material's
 * `matBadge` does: the badge is appended into the host's box and the box
 * becomes its containing block. The shared `badge` style then positions it
 * against that box's top trailing corner, so the offsets Material specifies
 * hold whether the adapter wraps the icon (React) or marks it in place
 * (Angular).
 *
 * The box is made `position: relative` only when it is static, and only that
 * change is undone on destroy; a box the consumer already positioned is left
 * alone.
 */
export function createBadgeAnchorController({
  host,
  badge,
  className = () => '',
}: BadgeAnchorOptions): BadgeAnchorController {
  let anchor: HTMLElement | undefined;
  let positionedByUs = false;
  let appliedClasses: string[] = [];

  function syncClasses(): void {
    const next = className().split(/\s+/).filter(Boolean);
    const stale = appliedClasses.filter((token) => !next.includes(token));
    if (stale.length) anchor!.classList.remove(...stale);
    if (next.length) anchor!.classList.add(...next);
    appliedClasses = next;
  }

  function detach(): void {
    if (anchor) {
      if (positionedByUs) anchor.style.position = '';
      if (appliedClasses.length) anchor.classList.remove(...appliedClasses);
    }
    positionedByUs = false;
    appliedClasses = [];
    badge.remove();
    anchor = undefined;
  }

  function attach(): void {
    const next = resolveBoxElement(host);
    if (next !== anchor) {
      detach();
      anchor = next;
      // A DOM without layout (jsdom) reports no position at all; treat that
      // like the browser's `static`.
      const position = getComputedStyle(anchor).position;
      if (!position || position === 'static') {
        anchor.style.position = 'relative';
        positionedByUs = true;
      }
    }
    syncClasses();
    if (badge.parentElement !== anchor) anchor!.appendChild(badge);
  }

  attach();

  return {
    get anchor() {
      return anchor!;
    },
    update: attach,
    destroy: detach,
  };
}

export interface BadgeTransitionOptions {
  /** The badge element itself; the adapter owns rendering it. */
  element: HTMLElement;
  transition?: BadgeTransition;
  /** Overridable for tests; defaults to the system `prefers-reduced-motion`. */
  reducedMotion?: () => boolean;
}

export interface BadgeTransitionController {
  /** Shows or hides the badge; `instant` skips the animation (first paint). */
  setVisible(visible: boolean, instant?: boolean): void;
  destroy(): void;
}

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const DEFAULT_TRANSITION: Required<BadgeTransition> = {
  duration: 200,
  ease: 'outCubic',
};

/**
 * Connects the shared show-hide effect for a badge: it scales and fades in
 * from nothing when it appears and back to nothing when it goes, the way
 * Material's badges enter and exit. Once hidden the element is also
 * `visibility: hidden`, so a hidden badge is neither painted nor hit-tested;
 * reduced motion jumps straight to either end state. Both React and Angular
 * connect this single controller with anime.js.
 */
export function createBadgeTransitionController({
  element,
  transition = DEFAULT_TRANSITION,
  reducedMotion = systemPrefersReducedMotion,
}: BadgeTransitionOptions): BadgeTransitionController {
  let current: JSAnimation | undefined;

  return {
    setVisible(visible, instant = false) {
      current?.pause();
      const skipAnimation = instant || reducedMotion();
      if (visible) element.style.visibility = '';
      current = animate(element, {
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0,
        duration: skipAnimation
          ? 0
          : (transition.duration ?? DEFAULT_TRANSITION.duration),
        ease: transition.ease ?? DEFAULT_TRANSITION.ease,
        onComplete: () => {
          if (!visible) element.style.visibility = 'hidden';
        },
      });
    },
    destroy() {
      current?.pause();
    },
  };
}
