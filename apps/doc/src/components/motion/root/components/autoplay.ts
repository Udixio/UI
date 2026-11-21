/**
 * The autoplay of the root page's component tiles (`root/Components.astro`): each tile plays a short script of states on
 * its real Udixio component — the component animates the change itself, the script only sets its props.
 *
 * A tile plays only while nobody is using it and it can be seen:
 * - paused while the pointer is over it, while keyboard focus is inside it, and for a few seconds after a press or a key
 *   inside it (a touch screen has no hover), so the visitor can take the component over;
 * - paused while it is out of the view or the browser tab is hidden;
 * - paused by the section's Pause button (WCAG 2.2.2), shared by every tile of the page;
 * - stopped under reduced motion, the system's or the site's (`<html data-motion-policy="reduce">`): the tile returns to
 *   its resting state, and stays usable.
 *
 * The status is rendered on the tile (`data-autoplay`) for the tests.
 */
import { type RefObject, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** One step of a script: the state to show, and how long it holds before the next one (ms). */
export type Beat<T> = { readonly state: T; readonly hold: number };

export type AutoplayStatus = 'playing' | 'paused' | 'stopped';

/** How long a press or a key inside a tile keeps it paused after the last one (ms). */
const INTERACTION_HOLD = 6000;

// The section's Pause button: one value for the page, shared by the islands (they share this module).
let pausedByVisitor = false;
const pauseListeners = new Set<() => void>();

export function setShowcasePaused(paused: boolean): void {
  pausedByVisitor = paused;
  for (const listener of [...pauseListeners]) listener();
}

const subscribePause = (listener: () => void) => {
  pauseListeners.add(listener);
  return () => {
    pauseListeners.delete(listener);
  };
};

/** Whether the visitor paused the tiles with the section's button. */
export function useShowcasePaused(): boolean {
  return useSyncExternalStore(subscribePause, () => pausedByVisitor, () => false);
}

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

const readReduced = () =>
  document.documentElement.getAttribute('data-motion-policy') === 'reduce' || window.matchMedia(REDUCE_QUERY).matches;

const subscribeReduced = (listener: () => void) => {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener('change', listener);
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion-policy'] });
  return () => {
    query.removeEventListener('change', listener);
    observer.disconnect();
  };
};

/** Reduced motion, as the components read it: the site's switch (`data-motion-policy`) or the system setting. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, readReduced, () => false);
}

/**
 * Plays `script` on a tile: every `hold` ms the next beat's state is passed to `apply`. The tile renders `script[0]`
 * first (on the server too), which is also its resting state under reduced motion.
 *
 * Returns the status, and `sync(index)`: the tile calls it when the visitor changes the component, so that the script
 * goes on from the state the visitor left, not from where it was.
 */
export function useAutoplay<T>(
  root: RefObject<HTMLElement | null>,
  script: readonly Beat<T>[],
  apply: (state: T) => void,
): { status: AutoplayStatus; sync: (index: number) => void } {
  const reduced = useReducedMotion();
  const paused = useShowcasePaused();
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const index = useRef(0);
  const latest = useRef({ script, apply });
  latest.current = { script, apply };

  // Hover, keyboard focus and recent presses or keys hold the tile.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let hovered = false;
    let focused = false;
    let touched = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => setHeld(hovered || focused || touched);
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      hovered = true;
      update();
    };
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      hovered = false;
      update();
    };
    const onInteract = () => {
      touched = true;
      update();
      clearTimeout(timer);
      timer = setTimeout(() => {
        touched = false;
        update();
      }, INTERACTION_HOLD);
    };
    // Only keyboard focus holds the tile: a mouse click leaves focus on the button it pressed, which would hold it for good.
    const onFocusIn = (event: FocusEvent) => {
      focused = event.target instanceof Element && event.target.matches(':focus-visible');
      update();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
      focused = false;
      update();
    };
    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointerleave', onLeave);
    element.addEventListener('pointerdown', onInteract);
    element.addEventListener('keydown', onInteract);
    element.addEventListener('focusin', onFocusIn);
    element.addEventListener('focusout', onFocusOut);
    // A tile that hydrates under the pointer starts held.
    if (element.matches(':hover')) {
      hovered = true;
      update();
    }
    return () => {
      clearTimeout(timer);
      element.removeEventListener('pointerenter', onEnter);
      element.removeEventListener('pointerleave', onLeave);
      element.removeEventListener('pointerdown', onInteract);
      element.removeEventListener('keydown', onInteract);
      element.removeEventListener('focusin', onFocusIn);
      element.removeEventListener('focusout', onFocusOut);
    };
  }, [root]);

  // Out of the view, or in a hidden tab, nobody watches: the tile waits.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), {
      threshold: 0.35,
    });
    observer.observe(element);
    const onVisibility = () => setPageVisible(document.visibilityState === 'visible');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [root]);

  // Under reduced motion the tile goes back to its resting state, the first beat.
  useEffect(() => {
    if (!reduced || index.current === 0) return;
    index.current = 0;
    latest.current.apply(latest.current.script[0]!.state);
  }, [reduced]);

  const status: AutoplayStatus = reduced
    ? 'stopped'
    : paused || held || !inView || !pageVisible
      ? 'paused'
      : 'playing';

  useEffect(() => {
    if (status !== 'playing') return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const { script: beats } = latest.current;
      timer = setTimeout(() => {
        const { script: current, apply: set } = latest.current;
        index.current = (index.current + 1) % current.length;
        set(current[index.current]!.state);
        schedule();
      }, beats[index.current]!.hold);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [status]);

  const sync = useCallback((next: number) => {
    index.current = next;
  }, []);

  return { status, sync };
}
