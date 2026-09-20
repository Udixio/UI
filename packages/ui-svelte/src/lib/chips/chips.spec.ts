import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import Chips from './Chips.svelte';

describe('Chips', () => {
  afterEach(cleanup);

  it('renders a labelled list and reports removal', async () => {
    const onItemsChange = vi.fn();
    render(Chips, { props: { items: [{ id: 'one', label: 'One', removable: true }], onItemsChange } });
    expect(screen.getByRole('list', { name: 'Chips' })).toBeInTheDocument();
    const chip = screen.getByRole('button', { name: 'One' });
    expect(chip).toBeInTheDocument();
    await fireEvent.click(chip.querySelector('svg')?.parentElement as Element);
    expect(onItemsChange).toHaveBeenCalledWith([]);
  });

  it('only makes explicitly selected items selectable', async () => {
    const onItemsChange = vi.fn();
    render(Chips, {
      props: {
        label: 'Filters',
        onItemsChange,
        items: [
          { id: 'action', label: 'Action' },
          { id: 'filter', label: 'Filter', selected: false },
        ],
      },
    });

    const action = screen.getByRole('button', { name: 'Action' });
    expect(action).not.toHaveAttribute('aria-pressed');
    await fireEvent.click(action);
    expect(onItemsChange).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    expect(onItemsChange).toHaveBeenCalledWith([
      { id: 'action', label: 'Action' },
      { id: 'filter', label: 'Filter', selected: true },
    ]);
  });
});
