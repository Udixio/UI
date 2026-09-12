import { describe, expect, it } from 'vitest';

import { Color } from './color.base';

describe('Color gamut helpers', () => {
  it('peaks at a different tone for each hue', () => {
    // Cyan peaks far higher than what tone 50 lets on.
    expect(Color.peakChroma(200)).toBeGreaterThan(Color.maxChroma(200, 50));
    expect(Color.peakChroma(200)).toBeCloseTo(Color.maxChroma(200, 89), 1);
  });

  it('spans the peak chroma from the most constrained hue to the freest', () => {
    const [low, high] = Color.gamutChromaRange();
    expect(low).toBeCloseTo(55.3, 1);
    expect(high).toBeCloseTo(112.8, 1);
  });

  it('inverts which hue is most constrained above tone 80', () => {
    // Around tone 50 cyan caps out and red is free; at tone 90 it is red
    // that collapses while green holds.
    const [lowMid] = Color.chromaRangeAt(50);
    const [lowLight, highLight] = Color.chromaRangeAt(90);
    expect(lowMid).toBeCloseTo(Color.maxChroma(200, 50), 0);
    expect(lowLight).toBeCloseTo(Color.maxChroma(33, 90), 0);
    expect(highLight).toBeCloseTo(Color.maxChroma(136, 90), 0);
  });
});
