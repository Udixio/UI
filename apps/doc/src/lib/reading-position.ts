/**
 * The place a reader keeps across a framework switch (framework-urls spec §2.7). The readings of a page share their heading
 * ids, so the next reading has the same sections under the same ids: the reader finds the section they were in, at the
 * height they were at. The reading line is the top edge of the viewport: a heading on it or above it is read, and the
 * nearest one is the section the reader is in. A reader above the first heading keeps their distance from the top of the
 * page instead.
 *
 * The client router scrolls to the top, or to the URL's hash, before `astro:after-swap`: restoring in that event wins over
 * both, so a reader is never thrown to the hash's section.
 *
 * Browser only: the functions read the document and the window.
 */

/** Where the reader is: the headings above the reading line, nearest first, and the top edge of the nearest one. */
export type ReadingPosition = {
  ids: string[];
  /**
   * The top edge of the nearest heading, in pixels from the top of the viewport; with no heading above the reading line,
   * the top edge of the page (minus the scroll position).
   */
  offset: number;
};

/** Every heading that has an id: the anchors that the readings of a page share. */
const HEADINGS = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]';

/**
 * Whether an edge `top` pixels below the top of the viewport is on the reading line or above it. Scrolling snaps to device
 * pixels while layout is fractional, so a heading scrolled to the top lands up to one device pixel below it.
 */
const isRead = (top: number): boolean => top < 1 / window.devicePixelRatio;

/** The headings above the reading line, nearest first. A reader above the first heading has none. */
export function rememberReadingPosition(): ReadingPosition {
  const above = [...document.querySelectorAll<HTMLElement>(HEADINGS)]
    .filter((heading) => heading.getClientRects().length > 0)
    .map((heading) => ({
      id: heading.id,
      top: heading.getBoundingClientRect().top,
    }))
    .filter(({ top }) => isRead(top))
    .reverse();
  return {
    ids: above.map(({ id }) => id),
    offset: above[0]?.top ?? -window.scrollY,
  };
}

/**
 * Scrolls the page so that the first of the position's headings that is rendered here sits at the same offset, or, for a
 * position above the first heading, so that the page's top edge does.
 */
export function restoreReadingPosition({ ids, offset }: ReadingPosition): void {
  if (ids.length === 0) {
    window.scrollTo({ top: -offset, behavior: 'instant' });
    return;
  }
  for (const id of ids) {
    const heading = document.getElementById(id);
    if (heading === null || heading.getClientRects().length === 0) continue;
    const top = window.scrollY + heading.getBoundingClientRect().top - offset;
    window.scrollTo({ top, behavior: 'instant' });
    return;
  }
}
