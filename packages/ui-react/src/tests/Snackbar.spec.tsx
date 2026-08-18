import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { expect, vi } from 'vitest';
import { Snackbar } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('owns an uncontrolled open state and emits each accepted transition once', () => {
    const onOpenChange = vi.fn();
    render(<Snackbar message="Saved" onOpenChange={onOpenChange} />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close the snackbar' }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts closed when defaultOpen is false', () => {
    render(<Snackbar message="Saved" defaultOpen={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('requests a controlled transition without mutating the rendered value', () => {
    const onOpenChange = vi.fn();
    render(<Snackbar message="Saved" open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close the snackbar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('renders only after the controlled owner updates open', () => {
    const { rerender } = render(<Snackbar message="Saved" open={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(<Snackbar message="Saved" open />);
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('auto-dismisses once after duration elapses', async () => {
    const onOpenChange = vi.fn();
    render(
      <Snackbar message="Saved" duration={1000} onOpenChange={onOpenChange} />,
    );

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onOpenChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false));
  });

  it('cancels the pending auto-dismiss on unmount', () => {
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Snackbar message="Saved" duration={1000} onOpenChange={onOpenChange} />,
    );

    unmount();
    vi.advanceTimersByTime(1000);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders role=status and aria-live=polite', () => {
    render(<Snackbar message="Saved" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Saved');
  });

  it('exposes the resolved open state to a state-aware className function', () => {
    const { container } = render(
      <Snackbar
        message="Saved"
        className={(state) => ({
          snackbar: state.isOpen ? 'is-open' : 'is-closed',
        })}
      />,
    );
    expect(container.querySelector('.bg-inverse-surface')).toHaveClass(
      'is-open',
    );
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(<Snackbar message="Saved" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
