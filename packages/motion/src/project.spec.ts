import { describe, expect, it } from 'vitest';
import type { Box, OwnTransform } from './flip.js';
import { correctedRadius, easingOf, lerpBox, liveContentBoxes, parseRadii, projectBox, projectText, sampleContent, stretchOf, type ContentPlan, type Stretch } from './project.js';

const box = (cx: number, cy: number, w: number, h: number): Box => ({ cx, cy, w, h });
/** A stand-in for an element: the pure functions only pass it through, they never touch the DOM. */
const element = (name: string): HTMLElement => ({ name }) as unknown as HTMLElement;
const REST: OwnTransform = { x: 0, y: 0, sx: 1, sy: 1 };
const ONE: Stretch = { x: 1, y: 1 };

/** An own transform as the keyframe it becomes, with its missing fields at rest. */
type Frame = { x?: number; y?: number; scaleX?: number; scaleY?: number };

/**
 * Where a node shows, inside a parent stretched by `k` (the parent at rest is its natural size), from its
 * keyframe: its translate is in local pixels, so it is multiplied by `unit`, and the visual centre is `k` times the
 * rest centre shifted by that; its size is `k` times its own scale times its rest size.
 */
function shown(after: Box, frame: Frame, k: Stretch, unit: Stretch = ONE): Box {
  return {
    cx: k.x * (after.cx + unit.x * (frame.x ?? 0)),
    cy: k.y * (after.cy + unit.y * (frame.y ?? 0)),
    w: k.x * (frame.scaleX ?? 1) * after.w,
    h: k.y * (frame.scaleY ?? 1) * after.h,
  };
}

/** The keyframe that an own transform is played as, on a node whose rest is `REST`. */
const frameOf = (t: OwnTransform): Frame => ({ x: t.x, y: t.y, scaleX: t.sx, scaleY: t.sy });

function expectBox(actual: Box, expected: Box): void {
  expect(actual.cx).toBeCloseTo(expected.cx, 9);
  expect(actual.cy).toBeCloseTo(expected.cy, 9);
  expect(actual.w).toBeCloseTo(expected.w, 9);
  expect(actual.h).toBeCloseTo(expected.h, 9);
}

describe('lerpBox', () => {
  it('interpolates the centre and the size, and does not clamp an overshoot', () => {
    const from = box(0, 0, 100, 10);
    const to = box(10, 0, 200, 30);
    expect(lerpBox(from, to, 0)).toEqual(from);
    expect(lerpBox(from, to, 1)).toEqual(to);
    expect(lerpBox(from, to, 0.5)).toEqual(box(5, 0, 150, 20));
    expect(lerpBox(from, to, 1.2).w).toBeCloseTo(220, 9);
  });

  it('takes the progress of x for the centre x and the width, and of y for the centre y and the height', () => {
    const from = box(0, 0, 100, 10);
    const to = box(10, 0, 200, 30);
    expect(lerpBox(from, to, { x: 0.5, y: 1 })).toEqual(box(5, 0, 150, 30));
  });
});

describe('stretchOf', () => {
  it('is the ratio of the desired size to the layout size, and 1 for a zero dimension', () => {
    expect(stretchOf(box(0, 0, 80, 20), box(0, 0, 160, 10))).toEqual({ x: 2, y: 0.5 });
    expect(stretchOf(box(0, 0, 0, 20), box(0, 0, 50, 20))).toEqual({ x: 1, y: 1 });
  });
});

describe('projectBox', () => {
  it('cancels a parent stretched twice: a child of constant size is scaled by one half and keeps its centre', () => {
    const after = box(30, 0, 80, 20);
    const desired = box(60, 0, 80, 20); // its offset doubles with the parent: its own translate stays at zero
    const k = { x: 2, y: 1 };
    const t = projectBox(after, desired, k, ONE);
    expect(t.sx).toBeCloseTo(0.5, 9);
    expect(t.sy).toBeCloseTo(1, 9);
    expect(t.x).toBeCloseTo(0, 9);
    expectBox(shown(after, frameOf(t), k), desired);
  });

  it('shows a box at the desired centre and size inside any stretch', () => {
    const after = box(-30, 10, 80, 20);
    const desired = box(-12, 4, 140, 30);
    for (const k of [{ x: 0.5, y: 2 }, { x: 2, y: 0.25 }]) expectBox(shown(after, frameOf(projectBox(after, desired, k, ONE)), k), desired);
  });

  it('a box that follows its parent keeps its own scale at one, so its net scale is the interpolated ratio', () => {
    const before = box(0, 0, 200, 60);
    const after = box(0, 0, 400, 60);
    const desired = lerpBox(before, after, 0.25); // width 250
    const k = { x: 0.625, y: 1 }; // the parent's stretch at that instant: 250 / 400
    const t = projectBox(after, desired, k, ONE);
    expect(t.sx).toBeCloseTo(1, 9);
    expect(k.x * t.sx).toBeCloseTo(desired.w / after.w, 9);
  });

  it('treats a zero stretch component as one', () => {
    expect(projectBox(box(0, 0, 80, 20), box(10, 0, 80, 20), { x: 0, y: 0 }, ONE)).toEqual({ x: 10, y: 0, sx: 1, sy: 1 });
  });

  it('divides the translate by the unit of the parent: a card at rest scale one half, stretched twice', () => {
    // On screen the child is 15 px from the card's centre at rest, and must be 40 px from it.
    const after = box(15, 0, 10, 20);
    const desired = box(40, 0, 10, 20);
    const k = { x: 2, y: 1 };
    const unit = { x: 0.5, y: 1 };
    const t = projectBox(after, desired, k, unit);
    expect(t.x).toBeCloseTo(10, 9);
    expectBox(shown(after, frameOf(t), k, unit), desired);
  });
});

describe('projectText', () => {
  it('keeps the natural width of a text node and puts its start edge where the box says', () => {
    const after = box(-40, 0, 100, 20);
    const desired = box(-10, 0, 100, 20); // left edge at -60
    const k = { x: 2, y: 1 };
    const t = projectText(after, desired, k, ONE);
    expect(t.sx).toBeCloseTo(0.5, 9);
    const visible = shown(after, frameOf(t), k);
    expect(visible.w).toBeCloseTo(100, 9);
    expect(visible.cx - visible.w / 2).toBeCloseTo(-60, 9);
  });

  it('keeps the start edge through the unit of the parent', () => {
    const after = box(15, 0, 10, 20);
    const desired = box(15, 0, 10, 20); // left edge at 10
    const k = { x: 2, y: 1 };
    const unit = { x: 0.5, y: 1 };
    const t = projectText(after, desired, k, unit);
    expect(t.sx).toBeCloseTo(0.5, 9);
    const visible = shown(after, frameOf(t), k, unit);
    expect(visible.w).toBeCloseTo(10, 9);
    expect(visible.cx - visible.w / 2).toBeCloseTo(10, 9);
  });
});

describe('sampleContent', () => {
  const steps = 10;

  it('gives a child of constant size the inverse of its parent stretch, and ends at its rest', () => {
    const plan: ContentPlan = { element: element('child'), kind: 'box', before: box(-40, 0, 80, 20), after: box(-40, 0, 80, 20), rest: REST, unit: ONE, children: [] };
    const stretchAt = (i: number): Stretch => ({ x: 0.5 + (0.5 * i) / steps, y: 1 });
    const [sample] = sampleContent([plan], stretchAt, () => ({ x: 1, y: 1 }), steps);
    expect(sample.keyframes).toHaveLength(steps + 1);
    for (let i = 0; i < steps; i++) expect(sample.keyframes[i].scaleX).toBeCloseTo(1 / stretchAt(i).x, 9);
    expect(sample.keyframes[steps]).toEqual({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
  });

  it('keeps the start edge of a text node at every sample, and its natural width', () => {
    const after = box(-40, 0, 100, 20); // left edge -90
    const plan: ContentPlan = { element: element('label'), kind: 'text', before: box(-20, 0, 100, 20), after, rest: REST, unit: ONE, children: [] }; // left edge -70
    const stretchAt = (i: number): Stretch => ({ x: 2 - i / steps, y: 1 });
    const [sample] = sampleContent([plan], stretchAt, i => ({ x: i / steps, y: i / steps }), steps);
    for (let i = 0; i < steps; i++) {
      const visible = shown(after, sample.keyframes[i], stretchAt(i));
      expect(visible.cx - visible.w / 2).toBeCloseTo(-70 - 20 * (i / steps), 6);
      expect(visible.w).toBeCloseTo(100, 6);
    }
  });

  it('gives a child of a box the net stretch of that box, and lists the box before its children', () => {
    const child: ContentPlan = { element: element('child'), kind: 'box', before: box(-20, 0, 40, 20), after: box(-20, 0, 40, 20), rest: REST, unit: ONE, children: [] };
    const parent: ContentPlan = { element: element('parent'), kind: 'box', before: box(0, 0, 200, 60), after: box(0, 0, 100, 60), rest: REST, unit: ONE, children: [child] };
    const samples = sampleContent([parent], () => ({ x: 1, y: 1 }), i => ({ x: i / steps, y: i / steps }), steps);
    expect(samples.map(sample => sample.element)).toEqual([parent.element, child.element]);
    for (let i = 0; i < steps; i++) {
      const q = i / steps;
      expect(samples[0].keyframes[i].scaleX).toBeCloseTo(2 - q, 9); // the box shows 200 - 100 q
      expect(samples[1].keyframes[i].scaleX).toBeCloseTo(1 / (2 - q), 9); // the child keeps its 40 px
    }
  });
});

describe('liveContentBoxes', () => {
  /** A plan of one node, at rest in a parent whose unit is 0.5 (the card at rest scale one half). */
  const planOf = (name: string, after: Box, children: ContentPlan[] = []): ContentPlan => ({
    element: element(name),
    kind: 'box',
    before: after,
    after,
    rest: REST,
    unit: { x: 0.5, y: 1 },
    children,
  });

  it('places a node that did not move at its rest box, scaled by the stretch of its parent', () => {
    const node = planOf('node', box(15, 0, 10, 20));
    const live = liveContentBoxes([node], { x: 2, y: 1 }, () => REST);
    expect(live.get(node.element)).toEqual(box(30, 0, 20, 20));
  });

  it('moves a node by its own translate, expressed in local pixels of its parent', () => {
    const node = planOf('node', box(15, 0, 10, 20));
    const live = liveContentBoxes([node], { x: 2, y: 1 }, el => (el === node.element ? { x: 10, y: 0, sx: 1, sy: 1 } : REST));
    expect(live.get(node.element)?.cx).toBeCloseTo(40, 9); // 2 × (15 + 0.5 × 10)
  });

  it('gives the children of a box the stretch that the box has now: its stretch times its own scale', () => {
    const child = planOf('child', box(-30, 0, 20, 10));
    const parent = planOf('parent', box(0, 0, 100, 40), [child]);
    const own = (el: HTMLElement): OwnTransform => (el === parent.element ? { x: 0, y: 0, sx: 0.5, sy: 1 } : REST);
    const live = liveContentBoxes([parent], { x: 2, y: 1 }, own);
    expect(live.get(parent.element)?.w).toBeCloseTo(100, 9); // 2 × 0.5 × 100
    expect(live.get(child.element)?.cx).toBeCloseTo(-30, 9); // the child did not move: its place is stretched by 2 × 0.5 = 1
    expect(live.get(child.element)?.w).toBeCloseTo(20, 9);
  });
});

describe('easingOf', () => {
  it('is the identity for linear, and the cubic-bezier progress for a cubic-bezier string', () => {
    expect(easingOf('linear')?.(0.3)).toBe(0.3);
    expect(easingOf('cubic-bezier(0, 0, 1, 1)')?.(0.3)).toBeCloseTo(0.3, 9);
    const standard = easingOf('cubic-bezier(0.2, 0, 0, 1)');
    expect(standard?.(0)).toBeCloseTo(0, 9);
    expect(standard?.(1)).toBeCloseTo(1, 9);
    expect(standard?.(0.5)).toBeGreaterThan(0.5);
  });

  it('is null for any other easing', () => {
    expect(easingOf('ease-in')).toBeNull();
    expect(easingOf('linear(0, 1)')).toBeNull();
  });
});

describe('parseRadii', () => {
  it('reads a circular corner from one value, and an elliptical one from a horizontal then a vertical value', () => {
    expect(parseRadii('16px', '16px', '16px', '16px')).toEqual({ h: [16, 16, 16, 16], v: [16, 16, 16, 16] });
    expect(parseRadii('16px 8px', '16px 8px', '16px 8px', '16px 8px')).toEqual({ h: [16, 16, 16, 16], v: [8, 8, 8, 8] });
  });

  it('is null when every radius is zero, and when one is a percentage', () => {
    expect(parseRadii('0px', '0px', '0px', '0px')).toBeNull();
    expect(parseRadii('16px', '50%', '16px', '16px')).toBeNull();
  });
});

describe('correctedRadius', () => {
  it('divides the horizontal radii by the horizontal stretch and the vertical ones by the vertical stretch', () => {
    expect(correctedRadius({ h: [16, 16, 16, 16], v: [16, 16, 16, 16] }, { x: 0.5, y: 1 })).toBe('32px 32px 32px 32px / 16px 16px 16px 16px');
  });
});
