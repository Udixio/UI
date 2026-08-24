import { describe, expect, it } from 'vitest';
import { searchStyle } from './search.style';

const baseState = {
  label: 'Search',
  isFocused: true,
  isExpanded: false,
  hasQuery: false,
  hasResults: false,
} as unknown as Parameters<typeof searchStyle>[0];

describe('searchStyle', () => {
  it('applies the focus indicator to the rounded search container', () => {
    const styles = searchStyle(baseState);

    expect(styles.container).toContain('focus-within:ring-inset');
    expect(styles.container).toContain('focus-within:ring-primary');
    expect(styles.inputField).not.toContain('focus-within:ring-primary');
  });

  it('keeps layout decisions outside of the Search style contract', () => {
    const styles = searchStyle(baseState);

    expect(styles.search).not.toContain('fixed');
    expect(styles.container).toContain('rounded-[28px]');
    expect(styles.results).toContain('max-h-[min(40rem,66dvh)]');
  });
});
