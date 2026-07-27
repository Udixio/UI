import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { Chip } from '../lib/components/Chip';

describe('Chip', () => {
  it('owns uncontrolled selected state and exposes aria-pressed', () => {
    render(<Chip label="Filter" defaultSelected />);
    const chip = screen.getByRole('button', { name: 'Filter' });
    expect(chip).toHaveAttribute('aria-pressed', 'true'); fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });
  it('blocks disabled interaction', () => { const changed = vi.fn(); render(<Chip label="Filter" selected={false} onSelectedChange={changed} disabled />); fireEvent.click(screen.getByRole('button', { name: 'Filter' })); expect(changed).not.toHaveBeenCalled(); });
  it('keeps removal on the unified chip surface', () => {
    const remove = vi.fn();
    render(<Chip label="Tag" onRemove={remove} />);
    const chip = screen.getByRole('button', { name: 'Tag' });
    fireEvent.focus(chip);
    fireEvent.keyDown(chip, { key: 'Delete' });
    expect(remove).toHaveBeenCalledOnce();
  });
});
