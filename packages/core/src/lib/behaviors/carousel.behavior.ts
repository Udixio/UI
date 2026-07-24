/**
 * Pure layout math for the hero Carousel.
 *
 * The carousel never translates its items with native scroll: the scroll
 * container is a sticky, overflow-hidden viewport and the illusion of scrolling
 * is produced entirely by redistributing item *widths* as a function of the
 * smoothed scroll progress. This module owns that redistribution as a pure
 * function so it can be unit-tested and reasoned about in isolation from React,
 * the DOM, and Motion.
 *
 * The behaviour is locked by the golden values in `carousel.behavior.spec.ts`,
 * captured from the original React-only implementation. Being framework-free, it
 * is shared by every adapter rather than reimplemented per framework.
 */

export interface CarouselLayoutInput {
  /** Number of items. */
  count: number;
  /** Visible width of the viewport, in px. */
  viewport: number;
  /** Gap between items, in px. */
  gap: number;
  /** Minimum item width, in px (`outputRange[0]`). */
  minItemWidth: number;
  /** Maximum item width, in px (`outputRange[1]`). */
  maxItemWidth: number;
  /** Smoothed scroll progress, 0..1. */
  progress: number;
}

export interface CarouselItemLayout {
  index: number;
  /** Resolved width in px. */
  width: number;
  /** Whether the item is within the visible budget (hidden items are collapsed). */
  visible: boolean;
}

export interface CarouselLayout {
  /** One entry per item, in index order. */
  items: CarouselItemLayout[];
  /** Sub-item offset applied to the track, in px (<= 0). */
  translate: number;
  /** Index of the item currently closest to the focus (the "selected" item). */
  selectedIndex: number;
}

/** Clamp `value` to `[inMin, inMax]` then linearly remap onto `[outMin, outMax]`. */
const clampMap = (
  value: number,
  [inMin, inMax]: [number, number],
  [outMin, outMax]: [number, number],
): number => {
  if (inMax === inMin) return outMin;
  const clamped = Math.max(inMin, Math.min(value, inMax));
  const t = (clamped - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
};

interface Slot {
  index: number;
  /** Signed distance from the focus position, in item units. */
  distance: number;
  width: number;
}

/**
 * Compute the width of every item, the track offset, and the selected index for
 * a given scroll progress. Nearest-to-focus items receive the most width and
 * consume a running budget; items past the budget collapse and are hidden.
 */
export function computeCarouselLayout(input: CarouselLayoutInput): CarouselLayout {
  const { count, viewport, gap, minItemWidth, maxItemWidth, progress } = input;

  if (count <= 0) {
    return { items: [], translate: 0, selectedIndex: 0 };
  }

  // Continuous focus position. This is the algebraic simplification of the
  // original normalized-center formula:
  //   relativeIndex = (i/(n-1) - progress) / (1/(n-1)) = i - progress*(n-1).
  const pos = progress * Math.max(0, count - 1);

  const slots: Slot[] = Array.from({ length: count }, (_, index) => ({
    index,
    distance: index - pos,
    width: 0,
  }));

  // Assign widths nearest-first, draining a running budget. Stable sort keeps
  // lower indexes first on ties, matching the original ordering.
  const byProximity = [...slots].sort(
    (a, b) => Math.abs(a.distance) - Math.abs(b.distance),
  );

  let budget = viewport + gap + minItemWidth + gap;
  let selectedIndex = 0;

  const visible: Slot[] = [];
  byProximity.forEach((slot, order) => {
    if (budget <= 0) return;
    if (order === 0) selectedIndex = slot.index;

    slot.width = clampMap(
      budget - gap,
      [minItemWidth, maxItemWidth],
      [minItemWidth, maxItemWidth],
    );
    budget -= slot.width + gap;

    // Reserve room so the trailing edge can always show a collapsing item; the
    // += / -= dance keeps `budget` consistent with the adjusted width.
    const floor = (minItemWidth + gap) * 2;
    if (budget !== 0 && budget < floor) {
      const adjusted = slot.width - (floor - budget);
      budget += slot.width - adjusted;
      slot.width = adjusted;
    } else if (budget === 0 && slot.width >= minItemWidth * 2 + gap) {
      const adjusted = slot.width - (minItemWidth + gap);
      budget += slot.width - adjusted;
      slot.width = adjusted;
    }

    visible.push(slot);
  });

  // Smooth widths between neighbours (farthest-first) so items morph
  // continuously as the focus moves across them.
  let smoothingBudget = budget;
  for (let i = visible.length - 1; i >= 0; i--) {
    const slot = visible[i];
    const next = visible[i - 1];
    if (!next) break;
    const blend = 1 - (Math.abs(slot.distance) - Math.abs(next.distance));
    const blended = clampMap(
      blend,
      [0, 2],
      [slot.width + smoothingBudget, next.width],
    );
    smoothingBudget += slot.width - blended;
    slot.width = blended;
  }

  // Sub-item translate derived from the nearest item's fractional distance.
  const nearestByIndex = [...visible].sort((a, b) => a.index - b.index)[0];
  const half = visible.length / 2;
  const percent = clampMap(
    Math.abs(nearestByIndex.distance),
    [nearestByIndex.index === 0 ? 0 : half - 1, half],
    [0, 1],
  );
  const translate = percent * -(minItemWidth + gap) || 0;

  const widthByIndex = new Map(visible.map((s) => [s.index, s.width]));
  const items: CarouselItemLayout[] = slots.map(({ index }) => {
    const width = widthByIndex.get(index);
    return width !== undefined
      ? { index, width, visible: true }
      : { index, width: minItemWidth, visible: false };
  });

  return { items, translate, selectedIndex };
}
