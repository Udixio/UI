import { describe, expect, it } from 'vitest';
import { flipFrames, parseOwnTransform, sameBox, toLayoutBox, toVisualBox } from './flip.js';

const neutral = { x: 0, y: 0, sx: 1, sy: 1 };

describe('flipFrames', () => {
  it('plays a pure translation from the old centre back to the new one', () => {
    const frames = flipFrames(
      { cx: 300, cy: 120, w: 200, h: 100 },
      { cx: 100, cy: 40, w: 200, h: 100 },
      neutral,
    );
    expect(frames).toEqual([
      { x: 200, y: 80, scaleX: 1, scaleY: 1 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    ]);
  });

  it('plays a size change as a scale from the old size to the new one', () => {
    const frames = flipFrames(
      { cx: 100, cy: 100, w: 100, h: 50 },
      { cx: 100, cy: 100, w: 200, h: 100 },
      neutral,
    );
    expect(frames).toEqual([
      { x: 0, y: 0, scaleX: 0.5, scaleY: 0.5 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    ]);
  });

  it('keeps a non-neutral rest transform in the arrival frame', () => {
    const rest = { x: 16, y: 0, sx: 0.95, sy: 0.95 };
    const before = toVisualBox({ cx: 50, cy: 50, w: 100, h: 100 }, rest);
    const after = toVisualBox({ cx: 80, cy: 60, w: 100, h: 100 }, rest);
    const frames = flipFrames(before, after, rest);
    expect(frames?.[1]).toEqual({ x: 16, y: 0, scaleX: 0.95, scaleY: 0.95 });
    expect(frames?.[0].x).toBeCloseTo(16 + (before.cx - after.cx));
    expect(frames?.[0].y).toBeCloseTo(0 + (before.cy - after.cy));
  });

  it('returns null when the boxes match within tolerance', () => {
    expect(
      flipFrames(
        { cx: 100, cy: 100, w: 200, h: 100 },
        { cx: 100.4, cy: 99.6, w: 202, h: 100 },
        neutral,
      ),
    ).toBeNull();
  });

  it('returns null when a box has no size', () => {
    expect(flipFrames({ cx: 0, cy: 0, w: 0, h: 10 }, { cx: 5, cy: 5, w: 10, h: 10 }, neutral)).toBeNull();
    expect(flipFrames({ cx: 5, cy: 5, w: 10, h: 10 }, { cx: 0, cy: 0, w: 10, h: 0 }, neutral)).toBeNull();
  });
});

describe('toLayoutBox and toVisualBox', () => {
  it('round-trips a visual box through its own transform', () => {
    const own = { x: 12, y: -4, sx: 0.9, sy: 1.1 };
    const visual = { cx: 240, cy: 180, w: 150, h: 90 };
    const back = toVisualBox(toLayoutBox(visual, own), own);
    expect(back.cx).toBeCloseTo(240);
    expect(back.cy).toBeCloseTo(180);
    expect(back.w).toBeCloseTo(150);
    expect(back.h).toBeCloseTo(90);
  });

  it('removes the translation and the scale of the element', () => {
    expect(
      toLayoutBox({ cx: 100, cy: 50, w: 90, h: 45 }, { x: 10, y: 5, sx: 0.5, sy: 0.5 }),
    ).toEqual({ cx: 90, cy: 45, w: 180, h: 90 });
  });

  it('keeps the visual size when the own scale is zero', () => {
    expect(
      toLayoutBox({ cx: 0, cy: 0, w: 30, h: 20 }, { x: 0, y: 0, sx: 0, sy: 0 }),
    ).toEqual({ cx: 0, cy: 0, w: 30, h: 20 });
  });
});

describe('parseOwnTransform', () => {
  it('reads the neutral forms as no transform', () => {
    expect(parseOwnTransform('none', 'none')).toEqual(neutral);
    expect(parseOwnTransform('', '')).toEqual(neutral);
  });

  it('reads a single translate value as an x offset', () => {
    expect(parseOwnTransform('10px', 'none')).toEqual({ x: 10, y: 0, sx: 1, sy: 1 });
  });

  it('reads two translate values, ignores a third and reads a percentage as zero', () => {
    expect(parseOwnTransform('10px 4px', 'none')).toEqual({ x: 10, y: 4, sx: 1, sy: 1 });
    expect(parseOwnTransform('10px 4px 3px', 'none')).toEqual({ x: 10, y: 4, sx: 1, sy: 1 });
    expect(parseOwnTransform('50% 4px', 'none')).toEqual({ x: 0, y: 4, sx: 1, sy: 1 });
  });

  it('reads a single scale value for both axes', () => {
    expect(parseOwnTransform('none', '0.5')).toEqual({ x: 0, y: 0, sx: 0.5, sy: 0.5 });
  });

  it('reads two scale values and ignores a third', () => {
    expect(parseOwnTransform('none', '0.5 2')).toEqual({ x: 0, y: 0, sx: 0.5, sy: 2 });
    expect(parseOwnTransform('none', '0.5 2 3')).toEqual({ x: 0, y: 0, sx: 0.5, sy: 2 });
  });
});

describe('sameBox', () => {
  const box = { cx: 100, cy: 50, w: 200, h: 100 };

  it('matches a box with the same place and size', () => {
    expect(sameBox(box, { ...box })).toBe(true);
  });

  it('tolerates less than half a pixel of centre offset', () => {
    expect(sameBox(box, { ...box, cx: 100.4, cy: 49.6 })).toBe(true);
    expect(sameBox(box, { ...box, cx: 100.5 })).toBe(false);
    expect(sameBox(box, { ...box, cy: 50.5 })).toBe(false);
  });

  it('tolerates a size ratio within 1 percent of 1', () => {
    expect(sameBox(box, { ...box, w: 201 })).toBe(true);
    expect(sameBox(box, { ...box, w: 203 })).toBe(false);
    expect(sameBox(box, { ...box, h: 102 })).toBe(false);
  });

  it('matches two boxes with no width or no height, and not a zero against a size', () => {
    expect(sameBox({ cx: 0, cy: 0, w: 0, h: 10 }, { cx: 0, cy: 0, w: 0, h: 10 })).toBe(true);
    expect(sameBox({ cx: 0, cy: 0, w: 0, h: 10 }, { cx: 0, cy: 0, w: 5, h: 10 })).toBe(false);
  });
});
