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

/** The overflow values that clip without scrolling: a motion cannot scroll its element back into a box that hides it. */
const NON_SCROLLING = new Set(['hidden', 'clip']);

/**
 * Whether an ancestor with this style is the containing block of an element at `position`: a transform, a perspective or a
 * filter makes one for any element, and a positioned ancestor for an absolutely positioned one.
 */
function isContainingBlock(style: CSSStyleDeclaration, position: string): boolean {
  if (style.transform !== 'none' || style.perspective !== 'none' || style.filter !== 'none') return true;
  return position === 'absolute' && style.position !== 'static';
}

/**
 * The box that decides whether a motion on `element` is in view: the nearest box that clips it without scrolling
 * (`overflow: hidden` or `clip`), else the element itself. The motion moves the element, not that box, so an element
 * that starts outside its clipping track is in view while the track is. The search follows the containing blocks, not the
 * DOM: an absolutely positioned element escapes a clipping box that is not its containing block, and so do its children.
 * A scroll container ends the search: the visitor scrolls its content into view, so the element's own box decides.
 */
export function viewedBox(element: Element): Element {
  const { documentElement: html, body } = element.ownerDocument;
  // The overflow of the body is the viewport's when the root's is visible: the body then clips nothing.
  const rootStyle = getComputedStyle(html);
  const bodyPropagates = rootStyle.overflowX === 'visible' && rootStyle.overflowY === 'visible';
  let node: Element = element;
  for (;;) {
    const position = getComputedStyle(node).position;
    let next = node.parentElement;
    if (position === 'absolute' || position === 'fixed') {
      while (next && next !== html && !isContainingBlock(getComputedStyle(next), position)) next = next.parentElement;
    }
    if (!next || next === html) return element;
    const style = getComputedStyle(next);
    const hides = style.overflowX !== 'visible' || style.overflowY !== 'visible';
    const boxless = style.display === 'contents' || (next === body && bodyPropagates);
    if (hides && !boxless) return NON_SCROLLING.has(style.overflowX) || NON_SCROLLING.has(style.overflowY) ? next : element;
    node = next;
  }
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
