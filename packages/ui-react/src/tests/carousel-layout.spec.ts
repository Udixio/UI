import { describe, expect, it } from 'vitest';
import {
  computeCarouselLayout,
  type CarouselLayoutInput,
} from '../lib/components/carousel-layout';
import golden from './carousel-layout.golden.json';

const round = (n: number) => Math.round(n * 1e6) / 1e6;

describe('computeCarouselLayout — golden equivalence', () => {
  // These values were captured from the previous inline implementation. They
  // lock the visual behaviour so the refactor is provably behaviour-preserving.
  it.each(golden)(
    'count=$count progress=$progress reproduces the original layout',
    (fixture) => {
      const input: CarouselLayoutInput = {
        count: fixture.count,
        viewport: fixture.viewport,
        gap: fixture.gap,
        minItemWidth: fixture.minItemWidth,
        maxItemWidth: fixture.maxItemWidth,
        progress: fixture.progress,
      };
      const layout = computeCarouselLayout(input);

      // Visual output (widths, visibility, track offset) is locked to the
      // original. `selectedIndex` is intentionally NOT asserted here: at exact
      // half-integer scroll positions the original picked the winner via
      // floating-point noise in its `(center - progress) / step` division,
      // whereas the simplified `index - pos` form resolves ties deterministically
      // to the lower index. That behaviour is covered by the invariant tests.
      expect(layout.items.map((i) => round(i.width))).toEqual(fixture.widths);
      expect(layout.items.map((i) => i.visible)).toEqual(fixture.visible);
      expect(round(layout.translate)).toBe(fixture.translate);
    },
  );
});

describe('computeCarouselLayout — invariants', () => {
  const base = {
    viewport: 800,
    gap: 8,
    minItemWidth: 42,
    maxItemWidth: 300,
  };
  const grid = Array.from({ length: 101 }, (_, i) => i / 100);

  it('returns one entry per item, in index order', () => {
    const { items } = computeCarouselLayout({ ...base, count: 12, progress: 0.4 });
    expect(items).toHaveLength(12);
    items.forEach((item, i) => expect(item.index).toBe(i));
  });

  it('handles empty and single-item carousels without throwing', () => {
    expect(computeCarouselLayout({ ...base, count: 0, progress: 0.5 })).toEqual({
      items: [],
      translate: 0,
      selectedIndex: 0,
    });
    const single = computeCarouselLayout({ ...base, count: 1, progress: 0.5 });
    expect(single.items).toHaveLength(1);
    expect(single.selectedIndex).toBe(0);
  });

  it('anchors the endpoints: progress 0 selects the first item, progress 1 the last', () => {
    for (const count of [3, 8, 15]) {
      expect(computeCarouselLayout({ ...base, count, progress: 0 }).selectedIndex).toBe(0);
      expect(
        computeCarouselLayout({ ...base, count, progress: 1 }).selectedIndex,
      ).toBe(count - 1);
    }
  });

  it('selects the item nearest the continuous focus position', () => {
    for (const count of [5, 15]) {
      for (const progress of grid) {
        const { selectedIndex } = computeCarouselLayout({ ...base, count, progress });
        const pos = progress * (count - 1);
        const nearest = Math.round(pos - 1e-9); // ties resolve to the lower index
        expect(selectedIndex).toBe(Math.max(0, Math.min(count - 1, nearest)));
      }
    }
  });

  it('keeps selectedIndex monotonically non-decreasing as progress grows', () => {
    for (const count of [5, 15]) {
      let previous = -1;
      for (const progress of grid) {
        const { selectedIndex } = computeCarouselLayout({ ...base, count, progress });
        expect(selectedIndex).toBeGreaterThanOrEqual(previous);
        previous = selectedIndex;
      }
    }
  });

  it('keeps the track translate within one collapsed slot', () => {
    const maxOffset = base.minItemWidth + base.gap;
    for (const count of [5, 15]) {
      for (const progress of grid) {
        const { translate } = computeCarouselLayout({ ...base, count, progress });
        expect(translate).toBeLessThanOrEqual(0);
        expect(translate).toBeGreaterThanOrEqual(-maxOffset - 1e-6);
      }
    }
  });

  it('never renders a visible item narrower than the minimum width', () => {
    for (const count of [5, 15]) {
      for (const progress of grid) {
        const { items } = computeCarouselLayout({ ...base, count, progress });
        for (const item of items) {
          if (item.visible) {
            expect(item.width).toBeGreaterThanOrEqual(base.minItemWidth - 1e-6);
            expect(item.width).toBeLessThanOrEqual(base.maxItemWidth + 1e-6);
          }
        }
      }
    }
  });
});
