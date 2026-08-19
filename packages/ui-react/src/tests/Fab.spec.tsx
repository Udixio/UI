import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { createFabLabelController } from '@udixio/core/dom';
import { Fab } from '../lib/index.js';

expect.extend(toHaveNoViolations);

// A compact fab composes a Tooltip, which positions itself through the anchor
// positioner; jsdom has neither ResizeObserver nor the WAAPI its transition
// needs (same preamble as IconButton.spec.tsx).
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.assign(globalThis, {
  ResizeObserver: (globalThis as any).ResizeObserver ?? NoopResizeObserver,
});

// Mocking `animejs` directly (a transitive dependency of `@udixio/core/dom`)
// corrupts the sibling `@udixio/core` entry's exports under Vite's
// dependency pre-bundling in this workspace -- mocking the already-isolated
// controller factory instead avoids that (see Switch.spec.tsx).
vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createFabLabelController: vi.fn(),
    createTooltipTransitionController: vi.fn(() => ({
      setOpen: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

function mockController() {
  return { update: vi.fn(), destroy: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createFabLabelController).mockImplementation(
    () => mockController() as never,
  );
});

describe('Fab', () => {
  it('does not render an unnamed control', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { container } = render(<Fab label="" icon={iAdd} />);

    expect(container).toBeEmptyDOMElement();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders a named action with safe form defaults', () => {
    render(<Fab label="Create" icon={iAdd} />);
    const button = screen.getByRole('button', { name: 'Create' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.querySelector('.touch-target')).toBeInTheDocument();
    expect(button.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('keeps the label mounted but collapsed until the fab is extended', () => {
    // The label element is always rendered so the shared Anime.js Layout
    // controller can diff its width open and closed; the compact state
    // renders it zero-width and hides it from the accessibility tree instead
    // of unmounting it.
    const { rerender } = render(<Fab label="Create" icon={iAdd} />);
    const button = screen.getByRole('button', { name: 'Create' });
    const label = button.querySelector('.label')!;
    expect(label).toHaveStyle({ width: '0px', opacity: '0' });
    expect(label).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAttribute('aria-label', 'Create');

    rerender(<Fab label="Create" icon={iAdd} extended />);
    expect(
      screen.getByRole('button', { name: 'Create' }).querySelector('.label'),
    ).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('button', { name: 'Create' })).not.toHaveAttribute(
      'aria-label',
    );
  });

  it('names its icon in a tooltip while compact, without describing itself twice', () => {
    // Material 3 asks a fab to show its icon's text label on hover; the label
    // is already the accessible name, so the tooltip must not also describe
    // the target.
    render(<Fab label="Create" icon={iAdd} />);
    const button = screen.getByRole('button', { name: 'Create' });

    fireEvent.focus(button);

    expect(screen.getByRole('tooltip')).toHaveTextContent('Create');
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('drops the tooltip once extended, its label being visible', () => {
    render(<Fab label="Create" icon={iAdd} extended />);
    const button = screen.getByRole('button', { name: 'Create' });

    fireEvent.focus(button);

    expect(
      screen.queryByRole('tooltip', { hidden: true }),
    ).not.toBeInTheDocument();
  });

  it('supports custom tooltip text and explicit tooltip suppression', () => {
    const custom = render(
      <Fab label="Create" icon={iAdd} tooltip="Create a new item" />,
    );
    const button = screen.getByRole('button', { name: 'Create' });
    fireEvent.focus(button);
    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('Create a new item');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    custom.unmount();

    render(<Fab label="Edit" icon={iAdd} tooltip={false} />);
    expect(
      screen.queryByRole('tooltip', { hidden: true }),
    ).not.toBeInTheDocument();
  });

  it('renders a fab that mounts extended with its label already open', () => {
    // The resting style is captured once, at mount: from then on the label's
    // width and opacity belong to the controller, so React must not keep
    // rewriting them behind its back.
    render(<Fab label="Edit" icon={iAdd} extended />);

    expect(screen.getByText('Edit')).toHaveStyle({
      width: 'auto',
      opacity: '1',
    });
  });

  it('wires the label controller once and updates it on every extended change', () => {
    // Recreating the controller would reset its "first apply is instant"
    // bookkeeping and re-record the Layout baseline, so a toggle would replay
    // as a fresh mount and silently never animate.
    const controller = mockController();
    vi.mocked(createFabLabelController).mockReturnValue(controller as never);

    const { rerender } = render(<Fab label="Create" icon={iAdd} />);
    expect(createFabLabelController).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createFabLabelController).mock.calls[0][0].label).toBe(
      screen.getByRole('button', { name: 'Create' }).querySelector('.label'),
    );

    rerender(<Fab label="Create" icon={iAdd} extended />);
    rerender(<Fab label="Create" icon={iAdd} />);

    expect(createFabLabelController).toHaveBeenCalledTimes(1);
    // One no-op call on mount, then one per transition.
    expect(controller.update).toHaveBeenCalledTimes(3);
  });

  it('forwards native action attributes and refs', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Fab
        ref={ref}
        label="Submit"
        icon={iAdd}
        type="submit"
        data-testid="submit"
      />,
    );

    expect(ref.current).toBe(screen.getByTestId('submit'));
    expect(ref.current).toHaveAttribute('type', 'submit');
  });

  it('fires actions and blocks disabled actions', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Fab label="Create" icon={iAdd} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Fab label="Create" icon={iAdd} onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders links and makes disabled links inert', () => {
    const { rerender } = render(
      <Fab label="Create" icon={iAdd} href="/create" aria-current="page" />,
    );
    let link = screen.getByRole('link', { name: 'Create' });
    expect(link).toHaveAttribute('href', '/create');
    expect(link).toHaveAttribute('aria-current', 'page');

    rerender(<Fab label="Create" icon={iAdd} href="/create" disabled />);
    link = screen.getByRole('link', { name: 'Create' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
  });

  it('connects pointer feedback and cleans it up', () => {
    const { unmount } = render(<Fab label="Create" icon={iAdd} />);
    const button = screen.getByRole('button', { name: 'Create' });
    fireEvent.pointerDown(button, { pointerType: 'mouse' });
    const ripple = button.querySelector('[data-udixio-ripple]');

    expect(ripple).not.toBeNull();
    unmount();
    expect(ripple?.isConnected).toBe(false);
  });

  it('has no automated accessibility violations', async () => {
    const { container } = render(
      <div>
        <Fab label="Create" icon={iAdd} />
        <Fab label="Edit" icon={iAdd} extended />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
