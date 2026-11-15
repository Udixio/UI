/** The axis a view is watched on: `block` for the vertical view, `inline` for the horizontal one. */
export type ViewAxis = 'block' | 'inline';

/**
 * An element counts as in view once it is inside the viewport, 10 % short of its leading edge: the bottom edge on the
 * block axis, the right edge on the inline axis.
 */
const ROOT_MARGIN: Record<ViewAxis, string> = { block: '0px 0px -10% 0px', inline: '0px -10% 0px 0px' };

type Callback = (inView: boolean) => void;
type Watch = { observer: IntersectionObserver; callbacks: Map<Element, Set<Callback>> };

/** One observer per axis, created when an element is first watched on it, and dropped when none is left. */
const watches = new Map<ViewAxis, Watch>();

/** Report an error of a callback without stopping the other callbacks of the same batch. */
function report(error: unknown): void {
  if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
  else console.error(error);
}

function watchFor(axis: ViewAxis): Watch {
  let watch = watches.get(axis);
  if (!watch) {
    const callbacks = new Map<Element, Set<Callback>>();
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          for (const notify of [...(callbacks.get(entry.target) ?? [])]) {
            try {
              notify(entry.isIntersecting);
            } catch (error) {
              report(error);
            }
          }
        }
      },
      { root: null, rootMargin: ROOT_MARGIN[axis], threshold: 0 },
    );
    watch = { observer, callbacks };
    watches.set(axis, watch);
  }
  return watch;
}

/**
 * Call `onChange(inView)` when `element` enters or leaves the view; the first call reports the current state.
 * Returns a function that stops watching. Without an IntersectionObserver, the element is reported in view at once:
 * content is never left hidden.
 */
export function watchView(element: Element, axis: ViewAxis, onChange: (inView: boolean) => void): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    onChange(true);
    return () => {};
  }
  const watch = watchFor(axis);
  let callbacks = watch.callbacks.get(element);
  if (!callbacks) {
    callbacks = new Set();
    watch.callbacks.set(element, callbacks);
    watch.observer.observe(element);
  }
  callbacks.add(onChange);
  let watching = true;
  return () => {
    if (!watching) return;
    watching = false;
    const current = watch.callbacks.get(element);
    current?.delete(onChange);
    if (current?.size === 0) {
      watch.callbacks.delete(element);
      watch.observer.unobserve(element);
    }
    if (watch.callbacks.size === 0) {
      watch.observer.disconnect();
      if (watches.get(axis) === watch) watches.delete(axis);
    }
  };
}
