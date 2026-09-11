import { describe, expect, it } from 'vitest';
import { resolveBadgeLabel, resolveBadgeVariant } from './badge.behavior.js';

describe('resolveBadgeLabel', () => {
  it('shows nothing when there is no label, which is what makes the small dot', () => {
    expect(resolveBadgeLabel({})).toBeUndefined();
  });

  it('treats an empty string as nothing to show', () => {
    expect(resolveBadgeLabel({ label: '' })).toBeUndefined();
  });

  it('shows zero, which is a count a caller chose to display', () => {
    expect(resolveBadgeLabel({ label: 0 })).toBe('0');
  });

  it('renders a string label as given', () => {
    expect(resolveBadgeLabel({ label: 'New' })).toBe('New');
  });

  it('caps a number above max with a plus, as Material spells it', () => {
    expect(resolveBadgeLabel({ label: 100, max: 99 })).toBe('99+');
  });

  it('leaves a number at the cap uncapped', () => {
    expect(resolveBadgeLabel({ label: 99, max: 99 })).toBe('99');
  });

  it('ignores max for a string label, having nothing to compare', () => {
    expect(resolveBadgeLabel({ label: 'Beta', max: 9 })).toBe('Beta');
  });
});

describe('resolveBadgeVariant', () => {
  it('is small without a label', () => {
    expect(resolveBadgeVariant(undefined)).toBe('small');
  });

  it('is large with one', () => {
    expect(resolveBadgeVariant('3')).toBe('large');
  });

  // Material limits badge content to four characters including the `+`, so the
  // longest capped count that fits is 999+. Nothing enforces it: truncating a
  // caller's text would hide data, and `max` is the tool for the count case.
  it('stays large for content beyond what Material recommends', () => {
    expect(resolveBadgeVariant(resolveBadgeLabel({ label: 12345 }))).toBe('large');
  });
});
