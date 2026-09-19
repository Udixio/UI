import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import ProgressIndicator from './ProgressIndicator.svelte';

describe('ProgressIndicator', () => {
  it('exposes role="progressbar" with aria-valuenow for determinate variants', () => {
    render(ProgressIndicator, {
      props: { variant: 'linear-determinate', value: 40, 'aria-label': 'Upload progress' },
    });
    const progressbar = screen.getByRole('progressbar', { name: 'Upload progress' });

    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow', '40');
  });

  it('clamps out-of-range values before exposing aria-valuenow', async () => {
    const { rerender } = render(ProgressIndicator, {
      props: { variant: 'circular-determinate', value: 140, 'aria-label': 'Upload progress' },
    });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    await rerender({ variant: 'circular-determinate', value: -10, 'aria-label': 'Upload progress' });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('omits aria-valuenow for indeterminate variants', () => {
    render(ProgressIndicator, { props: { variant: 'linear-indeterminate', 'aria-label': 'Loading' } });
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('hides transitionDuration ms after the value reaches 100', async () => {
    vi.useFakeTimers();
    try {
      const classes = vi.fn(() => ({}));
      const { rerender } = render(ProgressIndicator, {
        props: {
          variant: 'linear-determinate',
          value: 40,
          transitionDuration: 500,
          classes,
          'aria-label': 'Upload progress',
        },
      });
      expect(classes).toHaveBeenLastCalledWith(expect.objectContaining({ isVisible: true }));

      await rerender({
        variant: 'linear-determinate',
        value: 100,
        transitionDuration: 500,
        classes,
        'aria-label': 'Upload progress',
      });
      expect(classes).toHaveBeenLastCalledWith(expect.objectContaining({ isVisible: true }));

      vi.advanceTimersByTime(500);
      flushSync();

      expect(classes).toHaveBeenLastCalledWith(expect.objectContaining({ isVisible: false }));
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays visible while the value is below 100', () => {
    vi.useFakeTimers();
    try {
      const classes = vi.fn(() => ({}));
      render(ProgressIndicator, {
        props: {
          variant: 'linear-determinate',
          value: 40,
          transitionDuration: 500,
          classes,
          'aria-label': 'Upload progress',
        },
      });

      vi.advanceTimersByTime(500);
      flushSync();
      expect(classes).toHaveBeenLastCalledWith(expect.objectContaining({ isVisible: true }));
    } finally {
      vi.useRealTimers();
    }
  });

  it('forwards native attributes and exposes complete style state', () => {
    const classes = vi.fn(() => ({}));
    render(ProgressIndicator, {
      props: {
        variant: 'linear-determinate',
        value: 40,
        minHeight: 4,
        classes,
        class: 'extra',
        'aria-label': 'Upload progress',
        'data-testid': 'progress',
      },
    });

    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(classes).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'linear-determinate', value: 40, minHeight: 4 }),
    );
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(ProgressIndicator, {
      props: { variant: 'linear-determinate', value: 40, 'aria-label': 'Upload progress' },
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
