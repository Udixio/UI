import { describe, expect, it } from 'vitest';
import type { Box, OwnTransform } from './flip.js';
import { easingOf, lerpBox, projectBox, projectText, sampleContent, stretchOf, type ContentPlan, type Stretch } from './project.js';

const box = (cx: number, cy: number, w: number, h: number): Box => ({ cx, cy, w, h });
/** A stand-in for an element: the pure functions only pass it through, they never touch the DOM. */
const element = (name: string): HTMLElement => ({ name }) as unknown as HTMLElement;
const REST: OwnTransform = { x: 0, y: 0, sx: 1, sy: 1 };

/** An own transform as the keyframe it becomes, with its missing fields at rest. */
type Frame = { x?: number; y?: number; scaleX?: number; scaleY?: number };

/**
 * Where a node shows, inside a parent stretched by `k` (the parent at rest is its natural size), from its
 * keyframe: the visual centre is `k` times its layout centre shifted by its own translate, and its size `k` times its own scale.
 */
function shown(after: Box, frame: Frame, k: Stretch): Box {
  return {
    cx: k.x * (after.cx + (frame.x ?? 0)),
    cy: k.y * (after.cy + (frame.y ?? 0)),
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
    const t = projectBox(after, desired, k);
    expect(t.sx).toBeCloseTo(0.5, 9);
    expect(t.sy).toBeCloseTo(1, 9);
    expect(t.x).toBeCloseTo(0, 9);
    expectBox(shown(after, frameOf(t), k), desired);
  });

  it('shows a box at the desired centre and size inside any stretch', () => {
    const after = box(-30, 10, 80, 20);
    const desired = box(-12, 4, 140, 30);
    for (const k of [{ x: 0.5, y: 2 }, { x: 2, y: 0.25 }]) expectBox(shown(after, frameOf(projectBox(after, desired, k)), k), desired);
  });

  it('a box that follows its parent keeps its own scale at one, so its net scale is the interpolated ratio', () => {
    const before = box(0, 0, 200, 60);
    const after = box(0, 0, 400, 60);
    const desired = lerpBox(before, after, 0.25); // width 250
    const k = { x: 0.625, y: 1 }; // the parent's stretch at that instant: 250 / 400
    const t = projectBox(after, desired, k);
    expect(t.sx).toBeCloseTo(1, 9);
    expect(k.x * t.sx).toBeCloseTo(desired.w / after.w, 9);
  });

  it('treats a zero stretch component as one', () => {
    expect(projectBox(box(0, 0, 80, 20), box(10, 0, 80, 20), { x: 0, y: 0 })).toEqual({ x: 10, y: 0, sx: 1, sy: 1 });
  });
});

describe('projectText', () => {
  it('keeps the natural width of a text node and puts its start edge where the box says', () => {
    const after = box(-40, 0, 100, 20);
    const desired = box(-10, 0, 100, 20); // left edge at -60
    const k = { x: 2, y: 1 };
    const t = projectText(after, desired, k);
    expect(t.sx).toBeCloseTo(0.5, 9);
    const visible = shown(after, frameOf(t), k);
    expect(visible.w).toBeCloseTo(100, 9);
    expect(visible.cx - visible.w / 2).toBeCloseTo(-60, 9);
  });
});

describe('sampleContent', () => {
  const steps = 10;

  it('gives a child of constant size the inverse of its parent stretch, and ends at its rest', () => {
    const plan: ContentPlan = { element: element('child'), kind: 'box', before: box(-40, 0, 80, 20), after: box(-40, 0, 80, 20), rest: REST, children: [] };
    const stretchAt = (i: number): Stretch => ({ x: 0.5 + (0.5 * i) / steps, y: 1 });
    const [sample] = sampleContent([plan], stretchAt, () => 1, steps);
    expect(sample.keyframes).toHaveLength(steps + 1);
    for (let i = 0; i < steps; i++) expect(sample.keyframes[i].scaleX).toBeCloseTo(1 / stretchAt(i).x, 9);
    expect(sample.keyframes[steps]).toEqual({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
  });

  it('keeps the start edge of a text node at every sample, and its natural width', () => {
    const after = box(-40, 0, 100, 20); // left edge -90
    const plan: ContentPlan = { element: element('label'), kind: 'text', before: box(-20, 0, 100, 20), after, rest: REST, children: [] }; // left edge -70
    const stretchAt = (i: number): Stretch => ({ x: 2 - i / steps, y: 1 });
    const [sample] = sampleContent([plan], stretchAt, i => i / steps, steps);
    for (let i = 0; i < steps; i++) {
      const visible = shown(after, sample.keyframes[i], stretchAt(i));
      expect(visible.cx - visible.w / 2).toBeCloseTo(-70 - 20 * (i / steps), 6);
      expect(visible.w).toBeCloseTo(100, 6);
    }
  });

  it('gives a child of a box the net stretch of that box, and lists the box before its children', () => {
    const child: ContentPlan = { element: element('child'), kind: 'box', before: box(-20, 0, 40, 20), after: box(-20, 0, 40, 20), rest: REST, children: [] };
    const parent: ContentPlan = { element: element('parent'), kind: 'box', before: box(0, 0, 200, 60), after: box(0, 0, 100, 60), rest: REST, children: [child] };
    const samples = sampleContent([parent], () => ({ x: 1, y: 1 }), i => i / steps, steps);
    expect(samples.map(sample => sample.element)).toEqual([parent.element, child.element]);
    for (let i = 0; i < steps; i++) {
      const q = i / steps;
      expect(samples[0].keyframes[i].scaleX).toBeCloseTo(2 - q, 9); // the box shows 200 - 100 q
      expect(samples[1].keyframes[i].scaleX).toBeCloseTo(1 / (2 - q), 9); // the child keeps its 40 px
    }
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
