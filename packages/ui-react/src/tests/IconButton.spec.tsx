import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iClose } from '@udixio/icons-rounded-400/close';
import { iStar } from '@udixio/icons-rounded-400/star';
import { IconButton } from '../lib/index.js';

expect.extend(toHaveNoViolations);

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

vi.mock('@udixio/core/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@udixio/core/dom')>();
  return {
    ...actual,
    createTooltipTransitionController: vi.fn(() => ({
      setOpen: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

describe('IconButton', () => {
  it('does not render an unnamed control', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { container } = render(<IconButton label="" icon={iAdd} />);

    expect(container).toBeEmptyDOMElement();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders one named native button with safe form defaults', () => {
    render(<IconButton label="Add item" icon={iAdd} />);

    const button = screen.getByRole('button', { name: 'Add item' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.querySelector('.touch-target')).toBeInTheDocument();
    expect(button.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('shows its accessible label in a tooltip on focus by default', () => {
    render(<IconButton label="Add item" icon={iAdd} />);
    const button = screen.getByRole('button', { name: 'Add item' });

    fireEvent.focus(button);

    expect(screen.getByRole('tooltip')).toHaveTextContent('Add item');
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('supports custom tooltip text and explicit tooltip suppression', () => {
    const custom = render(
      <IconButton label="Add item" icon={iAdd} tooltip="Create a new item" />,
    );
    const button = screen.getByRole('button', { name: 'Add item' });
    fireEvent.focus(button);
    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('Create a new item');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    custom.unmount();

    render(<IconButton label="Close" icon={iClose} tooltip={false} />);
    expect(
      screen.queryByRole('tooltip', { hidden: true }),
    ).not.toBeInTheDocument();
  });

  it('keeps container padding separate from the icon dimensions', () => {
    render(<IconButton label="Add item" icon={iAdd} size="small" />);

    const button = screen.getByRole('button', { name: 'Add item' });
    const icon = button.querySelector('.icon');
    expect(button).toHaveClass('shrink-0', 'p-2');
    expect(icon).toHaveClass('size-6');
    expect(icon).not.toHaveClass('p-2');
  });

  it('forwards native button properties and refs', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <IconButton
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

  it('calls action callbacks once', () => {
    const onClick = vi.fn();
    render(<IconButton label="Add" icon={iAdd} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks disabled action callbacks', () => {
    const onClick = vi.fn();
    render(<IconButton label="Add" icon={iAdd} disabled onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('owns uncontrolled pressed state and swaps the icon', () => {
    const onPressedChange = vi.fn();
    const { container } = render(
      <IconButton
        label="Favorite"
        icon={iStar}
        pressedIcon={iClose}
        toggleable
        defaultPressed
        onPressedChange={onPressedChange}
      />,
    );
    const button = screen.getByRole('button', { name: 'Favorite' });
    const initialPath = container.querySelector('path')?.getAttribute('d');

    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onPressedChange).toHaveBeenCalledWith(false);
    expect(container.querySelector('path')?.getAttribute('d')).not.toBe(
      initialPath,
    );
  });

  it('requests controlled pressed changes without mutating controlled state', () => {
    const onPressedChange = vi.fn();
    render(
      <IconButton
        label="Favorite"
        icon={iStar}
        toggleable
        pressed={false}
        onPressedChange={onPressedChange}
      />,
    );
    const button = screen.getByRole('button', { name: 'Favorite' });

    fireEvent.click(button);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not expose pressed semantics without toggleable', () => {
    render(<IconButton label="Add" icon={iAdd} defaultPressed />);
    expect(screen.getByRole('button', { name: 'Add' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('renders navigation as a link and ignores toggle semantics', () => {
    render(
      <IconButton
        label="Documentation"
        icon={iAdd}
        href="/docs"
        toggleable
        defaultPressed
        aria-current="page"
      />,
    );
    const link = screen.getByRole('link', { name: 'Documentation' });

    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).not.toHaveAttribute('aria-pressed');
  });

  it('makes disabled links inert', () => {
    const onClick = vi.fn();
    render(
      <IconButton
        label="Disabled documentation"
        icon={iAdd}
        href="/docs"
        disabled
        onClick={onClick}
      />,
    );
    const link = screen.getByRole('link', {
      name: 'Disabled documentation',
    });

    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(['Enter', ' '])('preserves native %s keyboard activation', (key) => {
    const onClick = vi.fn();
    render(
      <IconButton label="Keyboard action" icon={iAdd} onClick={onClick} />,
    );
    const button = screen.getByRole('button', { name: 'Keyboard action' });

    expect(
      button.dispatchEvent(
        new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ).toBe(true);
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('connects pointer feedback and cleans it up', () => {
    const { unmount } = render(
      <IconButton label="Pointer action" icon={iAdd} />,
    );
    const button = screen.getByRole('button', { name: 'Pointer action' });

    fireEvent.pointerDown(button, {
      pointerType: 'mouse',
      clientX: 4,
      clientY: 4,
    });
    const ripple = button.querySelector('[data-udixio-ripple]');
    expect(ripple).not.toBeNull();
    unmount();
    expect(ripple?.isConnected).toBe(false);
  });

  it('keeps a static radius when shape feedback is disabled', () => {
    render(
      <IconButton
        label="Static shape"
        icon={iAdd}
        toggleable
        defaultPressed
        shapeFeedback="none"
      />,
    );

    expect(screen.getByRole('button', { name: 'Static shape' })).toHaveStyle({
      borderRadius: '40px',
    });
  });

  it('has no automated accessibility violations as an action or link', async () => {
    const action = render(<IconButton label="Add item" icon={iAdd} />);
    expect(await axe(action.container)).toHaveNoViolations();
    action.unmount();

    const link = render(
      <IconButton label="Documentation" icon={iAdd} href="/docs" />,
    );
    expect(await axe(link.container)).toHaveNoViolations();
  });
});
