/** The overflow values of a scroll container: the browser keeps the position of its content in each of them. */
const SCROLLING = new Set(['auto', 'scroll', 'overlay', 'hidden']);

/** The scroll containers whose anchoring is held: the number of flights that hold each one, and the inline value it had. */
const held = new Map<HTMLElement, { flights: number; previous: string }>();

/**
 * The scroll container that anchors the content of a scope: the nearest one, the scope root included, else the page.
 * Reads the computed overflow of the scope's ancestors, so it is called before the writes of a flush.
 */
export function anchorOf(root: HTMLElement): HTMLElement {
  for (let element: HTMLElement | null = root; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (SCROLLING.has(style.overflowX) || SCROLLING.has(style.overflowY)) return element;
  }
  const { scrollingElement, documentElement } = root.ownerDocument;
  return scrollingElement instanceof HTMLElement ? scrollingElement : documentElement;
}

/**
 * Hold the overflow anchoring of a scroller while a flight runs in it: the browser must not move the position under the
 * flight, so an element inserted above the viewport leaves the content where it is. Each flight holds it once.
 */
export function holdAnchor(scroller: HTMLElement): void {
  const entry = held.get(scroller);
  if (entry) {
    entry.flights++;
    return;
  }
  held.set(scroller, { flights: 1, previous: scroller.style.getPropertyValue('overflow-anchor') });
  scroller.style.setProperty('overflow-anchor', 'none');
}

/** Give the anchoring of a scroller back to the author once the last flight that held it has ended. */
export function releaseAnchor(scroller: HTMLElement): void {
  const entry = held.get(scroller);
  if (!entry || --entry.flights > 0) return;
  held.delete(scroller);
  if (entry.previous) scroller.style.setProperty('overflow-anchor', entry.previous);
  else scroller.style.removeProperty('overflow-anchor');
}
