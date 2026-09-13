import { animate, type JSAnimation } from 'animejs';
import {
  resolveTooltipInteraction,
  TOOLTIP_LONG_PRESS_DELAY,
  TOOLTIP_TOUCH_HIDE_DELAY,
  TOOLTIP_TOUCH_MOVE_TOLERANCE,
  type TooltipInteractionEvent,
  type TooltipInteractionState,
  type TooltipTriggerKind,
} from '../behaviors/tooltip.behavior.js';
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
      // A closed surface is only invisible; it still has layout and, being
      // positioned against its anchor, it can sit on top of neighbouring
      // controls. `inert` alone does not let pointer events through in
      // Chromium, so the surface must also stop hit-testing while closed.
      element.style.pointerEvents = open ? '' : 'none';
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

export interface TooltipTriggerControllerOptions {
  /** The trigger element. The controller attaches all of its wiring here. */
  target: HTMLElement;
  /** Stable id, used for `aria-describedby` and cross-tooltip arbitration. */
  tooltipId: string;
  /**
   * Reactive options are read lazily, so changing one never detaches and
   * reattaches the listeners.
   */
  triggers: () => TooltipTriggerKind[];
  openDelay: () => number;
  closeDelay: () => number;
  describeTarget: () => boolean;
  isControlled: () => boolean;
  /** Called on every accepted transition, including one forced by a peer. */
  onStateChange: (
    state: TooltipInteractionState,
    suppressedByPeer: boolean,
  ) => void;
}

export interface TooltipTriggerController {
  /** Mirrors the adapter's controlled `open` into the machine. */
  setControlledState(state: TooltipInteractionState): void;
  /** The surface's own hover, which cancels a pending close. */
  setSurfaceHovered(hovered: boolean): void;
  destroy(): void;
}

/**
 * Owns the tooltip trigger's listeners, timers, touch sequencing, ARIA
 * synchronization and cross-tooltip arbitration. The decision itself --
 * whether an event opens, closes, or is a no-op -- stays in the pure
 * `resolveTooltipInteraction`. Both adapters drive this one implementation
 * instead of each re-deriving the orchestration.
 */
export function createTooltipTriggerController({
  target,
  tooltipId,
  triggers,
  openDelay,
  closeDelay,
  describeTarget,
  isControlled,
  onStateChange,
}: TooltipTriggerControllerOptions): TooltipTriggerController {
  let state: TooltipInteractionState = 'hidden';
  let suppressedByPeer = false;
  let isSurfaceHovered = false;
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let compatibilityTimer: ReturnType<typeof setTimeout> | undefined;
  let touchPointer: { id: number; x: number; y: number } | undefined;
  let touchLongPressOpened = false;
  let suppressTouchCompatibilityEvents = false;

  const ownerDocument = target.ownerDocument;

  const isOpen = (): boolean => state !== 'hidden' && !suppressedByPeer;

  const clearTimers = (): void => {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = undefined;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = undefined;
    }
    if (compatibilityTimer) {
      clearTimeout(compatibilityTimer);
      compatibilityTimer = undefined;
    }
  };

  /**
   * A touch produces synthetic mouse and click events after the gesture.
   * They are released on the next macrotask so the gesture's own handling
   * runs first.
   */
  const releaseCompatibilitySuppression = (): void => {
    compatibilityTimer = setTimeout(() => {
      suppressTouchCompatibilityEvents = false;
    }, 0);
  };

  const syncDescription = (includeTooltip: boolean): void => {
    const ids = (target.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((value) => value && value !== tooltipId);
    if (includeTooltip) ids.push(tooltipId);
    if (ids.length) {
      target.setAttribute('aria-describedby', ids.join(' '));
    } else {
      target.removeAttribute('aria-describedby');
    }
  };

  const syncAria = (): void => {
    if (describeTarget()) syncDescription(isOpen());
  };

  const commit = (next: TooltipInteractionState): void => {
    if (!isControlled()) state = next;
    if (next !== 'hidden') {
      suppressedByPeer = false;
      claimTooltipVisibility(ownerDocument, tooltipId);
    }
    syncAria();
    onStateChange(next, false);
  };

  const resolve = (event: TooltipInteractionEvent) =>
    resolveTooltipInteraction(
      { state, triggers: triggers(), isSurfaceHovered },
      event,
    );

  const request = (event: TooltipInteractionEvent, delayMs = 0): void => {
    const next = resolve(event);
    if (next === null) return;
    clearTimers();
    if (delayMs > 0) {
      const timer = setTimeout(() => commit(next), delayMs);
      if (next === 'hidden') closeTimer = timer;
      else openTimer = timer;
    } else {
      commit(next);
    }
  };

  const removeHoverListener = addPointerEnterLeaveListener(target, {
    onEnter: () => {
      if (suppressTouchCompatibilityEvents) return;
      request('pointerEnter', openDelay());
    },
    onLeave: () => {
      if (suppressTouchCompatibilityEvents) return;
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = undefined;
      }
      request('pointerLeave', closeDelay());
    },
  });

  const onFocus = (): void => {
    if (suppressTouchCompatibilityEvents) return;
    request('focus');
  };

  // `blur` only waits when it actually closes: when the pointer sits on the
  // surface it demotes to `hovered`, which must apply at once.
  const onBlur = (): void => {
    const next = resolve('blur');
    if (next === null) return;
    clearTimers();
    if (next === 'hidden') {
      closeTimer = setTimeout(() => commit(next), closeDelay());
    } else {
      commit(next);
    }
  };

  const onClick = (): void => {
    if (touchLongPressOpened) return;
    request('click');
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch' || !triggers().includes('hover')) return;
    clearTimers();
    touchPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    touchLongPressOpened = false;
    suppressTouchCompatibilityEvents = true;
    openTimer = setTimeout(() => {
      touchLongPressOpened = true;
      commit('hovered');
    }, TOOLTIP_LONG_PRESS_DELAY);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (
      !touchPointer ||
      touchPointer.id !== event.pointerId ||
      touchLongPressOpened ||
      Math.hypot(
        event.clientX - touchPointer.x,
        event.clientY - touchPointer.y,
      ) <= TOOLTIP_TOUCH_MOVE_TOLERANCE
    ) {
      return;
    }
    touchPointer = undefined;
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = undefined;
    }
    releaseCompatibilitySuppression();
  };

  const onPointerFinish = (event: PointerEvent): void => {
    if (touchPointer?.id !== event.pointerId) return;
    touchPointer = undefined;
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = undefined;
    }
    if (!touchLongPressOpened) {
      releaseCompatibilitySuppression();
      return;
    }
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      touchLongPressOpened = false;
      suppressTouchCompatibilityEvents = false;
      commit('hidden');
    }, TOOLTIP_TOUCH_HIDE_DELAY);
  };

  const onContextMenu = (event: MouseEvent): void => {
    if (touchPointer || touchLongPressOpened) event.preventDefault();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !isOpen()) return;
    request('escape');
    event.preventDefault();
  };

  target.addEventListener('focus', onFocus, true);
  target.addEventListener('blur', onBlur, true);
  target.addEventListener('click', onClick);
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerup', onPointerFinish);
  target.addEventListener('pointercancel', onPointerFinish);
  target.addEventListener('contextmenu', onContextMenu);

  const removeClaimListener = listenForTooltipVisibilityClaims(
    ownerDocument,
    tooltipId,
    () => {
      if (state === 'hidden' || suppressedByPeer) return;
      suppressedByPeer = true;
      if (!isControlled()) state = 'hidden';
      syncAria();
      onStateChange('hidden', true);
    },
  );

  return {
    setControlledState(next) {
      const wasOpen = isOpen();
      state = next;
      if (next !== 'hidden') suppressedByPeer = false;
      if (isOpen() && !wasOpen) claimTooltipVisibility(ownerDocument, tooltipId);
      syncAria();
    },
    setSurfaceHovered(hovered) {
      isSurfaceHovered = hovered;
      if (hovered) clearTimers();
      else request('surfaceLeave', closeDelay());
    },
    destroy() {
      clearTimers();
      removeHoverListener();
      removeClaimListener();
      target.removeEventListener('focus', onFocus, true);
      target.removeEventListener('blur', onBlur, true);
      target.removeEventListener('click', onClick);
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerFinish);
      target.removeEventListener('pointercancel', onPointerFinish);
      target.removeEventListener('contextmenu', onContextMenu);
      if (describeTarget()) syncDescription(false);
    },
  };
}
