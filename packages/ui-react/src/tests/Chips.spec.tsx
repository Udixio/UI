import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { Chips } from '../lib/components/Chips';

describe('Chips', () => {
  it('exposes only explicitly declared selection and removal capabilities', () => {
    const change = vi.fn();
    render(<Chips label="Filters" onItemsChange={change} items={[{ id: 'action', label: 'Action' }, { id: 'filter', label: 'Filter', selected: false }, { id: 'tag', label: 'Tag', removable: true }]} />);
    expect(screen.getByRole('list', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).not.toHaveAttribute('aria-pressed');
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    expect(change).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'filter', selected: true })]));
    const tag = screen.getByRole('button', { name: 'Tag' });
    fireEvent.focus(tag);
    fireEvent.keyDown(tag, { key: 'Delete' });
    expect(change).toHaveBeenCalledWith(expect.not.arrayContaining([expect.objectContaining({ id: 'tag' })]));
  });
});
