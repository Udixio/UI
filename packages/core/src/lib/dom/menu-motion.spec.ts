import { describe, expect, it } from 'vitest';
import { resolveMenuTransformOrigin } from './menu-motion.js';

const box = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

describe('resolveMenuTransformOrigin', () => {
  it('grows a submenu that opens after its trigger from the edge that faces it', () => {
    // A 40 px trigger at x 100-300, y 200-240; the submenu on its right, centred on it.
    const origin = resolveMenuTransformOrigin(box(100, 200, 200, 40), box(300, 160, 180, 120));
    expect(origin.x).toBe(0);
    expect(origin.y).toBeCloseTo(0.5);
  });

  it('grows a submenu that opens before its trigger (RTL, or no room on the right) from its far edge', () => {
    const origin = resolveMenuTransformOrigin(box(100, 200, 200, 40), box(-80, 160, 180, 120));
    expect(origin.x).toBe(1);
  });

  it('grows a context menu from the pointer, and from the corner it flipped to', () => {
    const point = (x: number, y: number) => ({ left: x, top: y, right: x, bottom: y });
    expect(resolveMenuTransformOrigin(point(50, 60), box(50, 60, 200, 120))).toEqual({ x: 0, y: 0 });
    expect(resolveMenuTransformOrigin(point(790, 590), box(590, 470, 200, 120))).toEqual({ x: 1, y: 1 });
  });

  it('grows a menu that overlaps its anchor from the middle of the span they share', () => {
    // A menu below its anchor, overlapping it horizontally from 100 to 200 out of 0-400.
    const origin = resolveMenuTransformOrigin(box(100, 0, 100, 40), box(0, 40, 400, 200));
    expect(origin).toEqual({ x: 0.375, y: 0 });
  });
});
