import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { faPlus, faStar, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('IconButton', () => {
  it('does not render an unnamed control', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { container } = render(<IconButton label="" icon={faPlus} />);

    expect(container).toBeEmptyDOMElement();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders one named native button with safe form defaults', () => {
    render(<IconButton label="Add item" icon={faPlus} />);

    const button = screen.getByRole('button', { name: 'Add item' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toBeInTheDocument();
    expect(button.querySelector('.touch-target')).toBeInTheDocument();
    expect(button.querySelector('.state-layer')).toBeInTheDocument();
  });

  it('forwards native button properties and refs', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <IconButton
        ref={ref}
        label="Submit"
        icon={faPlus}
        type="submit"
        data-testid="submit"
      />,
    );

    expect(ref.current).toBe(screen.getByTestId('submit'));
    expect(ref.current).toHaveAttribute('type', 'submit');
  });

  it('calls action callbacks once', () => {
    const onClick = vi.fn();
    render(<IconButton label="Add" icon={faPlus} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks disabled action callbacks', () => {
    const onClick = vi.fn();
    render(<IconButton label="Add" icon={faPlus} disabled onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('owns uncontrolled pressed state and swaps the icon', () => {
    const onPressedChange = vi.fn();
    const { container } = render(
      <IconButton
        label="Favorite"
        icon={faStar}
        pressedIcon={faXmark}
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
        icon={faStar}
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
    render(<IconButton label="Add" icon={faPlus} defaultPressed />);
    expect(screen.getByRole('button', { name: 'Add' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('renders navigation as a link and ignores toggle semantics', () => {
    render(
      <IconButton
        label="Documentation"
        icon={faPlus}
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
        icon={faPlus}
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
      <IconButton label="Keyboard action" icon={faPlus} onClick={onClick} />,
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
      <IconButton label="Pointer action" icon={faPlus} />,
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
        icon={faPlus}
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
    const action = render(<IconButton label="Add item" icon={faPlus} />);
    expect(await axe(action.container)).toHaveNoViolations();
    action.unmount();

    const link = render(
      <IconButton label="Documentation" icon={faPlus} href="/docs" />,
    );
    expect(await axe(link.container)).toHaveNoViolations();
  });
});
