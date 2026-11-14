import { act } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ProgressIndicator } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('ProgressIndicator', () => {
  it('exposes role="progressbar" with aria-valuenow for determinate variants', () => {
    render(
      <ProgressIndicator
        variant="linear-determinate"
        value={40}
        aria-label="Upload progress"
      />,
    );
    const progressbar = screen.getByRole('progressbar', {
      name: 'Upload progress',
    });

    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow', '40');
  });

  it('clamps out-of-range values before exposing aria-valuenow', () => {
    const { rerender } = render(
      <ProgressIndicator
        variant="circular-determinate"
        value={140}
        aria-label="Upload progress"
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    );

    rerender(
      <ProgressIndicator
        variant="circular-determinate"
        value={-10}
        aria-label="Upload progress"
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('omits aria-valuenow for indeterminate variants', () => {
    render(
      <ProgressIndicator variant="linear-indeterminate" aria-label="Loading" />,
    );
    expect(screen.getByRole('progressbar')).not.toHaveAttribute(
      'aria-valuenow',
    );
  });

  it('hides transitionDuration ms after the value reaches 100', () => {
    vi.useFakeTimers();
    try {
      const className = vi.fn(() => ({}));
      const { rerender } = render(
        <ProgressIndicator
          variant="linear-determinate"
          value={40}
          transitionDuration={500}
          className={className}
          aria-label="Upload progress"
        />,
      );
      expect(className).toHaveBeenLastCalledWith(
        expect.objectContaining({ isVisible: true }),
      );

      rerender(
        <ProgressIndicator
          variant="linear-determinate"
          value={100}
          transitionDuration={500}
          className={className}
          aria-label="Upload progress"
        />,
      );
      expect(className).toHaveBeenLastCalledWith(
        expect.objectContaining({ isVisible: true }),
      );

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(className).toHaveBeenLastCalledWith(
        expect.objectContaining({ isVisible: false }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays visible while the value is below 100', () => {
    vi.useFakeTimers();
    try {
      const className = vi.fn(() => ({}));
      render(
        <ProgressIndicator
          variant="linear-determinate"
          value={40}
          transitionDuration={500}
          className={className}
          aria-label="Upload progress"
        />,
      );

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(className).toHaveBeenLastCalledWith(
        expect.objectContaining({ isVisible: true }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('forwards native attributes and exposes complete style state', () => {
    const className = vi.fn(() => ({}));
    render(
      <ProgressIndicator
        variant="linear-determinate"
        value={40}
        minHeight={4}
        className={className}
        aria-label="Upload progress"
        data-testid="progress"
      />,
    );

    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'linear-determinate',
        value: 40,
        minHeight: 4,
      }),
    );
  });

  it('has no automated accessibility violations', async () => {
    const view = render(
      <ProgressIndicator
        variant="linear-determinate"
        value={40}
        aria-label="Upload progress"
      />,
    );

    expect(await axe(view.container)).toHaveNoViolations();
  });
});

it.each(['linear-indeterminate', 'circular-indeterminate'] as const)(
  'keeps %s visible and removes an accidental current value',
  (variant) => {
    const className = vi.fn(() => ({}));
    render(
      <ProgressIndicator
        variant={variant}
        value={100}
        aria-label="Loading"
        aria-valuenow={100}
        className={className}
      />,
    );
    expect(screen.getByRole('progressbar')).not.toHaveAttribute(
      'aria-valuenow',
    );
    expect(className).toHaveBeenLastCalledWith(
      expect.objectContaining({ isVisible: true }),
    );
  },
);

it('cancels a pending completion hide when switching to indeterminate', () => {
  vi.useFakeTimers();
  try {
    const className = vi.fn(() => ({}));
    const { rerender } = render(<ProgressIndicator variant="linear-determinate" value={100} transitionDuration={500} className={className} aria-label="Loading" />);
    rerender(<ProgressIndicator variant="circular-indeterminate" value={100} transitionDuration={500} className={className} aria-label="Loading" />);
    act(() => vi.advanceTimersByTime(500));
    expect(className).toHaveBeenLastCalledWith(expect.objectContaining({ isVisible: true }));
  } finally { vi.useRealTimers(); }
});
