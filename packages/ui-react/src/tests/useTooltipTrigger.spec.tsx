import { act, useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useTooltipTrigger } from '../lib/index.js';

/**
 * `useTooltipTrigger` is public API of `@udixio/ui-react`. These tests pin its
 * contract directly rather than only through `Tooltip`, so a consumer building
 * its own surface is covered.
 */
describe('useTooltipTrigger', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function Harness({
    externalRef = false,
    ...options
  }: { externalRef?: boolean } & Parameters<typeof useTooltipTrigger>[0]) {
    const ownRef = useRef<HTMLButtonElement | null>(null);
    const { triggerRef, tooltipProps, isOpen } = useTooltipTrigger({
      ...options,
      targetRef: externalRef ? ownRef : undefined,
    });
    return (
      <>
        <button ref={externalRef ? ownRef : (triggerRef as never)}>
          trigger
        </button>
        <div {...tooltipProps}>{isOpen ? 'open' : 'closed'}</div>
      </>
    );
  }

  it('returns a ref that wires the trigger behaviour to the element it lands on', () => {
    render(<Harness />);
    const trigger = screen.getByText('trigger');

    fireEvent.mouseOver(trigger, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(400));

    expect(screen.getByRole('tooltip')).toHaveTextContent('open');
  });

  it('returns the caller ref unchanged when one is supplied', () => {
    render(<Harness externalRef />);
    const trigger = screen.getByText('trigger');

    fireEvent.mouseOver(trigger, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(400));

    expect(screen.getByRole('tooltip')).toHaveTextContent('open');
  });

  it('describes the trigger through aria-describedby while open', () => {
    render(<Harness />);
    const trigger = screen.getByText('trigger');
    expect(trigger).not.toHaveAttribute('aria-describedby');

    fireEvent.mouseOver(trigger, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(400));

    expect(trigger.getAttribute('aria-describedby')).toBe(
      screen.getByRole('tooltip').id,
    );
  });

  it('reports an accepted open request through onOpenChange', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);

    fireEvent.mouseOver(screen.getByText('trigger'), {
      relatedTarget: document.body,
    });
    act(() => vi.advanceTimersByTime(400));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('never opens on its own while controlled', () => {
    const onOpenChange = vi.fn();
    render(<Harness open={false} onOpenChange={onOpenChange} />);

    fireEvent.mouseOver(screen.getByText('trigger'), {
      relatedTarget: document.body,
    });
    act(() => vi.advanceTimersByTime(400));

    // The surface is `aria-hidden` while closed, so it is deliberately absent
    // from the accessibility tree -- assert on the rendered text instead.
    expect(screen.getByText('closed')).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).toBeNull();
    // The request is still reported, so a controlled parent can act on it.
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
