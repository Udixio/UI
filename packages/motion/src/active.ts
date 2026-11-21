/**
 * The public entry `@udixio/motion/active`: whether an element may run something that moves by itself (an autoplay, a
 * demo loop, a ticker) — in view, in a shown tab, and with motion not reduced. The main entry does not hold it.
 */
import { watchMotionPolicy } from './policy.js';

/** The three conditions of `watchActive`; the element is active when all of them hold. */
export interface ActiveState {
  /** The element is in the view, past the threshold. */
  readonly inView: boolean;
  /** The document's tab is shown (`document.visibilityState` is not `hidden`). */
  readonly pageVisible: boolean;
  /** Motion is reduced, by the system setting or by `<html data-motion-policy="reduce">`. */
  readonly reduced: boolean;
}

export interface ActiveOptions {
  /**
   * The fraction of the element's area that must be in the view, from 0 (any part of it, the default) to 1 (all of it).
   * An element taller or wider than the view reaches at most the fraction of it that the view can hold.
   */
  threshold?: number;
}

/** A ratio measured at the threshold may land a hair under it. */
const TOLERANCE = 1e-3;

/**
 * Call `onChange(active, state)` when `element` becomes active or inactive, or when the reason changes: active means in
 * the view past `threshold`, in a shown tab, and with motion not reduced. The first call reports the current state, once
 * the browser has measured the element (a frame later); without an IntersectionObserver the element counts as in view and
 * the first call comes at once. Returns a function that stops watching.
 */
export function watchActive(
  element: Element,
  onChange: (active: boolean, state: ActiveState) => void,
  { threshold = 0 }: ActiveOptions = {},
): () => void {
  if (!(threshold >= 0 && threshold <= 1)) throw new RangeError(`watchActive: threshold must be between 0 and 1, got ${threshold}`);
  const document = element.ownerDocument;
  const measured = typeof IntersectionObserver === 'function';
  let inView = !measured;
  let known = !measured;
  let reduced = false;
  let pageVisible = document.visibilityState !== 'hidden';
  let reported: string | undefined;
  let watching = true;

  const report = () => {
    const key = `${inView} ${pageVisible} ${reduced}`;
    if (!watching || !known || key === reported) return;
    reported = key;
    onChange(inView && pageVisible && !reduced, { inView, pageVisible, reduced });
  };
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    report();
  };
  const observer = measured
    ? new IntersectionObserver(
        entries => {
          const entry = entries[entries.length - 1]!;
          inView = entry.isIntersecting && entry.intersectionRatio >= threshold - TOLERANCE;
          known = true;
          report();
        },
        { threshold },
      )
    : undefined;

  const stopPolicy = watchMotionPolicy(value => {
    reduced = value;
    report();
  });
  document.addEventListener('visibilitychange', onVisibility);
  observer?.observe(element);
  return () => {
    if (!watching) return;
    watching = false;
    observer?.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    stopPolicy();
  };
}
