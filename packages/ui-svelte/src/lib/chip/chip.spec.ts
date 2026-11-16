import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import Chip from './Chip.svelte';
import Fixture from './chip.fixture.svelte';

describe('Chip', () => {
  afterEach(cleanup);

  it('renders a native chip and toggles selection', async () => {
    const onSelectedChange = vi.fn();
    render(Chip, { props: { label: 'Filters', defaultSelected: false, onSelectedChange } });
    const button = screen.getByRole('button', { name: 'Filters' });
    await fireEvent.click(button);
    flushSync();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('takes its surface transition from its motion timing', () => {
    render(Chip, { props: { label: 'Filter', motion: { timing: { duration: 'duration.long1', easing: 'easing.standard' } } } });

    expect(screen.getByRole('button', { name: 'Filter' }).style.transition).toContain('padding 450ms cubic-bezier(0.2, 0, 0, 1)');
  });

  it('forwards button-only native attributes to the action root', () => {
    render(Chip, { props: { label: 'Filter', form: 'filters' } });

    expect(screen.getByRole('button', { name: 'Filter' })).toHaveAttribute('form', 'filters');
  });

  it('keeps a controlled selection when a function binding rejects it', async () => {
    const onSelectedChange = vi.fn();
    const { component } = render(Fixture, {
      props: { label: 'Filters', mode: 'function-binding', accept: () => false, onSelectedChange },
    });
    const button = screen.getByRole('button', { name: 'Filters' });
    await fireEvent.click(button);
    flushSync();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(component.readSelected()).toBe(false);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('renders a link and requests removal', async () => {
    const onRemove = vi.fn();
    render(Chip, { props: { label: 'Tag', href: '/tag', onRemove } });
    const link = screen.getByRole('link', { name: 'Tag' });
    expect(link).toHaveAttribute('href', '/tag');
    const remove = link.querySelector('svg')?.parentElement;
    expect(remove).toBeTruthy();
    await fireEvent.click(remove as Element);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
