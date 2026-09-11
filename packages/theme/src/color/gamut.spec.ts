import { describe, expect, it } from 'vitest';

import { Color } from './color.base';
import { GAMUT_CHROMA_RANGE } from './gamut';

describe('GAMUT_CHROMA_RANGE', () => {
  it('equals what Color.gamutChromaRange() computes', () => {
    const [low, high] = Color.gamutChromaRange();
    expect(low).toBeCloseTo(GAMUT_CHROMA_RANGE[0], 1);
    expect(high).toBeCloseTo(GAMUT_CHROMA_RANGE[1], 1);
  });

  it('peaks at a different tone for each hue', () => {
    // Le cyan culmine bien plus haut que ce que le ton 50 laisse voir.
    expect(Color.peakChroma(200)).toBeGreaterThan(Color.maxChroma(200, 50));
    expect(Color.peakChroma(200)).toBeCloseTo(Color.maxChroma(200, 89), 1);
  });
});
