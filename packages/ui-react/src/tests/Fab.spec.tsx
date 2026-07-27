import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { Fab } from '../lib/index.js';

expect.extend(toHaveNoViolations);

describe('Fab', () => {
  it('does not render an unnamed control', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
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

  it('renders the visible label only when extended', () => {
    const { rerender } = render(<Fab label="Create" icon={iAdd} />);
    expect(screen.queryByText('Create')).not.toBeInTheDocument();

    rerender(<Fab label="Create" icon={iAdd} extended />);
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).not.toHaveAttribute(
      'aria-label',
    );
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
