import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import { Chip } from '../lib/components/Chip';

describe('Chip', () => {
  it('owns uncontrolled selected state and exposes aria-pressed', () => {
    render(<Chip label="Filter" defaultSelected />);
    const chip = screen.getByRole('button', { name: 'Filter' });
    expect(chip).toHaveAttribute('aria-pressed', 'true'); fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });
  it('blocks disabled interaction', () => { const changed = vi.fn(); render(<Chip label="Filter" selected={false} onSelectedChange={changed} disabled />); fireEvent.click(screen.getByRole('button', { name: 'Filter' })); expect(changed).not.toHaveBeenCalled(); });
  it('forwards button-only native attributes to the action root', () => {
    render(<Chip label="Filter" form="filters" />);

    expect(screen.getByRole('button', { name: 'Filter' })).toHaveAttribute('form', 'filters');
  });
  it('takes its surface transition from its motion timing', () => {
    render(<Chip label="Filter" motion={{ timing: { duration: 'duration.long1', easing: 'easing.standard' } }} />);

    expect(screen.getByRole('button', { name: 'Filter' }).style.transition).toBe('all 450ms cubic-bezier(0.2, 0, 0, 1)');
  });
  it('applies Material label-large typography to the label', () => {
    render(<Chip label="Filter" />);
    expect(screen.getByText('Filter')).toHaveClass('text-label-large');
  });
  it('keeps removal on the unified chip surface', () => {
    const remove = vi.fn();
    render(<Chip label="Tag" onRemove={remove} />);
    const chip = screen.getByRole('button', { name: 'Tag' });
    fireEvent.focus(chip);
    fireEvent.keyDown(chip, { key: 'Delete' });
    expect(remove).toHaveBeenCalledOnce();
  });
});
