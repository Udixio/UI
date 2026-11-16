import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import { createSearchResultsTransitionController } from '@udixio/core/dom';
import Search from './Search.svelte';

// The real controller runs; the spy only counts how often the results surface creates one.
vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createSearchResultsTransitionController: vi.fn(actual.createSearchResultsTransitionController),
  };
});

describe('Search', () => {
  afterEach(cleanup);

  it('updates outline state on focus and lets the clear button take focus', async () => {
    render(Search, { props: { label: 'Search', defaultQuery: 'chair' } });
    const input = screen.getByRole('searchbox');
    const container = screen.getByRole('search').querySelector('.container')!;
    const clear = screen.getByRole('button', { name: 'Clear search' });
    await fireEvent.focus(input);
    flushSync();
    expect(container).toHaveClass('outline-secondary');
    expect(container).toHaveClass(
      'duration-[calc(var(--udx-motion-duration-short4,200ms)*var(--udx-motion-scale,1))]',
    );
    await fireEvent.blur(input);
    flushSync();
    expect(container).toHaveClass('outline-transparent');
    clear.focus();
    expect(clear).toHaveFocus();
    expect(clear).toHaveClass('focus-visible:outline-secondary');
  });

  it('updates query, clears it, and submits with Enter', async () => {
    const onQueryChange = vi.fn();
    const onSearch = vi.fn();
    render(Search, {
      props: { label: 'Search products', onQueryChange, onSearch },
    });
    const input = screen.getByRole('searchbox', { name: 'Search products' });
    await fireEvent.input(input, { target: { value: 'chair' } });
    flushSync();
    expect(input).toHaveValue('chair');
    expect(onQueryChange).toHaveBeenCalledWith('chair');
    await fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSearch).toHaveBeenCalledWith('chair');
    await fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
  });

  it('creates one results transition controller and animates each expansion through it', async () => {
    vi.mocked(createSearchResultsTransitionController).mockClear();
    const options = createRawSnippet(() => ({
      render: () => '<div role="option">Alpha</div>',
    }));
    const { rerender } = render(Search, {
      props: { label: 'Search', expanded: false, children: options },
    });
    flushSync();
    expect(createSearchResultsTransitionController).toHaveBeenCalledTimes(1);

    await rerender({ expanded: true });
    flushSync();
    await rerender({ expanded: false });
    flushSync();

    // A creation effect that tracked `expanded` would re-create the controller, and with it apply the new state at once.
    expect(createSearchResultsTransitionController).toHaveBeenCalledTimes(1);
  });

  it('generates a distinct input id for each instance', () => {
    render(Search, { props: { label: 'First search' } });
    render(Search, { props: { label: 'Second search' } });

    const ids = screen.getAllByRole('searchbox').map((input) => input.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('keeps the Figma Search bar geometry and accepts an avatar snippet', () => {
    const avatar = createRawSnippet(() => ({
      render: () =>
        '<span data-testid="search-avatar" aria-hidden="true">JD</span>',
    }));
    render(Search, { props: { label: 'Search', avatar } });

    const search = screen.getByRole('search');
    expect(search).toHaveClass('max-w-[360px]');
    expect(search.querySelector('.input-field')).toHaveClass('px-1');
    expect(screen.getByTestId('search-avatar').parentElement).toHaveClass(
      'avatar-slot',
      'w-[50px]',
    );
  });
});
