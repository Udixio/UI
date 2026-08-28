import { animate, type JSAnimation } from 'animejs';

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
  /** Overrides the system reduced-motion preference in tests or host integrations. */
  reducedMotion?: () => boolean;
  /** Material 3's short container transition duration, in milliseconds. */
  duration?: number;
}

export interface SearchResultsTransitionController {
  /** Animates the results surface to the requested expanded state. */
  setOpen(open: boolean): void;
  /** Stops the current transition and restores the element's original inline styles. */
  destroy(): void;
}

const DEFAULT_DURATION = 250;
const DEFAULT_EASE = 'outCubic';

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Connects the shared Anime.js reveal used by Search in every framework.
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
  reducedMotion = systemPrefersReducedMotion,
  duration = DEFAULT_DURATION,
}: SearchResultsTransitionControllerOptions): SearchResultsTransitionController {
  const initialState = {
    hidden: element.hidden,
    height: element.style.height,
    opacity: element.style.opacity,
  };
  let animation: JSAnimation | undefined;
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
      animation?.pause();
      animation = undefined;

      // A hidden element reports no useful height. Make it measurable before
      // calculating the target, while keeping the surface inaccessible until
      // the adapter's aria-hidden/inert state is updated by its render cycle.
      element.hidden = false;
      if (!nextOpen) {
        const renderedHeight = element.getBoundingClientRect().height;
        const currentHeight =
          renderedHeight > 0 ? renderedHeight : element.scrollHeight;
        element.style.height = `${currentHeight}px`;
      }

      if (reducedMotion()) {
        applyInstantState(nextOpen);
        return;
      }

      const targetHeight = nextOpen ? `${element.scrollHeight}px` : '0px';
      animation = animate(element, {
        height: targetHeight,
        opacity: nextOpen ? 1 : 0,
        duration,
        ease: DEFAULT_EASE,
        onComplete: () => {
          if (destroyed || currentOpen !== nextOpen) return;

          if (nextOpen) {
            element.hidden = false;
            element.style.height = 'auto';
            element.style.opacity = '1';
          } else {
            element.hidden = true;
            element.style.height = '0px';
            element.style.opacity = '0';
          }
          animation = undefined;
        },
      });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      animation?.pause();
      animation = undefined;
      element.hidden = initialState.hidden;
      element.style.height = initialState.height;
      element.style.opacity = initialState.opacity;
    },
  };
}
