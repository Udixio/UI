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
  it('uses the inline contained M3 geometry and focus tokens', () => {
    const styles = searchStyle(baseState);

    expect(styles.search).toContain('min-w-[min(360px,100%)]');
    expect(styles.search).toContain('max-w-[720px]');
    expect(styles.container).toContain('rounded-[28px]');
    expect(styles.container).not.toContain('shadow-');
    expect(styles.container).toContain('outline-[3px]');
    expect(styles.container).toContain('outline-offset-2');
    expect(styles.container).toContain('outline-secondary');
    expect(styles.container).not.toContain('outline-transparent');
    expect(styles.container).toContain('gap-0');
    expect(styles.container).toContain('transition-[outline-color]');
    expect(styles.container).toContain('duration-200');
    expect(styles.container).toContain('motion-reduce:transition-none');

    const unfocusedStyles = searchStyle({
      ...baseState,
      isFocused: false,
    });
    expect(unfocusedStyles.container).toContain('outline-transparent');
    expect(unfocusedStyles.container).not.toContain('outline-secondary');
    expect(styles.container).not.toContain('ring-inset');
    expect(styles.inputField).toContain('min-h-14');
    expect(styles.inputField).toContain('gap-1');
    expect(styles.inputField).toContain('px-6');
    expect(styles.inputField).toContain('group/search-input');
    expect(styles.input).toContain('px-0');
    expect(styles.leadingIcon).toContain('text-on-surface');
    expect(styles.leadingIcon).toContain('pointer-events-none');
    expect(styles.leadingIcon).toContain('size-12');
    expect(styles.leadingIcon).not.toContain('group/search-leading');
    expect(styles.leadingIcon).not.toContain('outline-transparent');
    expect(styles.clearButton).toContain('group/search-clear');
    expect(styles.clearButton).toContain('outline-transparent');
    expect(styles.clearButton).toContain('transition-[outline-color]');
    expect(styles.stateLayer).toContain('overflow-hidden');
  });

  it('keeps the contained results surface separate without a divider', () => {
    const styles = searchStyle({
      ...baseState,
      isFocused: false,
      hasResults: true,
    });

    expect(styles.results).toContain('overflow-hidden');
    expect(styles.results).not.toContain('max-h-[min(40rem,66dvh)]');
    expect(styles.results).not.toContain('overflow-y-auto');
    expect(styles.results).toContain('rounded-xl');
    expect(styles.results).toContain('bg-surface-container-high');
    expect(styles.results).toContain('pb-0');
    expect(styles.results).not.toContain('border-t');
    expect(styles.results).not.toContain('border-outline-variant');
    expect(styles.container).not.toContain('outline-secondary');
    expect(styles.container).toContain('outline-transparent');
    expect(styles.container).not.toContain('gap-0.5');
    expect(styles.stateLayer).toContain('motion-reduce:transition-none');

    const openStyles = searchStyle({
      ...baseState,
      isFocused: true,
      isExpanded: true,
      hasResults: true,
    });
    expect(openStyles.container).toContain('gap-0.5');
    expect(openStyles.results).toContain('pb-4');
  });
});
