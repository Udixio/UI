import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import Search from './Search.svelte';

describe('Search', () => {
  afterEach(cleanup);

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
