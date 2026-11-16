import { describe, expect, it } from 'vitest';
import { amplitudeOf } from './amplitude.js';

describe('amplitudeOf', () => {
  it('returns the frame itself at an amplitude of 1', () => {
    const frame = { x: 10, scale: 2 };
    expect(amplitudeOf(frame, 1)).toBe(frame);
  });

  it('scales the distances: x, y and rotate, and a scale by its distance from 1', () => {
    expect(amplitudeOf({ x: 10, y: -24, rotate: 90, scale: 2, scaleX: 0.5, scaleY: 1.2 }, 0.5)).toEqual({
      x: 5, y: -12, rotate: 45, scale: 1.5, scaleX: 0.75, scaleY: 1.1,
    });
  });

  it('keeps the fields that are not distances: opacity, the drawn shape and the position along a path', () => {
    expect(amplitudeOf({ opacity: 0.4, draw: 0.5, along: 0.3, y: 10 }, 0.5)).toEqual({ opacity: 0.4, draw: 0.5, along: 0.3, y: 5 });
  });

  it('settles every distance at an amplitude of 0', () => {
    expect(amplitudeOf({ x: 10, y: -24, rotate: 90, scale: 2 }, 0)).toEqual({ x: 0, y: -0, rotate: 0, scale: 1 });
  });
});
