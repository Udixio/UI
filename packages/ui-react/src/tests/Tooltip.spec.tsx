import React, { act, useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { Button, Tooltip } from '../lib/index.js';
import { createTooltipTransitionController } from '@udixio/core/dom';

expect.extend(toHaveNoViolations);

// jsdom lacks ResizeObserver; AnchorPositioner's fallback controller needs it
// to mount when the environment reports no CSS Anchor Positioning support.
beforeAll(() => {
  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.assign(globalThis, {
    ResizeObserver: (globalThis as any).ResizeObserver ?? NoopObserver,
  });
});

// Mocking `animejs` directly (a transitive dependency of `@udixio/core/dom`)
// corrupts the sibling `@udixio/core` entry's exports under Vite's
// dependency pre-bundling in this workspace -- mocking the already-isolated
// `createTooltipTransitionController` factory instead avoids that.
vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createTooltipTransitionController: vi.fn(),
  };
});

function mockTransitionController() {
  return { setOpen: vi.fn(), destroy: vi.fn() };
}

function dispatchPointerEvent(
  element: Element,
  type: string,
  init: Partial<PointerEvent> & { pointerType: string; pointerId: number },
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: init.clientX,
    clientY: init.clientY,
  });
  Object.defineProperties(event, {
    pointerType: { value: init.pointerType },
    pointerId: { value: init.pointerId },
  });
  fireEvent(element, event);
}

describe('Tooltip', () => {
  beforeEach(() => {
    vi.mocked(createTooltipTransitionController).mockReturnValue(
      mockTransitionController(),
    );
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts hidden and hides the surface from assistive tech', () => {
    render(
      <Tooltip text="Copy">
        <Button label="Trigger" />
      </Tooltip>,
    );

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(tooltip).toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Trigger' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('starts open when defaultOpen is true', () => {
    render(
      <Tooltip text="Copy" defaultOpen>
        <Button label="Trigger" />
      </Tooltip>,
    );

    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
  });

  it('opens on hover after openDelay and links aria-describedby, closes after closeDelay', () => {
    render(
      <Tooltip text="Copy" openDelay={400} closeDelay={150}>
        <Button label="Trigger" />
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    fireEvent.mouseEnter(trigger);
    act(() => vi.advanceTimersByTime(399));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    act(() => vi.advanceTimersByTime(1));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-hidden', 'false');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    fireEvent.mouseLeave(trigger);
    act(() => vi.advanceTimersByTime(149));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('cancels stale openings while rapidly hovering a list of triggers', () => {
    render(
      <>
        <Tooltip text="First" openDelay={400}>
          <Button label="First trigger" />
        </Tooltip>
        <Tooltip text="Second" openDelay={400}>
          <Button label="Second trigger" />
        </Tooltip>
        <Tooltip text="Last" openDelay={400}>
          <Button label="Last trigger" />
        </Tooltip>
      </>,
    );
    const first = screen.getByRole('button', { name: 'First trigger' });
    const second = screen.getByRole('button', { name: 'Second trigger' });
    const last = screen.getByRole('button', { name: 'Last trigger' });

    fireEvent.mouseEnter(first);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.mouseLeave(first);
    fireEvent.mouseEnter(second);
    act(() => vi.advanceTimersByTime(100));
    fireEvent.mouseLeave(second);
    fireEvent.mouseEnter(last);

    act(() => vi.advanceTimersByTime(399));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));

    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Last');
  });

  it('animates the first opening after the hidden surface is connected', () => {
    const controller = mockTransitionController();
    vi.mocked(createTooltipTransitionController).mockReturnValue(controller);
    render(
      <Tooltip text="Copy" openDelay={400}>
        <Button label="Trigger" />
      </Tooltip>,
    );

    expect(controller.setOpen).toHaveBeenCalledWith(false, true);
    controller.setOpen.mockClear();

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));
    act(() => vi.advanceTimersByTime(400));

    expect(controller.setOpen).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('opens on focus immediately, without waiting for openDelay', () => {
    render(
      <Tooltip text="Copy" openDelay={400}>
        <Button label="Trigger" />
      </Tooltip>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));

    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
  });

  it('keeps a long-press tooltip visible for 1.5s after touch release', () => {
    render(
      <Tooltip text="Copy">
        <Button label="Trigger" />
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    dispatchPointerEvent(trigger, 'pointerdown', {
      pointerType: 'touch',
      pointerId: 7,
      clientX: 20,
      clientY: 30,
    });
    expect(fireEvent.contextMenu(trigger)).toBe(false);
    act(() => vi.advanceTimersByTime(499));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');

    dispatchPointerEvent(trigger, 'pointerup', {
      pointerType: 'touch',
      pointerId: 7,
    });
    act(() => vi.advanceTimersByTime(1499));
    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('does not open for a short touch or a moved touch', () => {
    render(
      <Tooltip text="Copy">
        <Button label="Trigger" />
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    dispatchPointerEvent(trigger, 'pointerdown', {
      pointerType: 'touch',
      pointerId: 3,
      clientX: 0,
      clientY: 0,
    });
    act(() => vi.advanceTimersByTime(200));
    dispatchPointerEvent(trigger, 'pointerup', {
      pointerType: 'touch',
      pointerId: 3,
    });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    dispatchPointerEvent(trigger, 'pointerdown', {
      pointerType: 'touch',
      pointerId: 4,
      clientX: 0,
      clientY: 0,
    });
    dispatchPointerEvent(trigger, 'pointermove', {
      pointerType: 'touch',
      pointerId: 4,
      clientX: 20,
      clientY: 0,
    });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('can remain visual without duplicating the target accessible name', () => {
    render(
      <Tooltip text="Copy" describeTarget={false}>
        <Button label="Copy" />
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Copy' });

    fireEvent.focus(trigger);

    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy');
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('keeps only the most recently claimed tooltip visible', () => {
    render(
      <>
        <Tooltip text="First" open>
          <Button label="First trigger" />
        </Tooltip>
        <Tooltip text="Second" open>
          <Button label="Second trigger" />
        </Tooltip>
      </>,
    );

    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Second');

    fireEvent.focus(screen.getByRole('button', { name: 'First trigger' }));

    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(screen.getByRole('tooltip')).toHaveTextContent('First');
  });

  it('preserves an existing target description', () => {
    render(
      <>
        <span id="existing-description">Existing</span>
        <Tooltip text="Copy" describeTarget={false}>
          <Button label="Copy" aria-describedby="existing-description" />
        </Tooltip>
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Copy' });

    fireEvent.focus(trigger);

    expect(trigger).toHaveAttribute('aria-describedby', 'existing-description');
  });

  it('closes on Escape from the open state', () => {
    render(
      <Tooltip text="Copy" defaultOpen>
        <Button label="Trigger" />
      </Tooltip>,
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Trigger' }), {
      key: 'Escape',
    });

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('toggles immediately for trigger="click" and ignores hover', () => {
    render(
      <Tooltip text="Copy" trigger="click">
        <Button label="Trigger" />
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    fireEvent.mouseEnter(trigger);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    fireEvent.click(trigger);
    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');

    fireEvent.click(trigger);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('requests a controlled transition without mutating the rendered value', () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip
        text="Copy"
        open={false}
        onOpenChange={onOpenChange}
        trigger="click"
      >
        <Button label="Trigger" />
      </Tooltip>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('exposes the panel once the controlled owner updates open', () => {
    const { rerender } = render(
      <Tooltip text="Copy" open={false}>
        <Button label="Trigger" />
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    rerender(
      <Tooltip text="Copy" open>
        <Button label="Trigger" />
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
  });

  it('content overrides title/text/buttons', () => {
    render(
      <Tooltip
        defaultOpen
        title="Ignored title"
        text="Ignored text"
        content={<span>Custom content</span>}
      >
        <Button label="Trigger" />
      </Tooltip>,
    );

    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(screen.queryByText('Ignored title')).not.toBeInTheDocument();
    expect(screen.queryByText('Ignored text')).not.toBeInTheDocument();
  });

  it('renders rich variant title, text, and buttons', () => {
    const onClick = vi.fn();
    render(
      <Tooltip
        defaultOpen
        variant="rich"
        title="Saved"
        text="Item added"
        buttons={[{ label: 'Undo', onClick }]}
      >
        <Button label="Trigger" />
      </Tooltip>,
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Item added')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports targetRef mode without a projected child', () => {
    function Harness() {
      const ref = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={ref}>External trigger</button>
          <Tooltip text="Copy" targetRef={ref} defaultOpen />
        </>
      );
    }
    render(<Harness />);

    const trigger = screen.getByRole('button', { name: 'External trigger' });
    const tooltip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('exposes the resolved open state to a state-aware className function', () => {
    render(
      <Tooltip
        text="Copy"
        defaultOpen
        className={(state) => ({
          toolTip: state.isOpen ? 'is-open' : 'is-closed',
        })}
      >
        <Button label="Trigger" />
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toHaveClass('is-open');
  });

  it('has no automated accessibility violations while open', async () => {
    const { container } = render(
      <Tooltip text="Copy" defaultOpen>
        <Button label="Trigger" />
      </Tooltip>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
