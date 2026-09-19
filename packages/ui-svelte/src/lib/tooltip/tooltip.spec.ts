import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { axe } from 'jest-axe';
import { createTooltipTransitionController } from '@udixio/core/dom';
import Fixture from './tooltip.fixture.svelte';

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return { ...actual, createTooltipTransitionController: vi.fn() };
});

const mockTransitionController = () => ({ setOpen: vi.fn(), destroy: vi.fn() });

// The controller listens to mouseover/mouseout with a relatedTarget check,
// which is what a real pointer produces; `mouseenter` alone never reaches it.
const hover = (element: Element) =>
  fireEvent(element, new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }));
const unhover = (element: Element) =>
  fireEvent(element, new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));

const tick = (ms: number) => {
  vi.advanceTimersByTime(ms);
  flushSync();
};

describe('tooltip attachment', () => {
  beforeEach(() => {
    vi.mocked(createTooltipTransitionController).mockClear();
    vi.mocked(createTooltipTransitionController).mockReturnValue(mockTransitionController());
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.querySelectorAll('[role="tooltip"]').forEach((element) => element.remove());
  });

  it('starts hidden and hides the surface from assistive tech', () => {
    render(Fixture);

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(tooltip).toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Trigger' })).not.toHaveAttribute('aria-describedby');
  });

  it('starts open when defaultOpen is true', () => {
    render(Fixture, { props: { triggers: [{ label: 'Trigger', text: 'Copy', defaultOpen: true }] } });
    flushSync();

    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
  });

  it('opens on hover after openDelay and links aria-describedby, closes after closeDelay', async () => {
    render(Fixture, {
      props: { triggers: [{ label: 'Trigger', text: 'Copy', openDelay: 400, closeDelay: 150 }] },
    });
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    await hover(trigger);
    tick(399);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('aria-hidden', 'true');

    tick(1);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveAttribute('aria-hidden', 'false');
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

    await unhover(trigger);
    tick(149);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    tick(1);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('animates the first opening after the hidden surface is connected', async () => {
    const controller = mockTransitionController();
    vi.mocked(createTooltipTransitionController).mockReturnValue(controller);
    render(Fixture, { props: { triggers: [{ label: 'Trigger', text: 'Copy', openDelay: 400 }] } });
    flushSync();

    expect(controller.setOpen).toHaveBeenCalledWith(false, true);
    controller.setOpen.mockClear();

    await hover(screen.getByRole('button', { name: 'Trigger' }));
    tick(400);

    expect(controller.setOpen).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('opens on focus immediately, without waiting for openDelay', async () => {
    render(Fixture, { props: { triggers: [{ label: 'Trigger', text: 'Copy', openDelay: 400 }] } });
    await fireEvent.focus(screen.getByRole('button', { name: 'Trigger' }));
    flushSync();

    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
  });

  it('can remain visual without duplicating the target accessible name', async () => {
    render(Fixture, { props: { triggers: [{ label: 'Copy', text: 'Copy', describeTarget: false }] } });
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await fireEvent.focus(trigger);
    flushSync();

    expect(screen.getByRole('tooltip')).toHaveTextContent('Copy');
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('keeps only the most recently claimed tooltip visible', async () => {
    render(Fixture, {
      props: {
        triggers: [
          { label: 'First trigger', text: 'First', open: true },
          { label: 'Second trigger', text: 'Second', open: true },
        ],
      },
    });
    flushSync();

    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Second');

    await fireEvent.focus(screen.getByRole('button', { name: 'First trigger' }));
    flushSync();

    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(screen.getByRole('tooltip')).toHaveTextContent('First');
  });

  it('preserves an existing target description', async () => {
    render(Fixture, {
      props: {
        ariaDescribedby: 'existing-description',
        triggers: [{ label: 'Copy', text: 'Copy', describeTarget: false }],
      },
    });
    const trigger = screen.getByRole('button', { name: 'Copy' });

    await fireEvent.focus(trigger);
    flushSync();

    expect(trigger).toHaveAttribute('aria-describedby', 'existing-description');
  });

  it('closes on Escape from the open state', async () => {
    render(Fixture, { props: { triggers: [{ label: 'Trigger', text: 'Copy', defaultOpen: true }] } });
    flushSync();
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Trigger' }), { key: 'Escape' });
    flushSync();

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('toggles immediately for trigger="click" and ignores hover', async () => {
    render(Fixture, { props: { triggers: [{ label: 'Trigger', text: 'Copy', trigger: 'click' }] } });
    const trigger = screen.getByRole('button', { name: 'Trigger' });

    await hover(trigger);
    tick(1000);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('aria-hidden', 'true');

    await fireEvent.click(trigger);
    flushSync();
    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');

    await fireEvent.click(trigger);
    flushSync();
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('requests a controlled transition without mutating the rendered value', async () => {
    const onOpenChange = vi.fn();
    render(Fixture, {
      props: { triggers: [{ label: 'Trigger', text: 'Copy', open: false, onOpenChange, trigger: 'click' }] },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));
    flushSync();

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes the panel once the controlled owner updates open, without remounting', async () => {
    const { rerender } = render(Fixture, {
      props: { triggers: [{ label: 'Trigger', text: 'Copy', open: false }] },
    });
    flushSync();
    const before = screen.getByRole('tooltip', { hidden: true });
    expect(before).toHaveAttribute('aria-hidden', 'true');

    await rerender({ triggers: [{ label: 'Trigger', text: 'Copy', open: true }] });
    flushSync();
    expect(screen.getByRole('tooltip')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByRole('tooltip')).toBe(before);
    expect(createTooltipTransitionController).toHaveBeenCalledTimes(1);
  });

  it('content overrides title/text/buttons', () => {
    render(Fixture, {
      props: {
        custom: true,
        triggers: [{ label: 'Trigger', defaultOpen: true, title: 'Ignored title', text: 'Ignored text' }],
      },
    });
    flushSync();

    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(screen.queryByText('Ignored title')).not.toBeInTheDocument();
    expect(screen.queryByText('Ignored text')).not.toBeInTheDocument();
  });

  it('renders rich variant title, text, and buttons', async () => {
    const onclick = vi.fn();
    render(Fixture, {
      props: {
        triggers: [
          {
            label: 'Trigger',
            defaultOpen: true,
            variant: 'rich',
            title: 'Saved',
            text: 'Item added',
            buttons: [{ label: 'Undo', onclick }],
          },
        ],
      },
    });
    flushSync();

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Item added')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('exposes the resolved open state to a state-aware classes function', () => {
    render(Fixture, {
      props: {
        triggers: [
          {
            label: 'Trigger',
            text: 'Copy',
            defaultOpen: true,
            classes: (state) => ({ toolTip: state.isOpen ? 'is-open' : 'is-closed' }),
          },
        ],
      },
    });
    flushSync();

    expect(screen.getByRole('tooltip')).toHaveClass('is-open');
  });

  it('creates no surface while it has no content', () => {
    render(Fixture, { props: { triggers: [{ label: 'Trigger' }] } });
    flushSync();

    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('removes its surface from the document when the trigger unmounts', () => {
    const { unmount } = render(Fixture);
    flushSync();
    expect(screen.getByRole('tooltip', { hidden: true })).toBeInTheDocument();

    unmount();

    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
  });

  it('has no automated accessibility violations while open', async () => {
    const { container } = render(Fixture, {
      props: { triggers: [{ label: 'Trigger', text: 'Copy', defaultOpen: true }] },
    });
    flushSync();

    expect(await axe(container)).toHaveNoViolations();
    expect(await axe(screen.getByRole('tooltip'))).toHaveNoViolations();
  });

  it('edge-aligns rich tooltip action labels and separates two actions without a chasm', () => {
    render(Fixture, {
      props: {
        triggers: [
          {
            label: 'Trigger',
            defaultOpen: true,
            variant: 'rich',
            title: 'Saved',
            text: 'Item added to favorites',
            buttons: [{ label: 'Undo' }, { label: 'Dismiss' }],
          },
        ],
      },
    });
    flushSync();

    const action = screen.getByRole('button', { name: 'Undo' });
    expect(action.className).toContain('-mx-4');
    expect((action.parentElement as HTMLElement).className).toContain('gap-2');
  });
});
