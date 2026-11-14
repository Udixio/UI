import { motion, type MotionBinding, type MotionSpec } from '@udixio/motion';
import type { BadgeMotion } from '../interfaces/badge.interface.js';
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

/** The badge's show-hide motion: from nothing (faded, scaled to 0) to its full size. */
export const badgeVisibility: MotionSpec = {
  verb: 'appear',
  keyframes: [
    { opacity: 0, scale: 0 },
    { opacity: 1, scale: 1 },
  ],
};

export interface BadgeTransitionOptions {
  /** The badge element itself; the adapter owns rendering it. */
  element: HTMLElement;
  /** Timing of the show-hide motion; the `appear` defaults when omitted. */
  motion?: BadgeMotion;
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

/**
 * Connects the shared show-hide effect for a badge: it scales and fades in
 * from nothing when it appears and back to nothing when it goes, the way
 * Material's badges enter and exit. Once hidden the element is also
 * `visibility: hidden`, so a hidden badge is neither painted nor hit-tested;
 * reduced motion jumps straight to either end state. Both React and Angular
 * connect this single controller through `@udixio/motion`.
 */
export function createBadgeTransitionController({
  element,
  motion: badgeMotion,
  reducedMotion = systemPrefersReducedMotion,
}: BadgeTransitionOptions): BadgeTransitionController {
  const spec: MotionSpec =
    badgeMotion?.timing === undefined
      ? badgeVisibility
      : { ...badgeVisibility, timing: badgeMotion.timing };
  let binding: MotionBinding | undefined;
  // Bumped by every change of state, so an exit that finishes after a newer
  // change does not hide the badge.
  let run = 0;

  function bindAt(present: boolean): MotionBinding {
    return motion(element, spec, { present, settled: true });
  }

  return {
    setVisible(visible, instant = false) {
      const current = ++run;
      if (visible) element.style.visibility = '';
      if (instant || reducedMotion()) {
        binding = bindAt(visible);
        if (!visible) element.style.visibility = 'hidden';
        return;
      }
      if (!binding) binding = bindAt(!visible);
      binding.setPresent(visible).then((outcome) => {
        if (!visible && outcome === 'finished' && run === current) {
          element.style.visibility = 'hidden';
        }
      });
    },
    destroy() {
      run++;
      binding?.destroy();
      binding = undefined;
    },
  };
}
