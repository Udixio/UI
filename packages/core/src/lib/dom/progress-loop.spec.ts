import { describe, expect, it } from 'vitest';
import { easedLoopKeyframes } from './progress-loop.js';

describe('easedLoopKeyframes', () => {
  it('starts on the first value and ends on the last one', () => {
    const frames = easedLoopKeyframes([0, 0.5, 1], { value: [0, 10, 4] });
    expect(frames[0]).toEqual({ offset: 0, value: 0 });
    expect(frames.at(-1)).toEqual({ offset: 1, value: 4 });
  });

  it('places a middle keyframe at its own offset and value', () => {
    const frames = easedLoopKeyframes([0, 0.5, 1], { value: [0, 10, 4] });
    expect(frames.find((frame) => frame.offset === 0.5)).toEqual({ offset: 0.5, value: 10 });
  });

  it('eases a segment as Motion easeInOut does, at its own pace', () => {
    // cubic-bezier(0.42, 0, 0.58, 1) at 0.25 is 0.129162 and at 0.5 is 0.5.
    const frames = easedLoopKeyframes([0, 1], { value: [0, 1] }, 4);
    expect(frames.map((frame) => frame.offset)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(frames[1].value).toBeCloseTo(0.129162, 5);
    expect(frames[2].value).toBeCloseTo(0.5, 10);
  });

  it('eases the second segment from its own start value, not from the first one', () => {
    // At 0.625 the second segment (10 to 4) is a quarter of the way through: 10 + (4 - 10) * 0.129162.
    const frames = easedLoopKeyframes([0, 0.5, 1], { value: [0, 10, 4] }, 4);
    const frame = frames.find((item) => Math.abs(item.offset - 0.625) < 1e-9);
    expect(frame?.value).toBeCloseTo(10 - 6 * 0.129162, 5);
  });

  it('keeps a near-zero segment as a jump at its offset', () => {
    const frames = easedLoopKeyframes([0, 0.499, 0.5, 1], { margin: [0, 0, 6, 6] });
    expect(frames.find((frame) => frame.offset === 0.5)?.margin).toBe(6);
    expect(frames.filter((frame) => frame.offset < 0.499).every((frame) => frame.margin === 0)).toBe(true);
  });

  it('samples each segment at the requested count, plus the last keyframe', () => {
    expect(easedLoopKeyframes([0, 0.5, 1], { value: [0, 1, 0] }, 8)).toHaveLength(2 * 8 + 1);
  });

  it('keeps the offsets in order', () => {
    const offsets = easedLoopKeyframes([0, 0.499, 0.5, 1], { value: [0, 0, 6, 6] }).map((frame) => frame.offset);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });

  it('rejects values that do not match the offsets', () => {
    expect(() => easedLoopKeyframes([0, 0.5, 1], { value: [0, 1] })).toThrow(RangeError);
  });

  it('rejects an invalid sample count', () => {
    expect(() => easedLoopKeyframes([0, 1], { value: [0, 1] }, 0)).toThrow(RangeError);
    expect(() => easedLoopKeyframes([0, 1], { value: [0, 1] }, 2.5)).toThrow(RangeError);
  });
});
