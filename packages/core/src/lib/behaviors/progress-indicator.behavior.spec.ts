import { describe, expect, it } from 'vitest';
import {
  clampProgressValue,
  isDeterminateVariant,
} from './progress-indicator.behavior.js';

describe('clampProgressValue', () => {
  it('passes through values already inside the 0-100 range', () => {
    expect(clampProgressValue(40)).toBe(40);
  });

  it('clamps values above 100 down to 100', () => {
    expect(clampProgressValue(140)).toBe(100);
  });

  it('clamps values below 0 up to 0', () => {
    expect(clampProgressValue(-10)).toBe(0);
  });

  it('treats NaN as 0', () => {
    expect(clampProgressValue(Number.NaN)).toBe(0);
  });
});

describe('isDeterminateVariant', () => {
  it('reports determinate variants as determinate', () => {
    expect(isDeterminateVariant('linear-determinate')).toBe(true);
    expect(isDeterminateVariant('circular-determinate')).toBe(true);
  });

  it('reports indeterminate variants as not determinate', () => {
    expect(isDeterminateVariant('linear-indeterminate')).toBe(false);
    expect(isDeterminateVariant('circular-indeterminate')).toBe(false);
  });
});
