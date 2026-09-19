import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { axe } from 'jest-axe';
import Divider from './Divider.svelte';

describe('Divider', () => {
  it('renders a native hr with the horizontal treatment by default', () => {
    render(Divider, { props: { 'data-testid': 'divider' } });

    const divider = screen.getByTestId('divider');
    expect(divider.tagName).toBe('HR');
    expect(divider).toHaveClass('border-t');
    expect(divider).not.toHaveAttribute('aria-orientation');
  });

  it('applies the vertical treatment and aria-orientation when requested', () => {
    render(Divider, { props: { 'data-testid': 'divider', orientation: 'vertical' } });

    const divider = screen.getByTestId('divider');
    expect(divider).toHaveClass('border-l');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('forwards native attributes', () => {
    render(Divider, { props: { 'data-testid': 'divider', 'aria-label': 'Section' } });

    expect(screen.getByTestId('divider')).toHaveAttribute('aria-label', 'Section');
  });

  it('lets consumers override aria-orientation', () => {
    render(Divider, {
      props: { 'data-testid': 'divider', orientation: 'vertical', 'aria-orientation': 'horizontal' },
    });

    expect(screen.getByTestId('divider')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('exposes the resolved state to a classes function and merges class', () => {
    render(Divider, {
      props: {
        'data-testid': 'divider',
        orientation: 'vertical',
        class: 'h-12',
        classes: ({ orientation }) => ({
          divider: orientation === 'vertical' ? 'custom-vertical' : 'custom-horizontal',
        }),
      },
    });

    expect(screen.getByTestId('divider')).toHaveClass('custom-vertical');
    expect(screen.getByTestId('divider')).toHaveClass('h-12');
  });

  it('has no axe violations in either orientation', async () => {
    const { container } = render(Divider, { props: { orientation: 'vertical' } });
    render(Divider);

    expect(await axe(container)).toHaveNoViolations();
  });
});
