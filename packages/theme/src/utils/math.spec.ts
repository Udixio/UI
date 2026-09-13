import { describe, expect, it } from 'vitest';

import { normalize } from './math';

describe('normalize', () => {
  it('maps a value across the ranges', () => {
    expect(normalize(0.5, [0, 1], [3, 7])).toBe(5);
    expect(normalize(150, [0, 100])).toBe(1);
  });

  it('falls back to the output minimum on an empty input range', () => {
    expect(normalize(0, [0, 0], [5, 10])).toBe(5);
    expect(normalize(3, [3, 3])).toBe(0);
  });
});
