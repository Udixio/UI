import { resolveBoxElement } from './anchor-positioner.js';

export interface BadgeAnchorOptions {
  /**
   * The element the badge marks. May host itself with `display: contents`;
   * the badge is placed inside the first element that generates a box.
   */
  host: HTMLElement;
  /** The badge element, already built by the adapter. */
  badge: HTMLElement;
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
}: BadgeAnchorOptions): BadgeAnchorController {
  let anchor: HTMLElement | undefined;
  let positionedByUs = false;

  function detach(): void {
    if (anchor && positionedByUs) anchor.style.position = '';
    positionedByUs = false;
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
