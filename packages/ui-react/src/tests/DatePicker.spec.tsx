import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, vi } from 'vitest';
import { DatePicker } from '../lib/index.js';

expect.extend(toHaveNoViolations);

const playMonthTransition = vi.fn();

vi.mock('@udixio/core/dom', async () => {
  const actual = await vi.importActual<typeof import('@udixio/core/dom')>(
    '@udixio/core/dom',
  );
  return {
    ...actual,
    createMonthTransitionController: () => ({
      play: playMonthTransition,
      destroy: vi.fn(),
    }),
  };
});

function gridCellOf(dayButton: HTMLElement) {
  return dayButton.parentElement as HTMLElement;
}

describe('DatePicker', () => {
  afterEach(() => {
    vi.useRealTimers();
    playMonthTransition.mockClear();
  });

  it('owns an uncontrolled value and emits each accepted selection once', () => {
    const onChange = vi.fn();
    render(
      <DatePicker defaultValue={new Date(2024, 5, 1)} onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '15' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const selected = onChange.mock.calls[0][0] as Date;
    expect(selected.getDate()).toBe(15);
    expect(gridCellOf(screen.getByRole('button', { name: '15' }))).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('requests a controlled change without mutating the rendered value', () => {
    const onChange = vi.fn();
    render(<DatePicker value={new Date(2024, 5, 1)} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '15' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    // The rendered selection did not move locally: day 1 stays selected.
    expect(gridCellOf(screen.getByRole('button', { name: '1' }))).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      gridCellOf(screen.getByRole('button', { name: '15' })),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('reflects a controlled owner update', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DatePicker value={new Date(2024, 5, 1)} onChange={onChange} />,
    );
    rerender(<DatePicker value={new Date(2024, 5, 20)} onChange={onChange} />);

    expect(
      gridCellOf(screen.getByRole('button', { name: '20' })),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('blocks a transition to a disabled day and does not call onChange', () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        defaultValue={new Date(2024, 5, 15)}
        minDate={new Date(2024, 5, 10)}
        onChange={onChange}
      />,
    );

    const disabledDay = screen.getByRole('button', { name: '5' });
    expect(disabledDay).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(disabledDay);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not disable the minDate day itself when minDate carries a time-of-day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 9, 30));
    render(<DatePicker minDate={new Date(2024, 5, 15, 14, 0)} />);

    const today = screen.getByRole('button', { name: '15' });
    expect(today).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('resolves a single deterministic variant when a day is both selected and today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15));
    render(<DatePicker defaultValue={new Date(2024, 5, 15)} />);

    const day = screen.getByRole('button', { name: '15' });
    // Selection wins over the "today" ring: exactly one Button variant class
    // set is applied, never a broken "filled outlined" combination.
    expect(day.className).toContain('bg-primary');
    expect(day).toHaveAttribute('aria-current', 'date');
  });

  it('exposes hasSelected to the className state contract', () => {
    const className = vi.fn(() => ({}));
    render(<DatePicker className={className} />);
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ hasSelected: false }),
    );

    className.mockClear();
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ hasSelected: true }),
    );
  });

  it('applies the monthNav/monthLabel/dayButton style keys', () => {
    render(<DatePicker defaultValue={new Date(2024, 5, 1)} locale="en-US" />);

    expect(screen.getByLabelText('Previous month').parentElement).toHaveClass(
      'flex',
      'items-center',
    );
    expect(screen.getByRole('button', { name: /June 2024/i })).toHaveClass(
      'text-label-large',
      'font-bold',
      'capitalize',
    );
    expect(screen.getByRole('button', { name: '10' })).toHaveClass(
      'rounded-full',
    );
  });

  it('completes a range in chronological order regardless of click order', () => {
    const onChange = vi.fn();
    render(<DatePicker mode="range" onChange={onChange} locale="en-US" />);

    fireEvent.click(screen.getByRole('button', { name: '20' }));
    fireEvent.click(screen.getByRole('button', { name: '10' }));

    const [start, end] = onChange.mock.calls.at(-1)![0] as [Date, Date];
    expect(start.getDate()).toBe(10);
    expect(end.getDate()).toBe(20);
    expect(
      gridCellOf(screen.getByRole('button', { name: '15' })),
    ).toHaveAttribute('aria-selected', 'false');
  });

  it('exposes the calendar as a grid with row/gridcell roles', () => {
    render(<DatePicker defaultValue={new Date(2024, 5, 1)} locale="en-US" />);

    expect(screen.getByRole('grid')).toHaveAccessibleName(/June 2024/i);
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('moves the roving tabIndex and focus with ArrowRight', () => {
    render(<DatePicker defaultValue={new Date(2024, 5, 10)} locale="en-US" />);

    const day10 = screen.getByRole('button', { name: '10' });
    const day11 = screen.getByRole('button', { name: '11' });
    expect(day10).toHaveAttribute('tabIndex', '0');
    expect(day11).toHaveAttribute('tabIndex', '-1');

    day10.focus();
    fireEvent.keyDown(day10, { key: 'ArrowRight' });

    expect(screen.getByRole('button', { name: '11' })).toHaveAttribute(
      'tabIndex',
      '0',
    );
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute(
      'tabIndex',
      '-1',
    );
    expect(screen.getByRole('button', { name: '11' })).toHaveFocus();
  });

  it('changes month with PageDown and keeps focus on the grid', () => {
    render(<DatePicker defaultValue={new Date(2024, 5, 10)} locale="en-US" />);

    const day10 = screen.getByRole('button', { name: '10' });
    day10.focus();
    fireEvent.keyDown(day10, { key: 'PageDown' });

    expect(screen.getByRole('grid')).toHaveAccessibleName(/July 2024/i);
    expect(screen.getByRole('button', { name: '10' })).toHaveFocus();
  });

  it('plays the shared month-transition animation in the direction of navigation', () => {
    render(<DatePicker defaultValue={new Date(2024, 5, 10)} locale="en-US" />);
    expect(playMonthTransition).toHaveBeenCalledWith(0); // mount, no transition

    playMonthTransition.mockClear();
    fireEvent.click(screen.getByLabelText('Next month'));
    expect(playMonthTransition).toHaveBeenCalledWith(1);

    playMonthTransition.mockClear();
    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(playMonthTransition).toHaveBeenCalledWith(-1);
  });

  it('has no automated accessibility violations', async () => {
    const view = render(<DatePicker defaultValue={new Date(2024, 5, 1)} />);
    expect(await axe(view.container)).toHaveNoViolations();
  });
});

describe('DatePicker first render', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // `locale="default"` resolves through Intl to the runtime's locale: this
  // stands in for a server or a browser running with another one.
  function underRuntimeLocale<T>(runtimeLocale: string, run: () => T): T {
    const RealDateTimeFormat = Intl.DateTimeFormat;
    const spy = vi
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation(function (
        locales?: string | string[],
        options?: Intl.DateTimeFormatOptions,
      ) {
        return new RealDateTimeFormat(
          locales === 'default' ? runtimeLocale : locales,
          options,
        );
      } as typeof Intl.DateTimeFormat);
    try {
      return run();
    } finally {
      spy.mockRestore();
    }
  }

  it('renders the same first markup whatever the clock and the runtime locale', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 17));
    const server = underRuntimeLocale('fr-FR', () =>
      renderToStaticMarkup(<DatePicker />),
    );
    vi.setSystemTime(new Date(2027, 2, 3));
    const browser = underRuntimeLocale('en-US', () =>
      renderToStaticMarkup(<DatePicker />),
    );

    expect(browser).toBe(server);
  });

  it('hydrates a server render made under another clock and locale without a mismatch', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 17));
    const container = document.createElement('div');
    container.innerHTML = underRuntimeLocale('fr-FR', () =>
      renderToString(<DatePicker />),
    );
    document.body.append(container);
    vi.setSystemTime(new Date(2027, 2, 3));

    const errors: unknown[] = [];
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation((...args) => errors.push(args));
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, <DatePicker />, {
          onRecoverableError: (error) => errors.push(error),
        });
      });
      expect(errors).toEqual([]);
      expect(container.querySelector('[role="grid"]')).toHaveAttribute(
        'aria-label',
        new Intl.DateTimeFormat(undefined, {
          month: 'long',
          year: 'numeric',
        }).format(new Date(2027, 2, 1)),
      );
    } finally {
      await act(async () => root?.unmount());
      consoleError.mockRestore();
      container.remove();
    }
  });

  it('keeps a view pinned by an explicit locale and value identical whatever the clock', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 17));
    const server = renderToStaticMarkup(
      <DatePicker defaultValue={new Date(2026, 10, 17)} locale="en-US" />,
    );
    expect(server).toContain('November 2026');

    vi.setSystemTime(new Date(2027, 2, 3));
    const browser = renderToStaticMarkup(
      <DatePicker defaultValue={new Date(2026, 10, 17)} locale="en-US" />,
    );

    expect(browser).toBe(server);
  });
});
