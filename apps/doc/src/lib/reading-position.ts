/**
 * The place a reader keeps across a framework switch (framework-urls spec §2.7). The readings of a page share their heading
 * ids, so the next reading has the same sections under the same ids: the reader finds the section they were in, at the
 * height they were at. The reading line is the top edge of the viewport: a heading above it is read, and the nearest one is
 * the section the reader is in.
 *
 * Browser only: the functions read the document and the window.
 */

/** Where the reader is: the ids of the headings above the reading line, nearest first, and the nearest one's top edge. */
export type ReadingPosition = {
  ids: string[];
  /** The top edge of the nearest heading, in pixels from the top of the viewport. */
  offset: number;
};

/** Every heading that has an id: the anchors that the readings of a page share. */
const HEADINGS = 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]';

/** The headings above the reading line, nearest first. A reader at the top of the page has none. */
export function rememberReadingPosition(): ReadingPosition {
  const above = [...document.querySelectorAll<HTMLElement>(HEADINGS)]
    .filter((heading) => heading.getClientRects().length > 0)
    .map((heading) => ({
      id: heading.id,
      top: heading.getBoundingClientRect().top,
    }))
    .filter(({ top }) => top <= 0)
    .reverse();
  return { ids: above.map(({ id }) => id), offset: above[0]?.top ?? 0 };
}

/** Scrolls the page so that the first of the position's headings that is rendered here sits at the same offset. */
export function restoreReadingPosition({ ids, offset }: ReadingPosition): void {
  for (const id of ids) {
    const heading = document.getElementById(id);
    if (heading === null || heading.getClientRects().length === 0) continue;
    const top = window.scrollY + heading.getBoundingClientRect().top - offset;
    window.scrollTo({ top, behavior: 'instant' });
    return;
  }
}
